"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { useSession } from "@/lib/auth-client";
import { addDays, nowIST, weekday } from "@/lib/time";
import { dateLabel, durationLabel, minutesToLabel, rupees } from "@/lib/format";
import {
  createBookingAction,
  getSlotsAction,
  resumePaymentAction,
  switchToCashAction,
  verifyPaymentAction,
  type CheckoutPayload,
} from "@/app/actions/booking";
import { payWithRazorpay } from "../payments/razorpay-checkout";

type Svc = { id: number; name: string; price: number; durationMin: number; description: string };
type Props = {
  businessName: string;
  menu: { id: number; name: string; services: Svc[] }[];
  staff: { id: number; name: string; title: string }[];
  methods: ("online" | "cash")[];
  advanceDays: number;
  closedWeekdays: number[];
  closedDates: string[];
  dayLength: number;
  policy: { allowCancel: boolean; freeHours: number; fee: string };
};
type Slot = { start: number; end: number; available: boolean; left: number };

const STORE = "opal-book-draft";
const EASE = [0.16, 1, 0.3, 1] as const;

export function BookingWizard(p: Props) {
  const { data: session, isPending: sessionLoading } = useSession();
  const all = useMemo(() => p.menu.flatMap((c) => c.services), [p.menu]);
  const steps = p.staff.length ? ["Treatments", "Therapist", "Time", "Details"] : ["Treatments", "Time", "Details"];

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotMsg, setSlotMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [method, setMethod] = useState<"online" | "cash">(p.methods[0] ?? "cash");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ code: string; method: "online" | "cash" } | null>(null);
  const [unpaid, setUnpaid] = useState<{ bookingId: string; code: string } | null>(null);

  // Restore a draft (after sign-in) or preselect from ?service=
  useEffect(() => {
    const raw = sessionStorage.getItem(STORE);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setSelected((d.selected ?? []).filter((id: number) => all.some((s) => s.id === id)));
        setStaffId(d.staffId ?? null);
        setDate(d.date ?? null);
        setSlot(d.slot ?? null);
        setForm((f) => ({ ...f, ...(d.form ?? {}) }));
        if (typeof d.step === "number") setStep(Math.min(d.step, steps.length - 1));
      } catch {}
      sessionStorage.removeItem(STORE);
      return;
    }
    const sp = new URLSearchParams(window.location.search).get("service");
    const id = sp ? Number(sp) : NaN;
    if (all.some((s) => s.id === id)) setSelected([id]);
  }, [all, steps.length]);

  useEffect(() => {
    if (!session?.user) return;
    const u = session.user as { name: string; email: string; phone?: string | null };
    setForm((f) => ({ name: f.name || u.name || "", email: f.email || u.email || "", phone: f.phone || u.phone || "", notes: f.notes }));
  }, [session]);

  const chosen = all.filter((s) => selected.includes(s.id));
  const total = chosen.reduce((n, s) => n + s.price, 0);
  const duration = chosen.reduce((n, s) => n + s.durationMin, 0);
  const tooLong = duration > p.dayLength;

  const today = nowIST().ymd;
  const days = useMemo(
    () =>
      Array.from({ length: p.advanceDays + 1 }, (_, i) => {
        const d = addDays(today, i);
        const closed = p.closedWeekdays.includes(weekday(d)) || p.closedDates.includes(d);
        return { d, closed };
      }),
    [today, p.advanceDays, p.closedWeekdays, p.closedDates],
  );

  const stepName = steps[step];

  // Load slots when date/services/staff change
  useEffect(() => {
    if (stepName !== "Time" || !date || !selected.length) return;
    let alive = true;
    setSlots(null);
    setSlotMsg(null);
    getSlotsAction({ date, serviceIds: selected, staffId }).then((r) => {
      if (!alive) return;
      if (!r.ok) {
        setSlots([]);
        setSlotMsg(r.error);
        return;
      }
      setSlots(r.slots);
      if (slot !== null && !r.slots.some((s) => s.start === slot && s.available)) setSlot(null);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selected.join(","), staffId, stepName]);

  const canNext =
    stepName === "Treatments" ? selected.length > 0 && !tooLong : stepName === "Therapist" ? true : stepName === "Time" ? date !== null && slot !== null : false;

  const next = () => {
    setError(null);
    setStep((s) => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const saveDraftAndSignIn = () => {
    sessionStorage.setItem(STORE, JSON.stringify({ selected, staffId, date, slot, form, step }));
  };

  async function runCheckout(checkout: CheckoutPayload, bookingId: string, code: string) {
    let res;
    try {
      res = await payWithRazorpay(checkout, p.businessName);
    } catch (e) {
      setUnpaid({ bookingId, code });
      setError((e as Error).message);
      return;
    }
    if (!res) {
      setUnpaid({ bookingId, code });
      return;
    }
    const v = await verifyPaymentAction(res);
    if (!v.ok) {
      setError(v.error);
      setUnpaid(null);
      setDone({ code, method: "online" });
      return;
    }
    setUnpaid(null);
    setDone({ code, method: "online" });
  }

  const submit = () => {
    setError(null);
    if (date === null || slot === null) return;
    start(async () => {
      const r = await createBookingAction({
        serviceIds: selected,
        date,
        startMin: slot,
        staffId,
        name: form.name,
        phone: form.phone,
        email: form.email,
        notes: form.notes || undefined,
        method,
      });
      if (!r.ok) {
        setError(r.error);
        if (r.error.includes("took that time")) {
          setSlot(null);
          setStep(steps.indexOf("Time"));
        }
        return;
      }
      if (!r.checkout) {
        setDone({ code: r.code, method: "cash" });
        return;
      }
      await runCheckout(r.checkout, r.bookingId, r.code);
    });
  };

  const retry = () =>
    unpaid &&
    start(async () => {
      setError(null);
      const r = await resumePaymentAction("booking", unpaid.bookingId);
      if (!r.ok) {
        setError(r.error);
        setUnpaid(null);
        return;
      }
      await runCheckout(r.checkout, unpaid.bookingId, unpaid.code);
    });

  const payAtSalon = () =>
    unpaid &&
    start(async () => {
      const r = await switchToCashAction(unpaid.bookingId);
      if (!r.ok) return setError(r.error);
      setDone({ code: unpaid.code, method: "cash" });
      setUnpaid(null);
    });

  if (done) {
    return (
      <section className="mx-auto flex min-h-[80vh] max-w-3xl flex-col justify-center px-5 pb-24 pt-36 md:px-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }}>
          <p className="eyebrow">Booking {done.code}</p>
          <h1 className="display mt-5 text-5xl md:text-7xl">
            See you <em className="text-brand">soon.</em>
          </h1>
          <div className="mt-10 card grid gap-6 p-6 text-sm md:grid-cols-3">
            <div>
              <p className="eyebrow mb-2">When</p>
              <p>{date && dateLabel(date)}</p>
              <p>{slot !== null && `${minutesToLabel(slot)} – ${minutesToLabel(slot + duration)}`}</p>
            </div>
            <div>
              <p className="eyebrow mb-2">What</p>
              {chosen.map((c) => (
                <p key={c.id}>{c.name}</p>
              ))}
            </div>
            <div>
              <p className="eyebrow mb-2">Payment</p>
              <p>{done.method === "online" ? (error ? "Confirming with the bank" : `Paid ${rupees(total)}`) : `${rupees(total)} at the salon`}</p>
            </div>
          </div>
          {error && <p className="mt-6 text-sm text-warn">{error}</p>}
          <p className="mt-8 max-w-lg text-sm leading-relaxed text-mute">
            Arriving a few minutes early gives you time to settle in. You can see or cancel this booking from your account.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/account" className="rounded-full bg-brand px-7 py-4 text-sm text-paper hover:bg-brand-700">
              My bookings
            </Link>
            <Link href="/" className="rounded-full border border-line px-7 py-4 text-sm hover:border-ink">
              Back home
            </Link>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1280px] px-5 pb-24 pt-32 md:px-8 md:pt-40">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Book a visit</p>
          <h1 className="display mt-4 text-4xl md:text-6xl">
            {stepName === "Treatments" && <>What would you <em className="text-brand">like?</em></>}
            {stepName === "Therapist" && <>Anyone in <em className="text-brand">mind?</em></>}
            {stepName === "Time" && <>Pick a <em className="text-brand">time</em></>}
            {stepName === "Details" && <>Almost <em className="text-brand">done</em></>}
          </h1>
        </div>
        <ol className="flex gap-2 text-xs" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s}>
              <button
                disabled={i > step}
                onClick={() => i < step && setStep(i)}
                className={clsx(
                  "rounded-full border px-3.5 py-1.5 tracking-wide transition-colors",
                  i === step ? "border-brand bg-brand text-white" : i < step ? "border-brand/40 text-brand hover:bg-ivory" : "border-line text-mute",
                )}
                aria-current={i === step ? "step" : undefined}
              >
                {i + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepName}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              {stepName === "Treatments" && (
                <div className="space-y-12">
                  {p.menu.map((cat) => (
                    <div key={cat.id}>
                      <h2 className="display mb-4 text-3xl">{cat.name}</h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {cat.services.map((s) => {
                          const on = selected.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelected((cur) => (on ? cur.filter((x) => x !== s.id) : cur.length >= 6 ? cur : [...cur, s.id]))}
                              aria-pressed={on}
                              className={clsx(
                                "group relative flex flex-col rounded-2xl border p-5 text-left transition-all duration-300",
                                on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/50",
                              )}
                            >
                              <span className="flex items-start justify-between gap-4">
                                <span className="display text-2xl leading-tight">{s.name}</span>
                                <span
                                  className={clsx(
                                    "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.7rem]",
                                    on ? "border-paper bg-paper text-brand" : "border-line",
                                  )}
                                  aria-hidden
                                >
                                  {on ? "✓" : ""}
                                </span>
                              </span>
                              <span className={clsx("mt-2 line-clamp-2 text-sm", on ? "text-brand-50/80" : "text-mute")}>{s.description}</span>
                              <span className="mt-4 flex justify-between text-sm">
                                <span className={on ? "text-brand-50/80" : "text-mute"}>{durationLabel(s.durationMin)}</span>
                                <span className="font-display text-xl">{rupees(s.price)}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {tooLong && <p className="text-sm text-bad">That's longer than a full day. Please remove a treatment.</p>}
                </div>
              )}

              {stepName === "Therapist" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[{ id: null as number | null, name: "No preference", title: "First available therapist" }, ...p.staff].map((st) => (
                    <button
                      key={st.id ?? "any"}
                      onClick={() => setStaffId(st.id)}
                      className={clsx(
                        "flex items-center gap-4 rounded-2xl border p-5 text-left transition-colors",
                        staffId === st.id ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/50",
                      )}
                    >
                      <span className={clsx("flex h-12 w-12 items-center justify-center rounded-full font-display text-xl", staffId === st.id ? "bg-paper text-brand" : "bg-brand-50 text-brand")}>
                        {st.id ? st.name[0] : "✦"}
                      </span>
                      <span>
                        <span className="display block text-2xl">{st.name}</span>
                        <span className={clsx("text-sm", staffId === st.id ? "text-brand-50/80" : "text-mute")}>{st.title}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {stepName === "Time" && (
                <div>
                  <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0" data-lenis-prevent>
                    {days.map(({ d, closed }) => {
                      const [, , dd] = d.split("-");
                      const on = d === date;
                      return (
                        <button
                          key={d}
                          disabled={closed}
                          onClick={() => {
                            setDate(d);
                            setSlot(null);
                          }}
                          className={clsx(
                            "flex w-[4.6rem] shrink-0 flex-col items-center rounded-2xl border py-3 transition-colors",
                            closed ? "cursor-not-allowed border-line text-mute/40 line-through" : on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/50",
                          )}
                        >
                          <span className="text-[0.65rem] uppercase tracking-[0.15em]">{d === today ? "Today" : dateLabel(d, { weekday: "short", day: undefined, month: undefined, year: undefined })}</span>
                          <span className="display text-3xl">{Number(dd)}</span>
                          <span className="text-[0.65rem] uppercase tracking-[0.15em] opacity-70">{dateLabel(d, { month: "short", weekday: undefined, day: undefined, year: undefined })}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-10 min-h-48">
                    {!date && <p className="text-mute">Choose a day to see open times.</p>}
                    {date && slots === null && (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="h-12 animate-pulse rounded-xl bg-ivory" />
                        ))}
                      </div>
                    )}
                    {date && slots && slots.length === 0 && <p className="text-mute">{slotMsg ?? "No open times left on this day. Try another date."}</p>}
                    {date && slots && slots.length > 0 && (
                      <>
                        <p className="mb-4 text-sm text-mute">
                          {dateLabel(date)} · {durationLabel(duration)} session
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                          {slots.map((s, i) => (
                            <motion.button
                              key={s.start}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(i * 0.015, 0.4) }}
                              disabled={!s.available}
                              onClick={() => setSlot(s.start)}
                              className={clsx(
                                "h-12 rounded-xl border text-sm font-medium transition-colors",
                                !s.available ? "cursor-not-allowed border-line bg-ivory/50 text-mute/50 line-through" : slot === s.start ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/50",
                              )}
                            >
                              {minutesToLabel(s.start)}
                            </motion.button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {stepName === "Details" && (
                <div>
                  {sessionLoading ? (
                    <div className="h-40 animate-pulse bg-ivory" />
                  ) : !session?.user ? (
                    <div className="card p-8">
                      <p className="display text-3xl">Sign in to confirm</p>
                      <p className="mt-2 max-w-md text-sm text-mute">
                        We keep your bookings in one place so you can see, change or cancel them later. Your selection is saved.
                      </p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link href="/sign-in?next=/book" onClick={saveDraftAndSignIn} className="rounded-full bg-brand px-6 py-3 text-sm text-paper hover:bg-brand-700">
                          Sign in
                        </Link>
                        <Link href="/sign-up?next=/book" onClick={saveDraftAndSignIn} className="rounded-full border border-line px-6 py-3 text-sm hover:border-ink">
                          Create an account
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <form
                      className="grid gap-5 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                      }}
                    >
                      <label className="text-sm">
                        <span className="mb-1.5 block text-mute">Full name</span>
                        <input className="field" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1.5 block text-mute">Mobile number</span>
                        <input className="field" required inputMode="tel" placeholder="98xxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
                      </label>
                      <label className="text-sm sm:col-span-2">
                        <span className="mb-1.5 block text-mute">Email</span>
                        <input className="field" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                      </label>
                      <label className="text-sm sm:col-span-2">
                        <span className="mb-1.5 block text-mute">Anything we should know? (optional)</span>
                        <textarea className="field min-h-24" maxLength={500} placeholder="Pressure preference, allergies, a therapist you liked last time…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                      </label>

                      <fieldset className="sm:col-span-2">
                        <legend className="mb-3 text-sm text-mute">Payment</legend>
                        {p.methods.length === 0 && <p className="text-sm text-bad">Booking is paused right now. Please call the salon.</p>}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {p.methods.map((m) => (
                            <label
                              key={m}
                              className={clsx(
                                "flex cursor-pointer items-start gap-3 rounded-2xl border p-5 transition-colors",
                                method === m ? "border-brand bg-ivory" : "border-line bg-white hover:border-brand/50",
                              )}
                            >
                              <input type="radio" name="method" className="mt-1 accent-[#d6336c]" checked={method === m} onChange={() => setMethod(m)} />
                              <span>
                                <span className="block font-medium">{m === "online" ? "Pay now" : "Pay at the salon"}</span>
                                <span className="text-sm text-mute">{m === "online" ? "UPI, cards, net banking via Razorpay" : "Cash, UPI or card after your session"}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      {unpaid ? (
                        <div className="rounded-2xl border border-warn/40 bg-warn/5 p-5 sm:col-span-2">
                          <p className="font-medium">Payment not finished</p>
                          <p className="mt-1 text-sm text-mute">Your slot is held for a few minutes. Try again, or keep the booking and pay at the salon.</p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button type="button" onClick={retry} disabled={pending} className="rounded-full bg-brand px-6 py-3 text-sm text-paper disabled:opacity-60">
                              Try payment again
                            </button>
                            {p.methods.includes("cash") && (
                              <button type="button" onClick={payAtSalon} disabled={pending} className="rounded-full border border-line px-6 py-3 text-sm">
                                Pay at the salon instead
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={pending || p.methods.length === 0}
                            className="w-full rounded-full bg-brand py-4 text-sm tracking-wide text-paper transition-colors hover:bg-brand-700 disabled:opacity-60 sm:w-auto sm:px-12"
                          >
                            {pending ? "Please wait…" : method === "online" ? `Pay ${rupees(total)} and confirm` : "Confirm booking"}
                          </button>
                        </div>
                      )}
                      {error && <p className="text-sm text-bad sm:col-span-2" role="alert">{error}</p>}
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {stepName !== "Details" && (
            <div className="mt-12 flex items-center gap-4">
              {step > 0 && (
                <button onClick={back} className="rounded-full border border-line px-6 py-3.5 text-sm hover:border-ink">
                  Back
                </button>
              )}
              <button
                onClick={next}
                disabled={!canNext}
                className="rounded-full bg-brand px-8 py-3.5 text-sm text-paper transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          )}
          {stepName === "Details" && (
            <button onClick={back} className="mt-8 text-sm text-mute underline underline-offset-4">
              Back to time
            </button>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="card sticky top-28 p-6">
            <p className="eyebrow">Your visit</p>
            {chosen.length === 0 ? (
              <p className="mt-4 text-sm text-mute">Nothing selected yet.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {chosen.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3">
                    <span>
                      {c.name}
                      <span className="block text-xs text-mute">{durationLabel(c.durationMin)}</span>
                    </span>
                    <span>{rupees(c.price)}</span>
                  </li>
                ))}
              </ul>
            )}
            {(date || staffId) && (
              <div className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
                {staffId && <p>With {p.staff.find((s) => s.id === staffId)?.name}</p>}
                {date && <p>{dateLabel(date)}</p>}
                {slot !== null && (
                  <p>
                    {minutesToLabel(slot)} – {minutesToLabel(slot + duration)}
                  </p>
                )}
              </div>
            )}
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-sm">Total</span>
              <span className="display text-3xl">{rupees(total)}</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-mute">
              {p.policy.allowCancel
                ? p.policy.freeHours > 0
                  ? `Free cancellation up to ${p.policy.freeHours} hours before. After that, a fee of ${p.policy.fee} applies to online payments.`
                  : `A cancellation fee of ${p.policy.fee} applies to online payments.`
                : "To cancel, please call the salon."}{" "}
              <Link href="/cancellation-policy" className="underline">
                Policy
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
