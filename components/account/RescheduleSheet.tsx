"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check } from "../Check";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { myRescheduleSlotsAction, rescheduleMyBookingAction } from "@/app/actions/booking";
import { addDays, nowIST, weekday } from "@/lib/time";
import { dateLabel, durationLabel, minutesToLabel } from "@/lib/format";
import { getLenis } from "../motion/SmoothScroll";

type Slot = { start: number; end: number; available: boolean };

export type RescheduleRules = { advanceDays: number; closedWeekdays: number[]; closedDates: string[] };

export function RescheduleSheet({
  open,
  onClose,
  booking,
  rules,
  movesLeft,
}: {
  open: boolean;
  onClose: () => void;
  booking: { id: string; date: string; startMin: number; durationMin: number; services: string };
  rules: RescheduleRules;
  movesLeft: number;
}) {
  const router = useRouter();
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const today = nowIST().ymd;
  const days = useMemo(
    () =>
      Array.from({ length: rules.advanceDays + 1 }, (_, i) => {
        const d = addDays(today, i);
        return { d, closed: rules.closedWeekdays.includes(weekday(d)) || rules.closedDates.includes(d) };
      }),
    [today, rules],
  );

  useEffect(() => {
    if (!open) return;
    getLenis()?.stop();
    document.documentElement.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => {
      getLenis()?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", k);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setDate(null);
      setSlot(null);
      setSlots(null);
      setError(null);
      setDone(false);
      return;
    }
    if (!date) return;
    let alive = true;
    setSlots(null);
    setMsg(null);
    setSlot(null);
    myRescheduleSlotsAction(booking.id, date).then((r) => {
      if (!alive) return;
      setSlots(r.slots);
      if (!r.ok) setMsg(r.error);
    });
    return () => {
      alive = false;
    };
  }, [open, date, booking.id]);

  const confirm = () => {
    if (!date || slot === null) return;
    setError(null);
    start(async () => {
      const r = await rescheduleMyBookingAction(booking.id, date, slot);
      if (!r.ok) {
        setError(r.error);
        // refresh the list so a taken slot disappears
        myRescheduleSlotsAction(booking.id, date).then((x) => setSlots(x.slots));
        return;
      }
      setDone(true);
      router.refresh();
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Reschedule booking"
            data-lenis-prevent
            className="fixed inset-x-0 bottom-0 z-[61] max-h-[92dvh] overflow-y-auto rounded-t-[2rem] bg-paper p-6 md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto md:w-[640px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2rem] md:p-8"
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {done ? (
              <div className="py-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok/10 text-2xl text-ok"><Check /></span>
                <p className="display mt-5 text-3xl">Booking moved</p>
                <p className="mt-2 text-mute">
                  New time: {date && dateLabel(date)}, {slot !== null && minutesToLabel(slot)}
                </p>
                <button onClick={onClose} className="mt-8 rounded-full bg-brand px-7 py-3.5 font-semibold text-white hover:bg-brand-700">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Reschedule</p>
                    <h2 className="display mt-2 text-3xl">Pick a new time</h2>
                    <p className="mt-2 text-sm text-mute">
                      {booking.services} · {durationLabel(booking.durationMin)}
                      <br />
                      Currently {dateLabel(booking.date)}, {minutesToLabel(booking.startMin)}
                    </p>
                  </div>
                  <button onClick={onClose} className="rounded-full px-3 py-1.5 text-sm text-mute hover:bg-ivory hover:text-ink">
                    Close
                  </button>
                </div>

                <div className="no-scrollbar -mx-6 mt-6 flex gap-2 overflow-x-auto px-6 pb-1 md:-mx-8 md:px-8">
                  {days.map(({ d, closed }) => (
                    <button
                      key={d}
                      disabled={closed}
                      onClick={() => setDate(d)}
                      className={clsx(
                        "flex w-[4.4rem] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition-colors",
                        closed ? "cursor-not-allowed border-line text-mute/40 line-through" : d === date ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/50",
                      )}
                    >
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wider">
                        {d === today ? "Today" : dateLabel(d, { weekday: "short", day: undefined, month: undefined, year: undefined })}
                      </span>
                      <span className="display text-2xl">{Number(d.slice(8))}</span>
                      <span className="text-[0.65rem] uppercase tracking-wider opacity-70">{dateLabel(d, { month: "short", weekday: undefined, day: undefined, year: undefined })}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 min-h-32">
                  {!date && <p className="text-sm text-mute">Choose a day to see open times.</p>}
                  {date && slots === null && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-11 animate-pulse rounded-xl bg-ivory" />
                      ))}
                    </div>
                  )}
                  {date && slots && slots.length === 0 && <p className="text-sm text-mute">{msg ?? "No open times on this day. Try another date."}</p>}
                  {date && slots && slots.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((x) => (
                        <button
                          key={x.start}
                          disabled={!x.available}
                          onClick={() => setSlot(x.start)}
                          className={clsx(
                            "h-11 rounded-xl border text-sm font-medium transition-colors",
                            !x.available ? "cursor-not-allowed border-line bg-ivory/50 text-mute/50 line-through" : slot === x.start ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/50",
                          )}
                        >
                          {minutesToLabel(x.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <p className="mt-4 text-sm text-bad" role="alert">
                    {error}
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-mute">
                    Your payment and treatments stay the same. You can move this booking {movesLeft} more time{movesLeft === 1 ? "" : "s"}.
                  </p>
                  <button
                    onClick={confirm}
                    disabled={!date || slot === null || pending}
                    className="shrink-0 rounded-full bg-brand px-7 py-3.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {pending ? "Moving…" : slot !== null && date ? `Move to ${minutesToLabel(slot)}` : "Confirm new time"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
