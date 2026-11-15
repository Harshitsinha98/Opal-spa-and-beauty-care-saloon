import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import clsx from "clsx";
import { requireUser } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { cancellationQuote, expireStaleHolds, rescheduleCheck } from "@/lib/booking";
import { dateLabel, dateTimeLabel, minutesToLabel, rupees } from "@/lib/format";
import { BOOKING_STATUS, ORDER_STATUS, PAYMENT_STATUS, Badge } from "@/lib/labels";
import { istToDate } from "@/lib/time";
import { Arrow } from "@/components/Arrow";
import { SITE_URL } from "@/lib/site";
import {
  CancelBookingButton,
  CompletePaymentButtons,
  ProfileForm,
  RescheduleButton,
  SignOutButton,
} from "@/components/account/AccountActions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "history", label: "Past visits" },
  { id: "orders", label: "Shop orders" },
  { id: "profile", label: "Profile" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** Google Calendar "add event" link for a booking. */
function calendarLink(b: { date: string; startMin: number; endMin: number; code: string }, what: string, where: string) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `Opal Spa: ${what}`,
    dates: `${fmt(istToDate(b.date, b.startMin))}/${fmt(istToDate(b.date, b.endMin))}`,
    details: `Booking ${b.code}. Reschedule or cancel: ${SITE_URL}/account`,
    location: where,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser("/account");
  await expireStaleHolds();
  const s = await getSettings();
  const { tab: rawTab } = await searchParams;
  const tab: Tab = (TABS.find((t) => t.id === rawTab)?.id ?? "upcoming") as Tab;

  const bookings = await db.query.booking.findMany({
    where: eq(schema.booking.userId, user.id),
    orderBy: [desc(schema.booking.date), desc(schema.booking.startMin)],
    limit: 100,
  });
  const items = bookings.length
    ? await db.select().from(schema.bookingItem).where(inArray(schema.bookingItem.bookingId, bookings.map((b) => b.id)))
    : [];
  const staffIds = [...new Set(bookings.map((b) => b.staffId).filter((x): x is number => x !== null))];
  const staff = staffIds.length ? await db.select({ id: schema.staff.id, name: schema.staff.name }).from(schema.staff).where(inArray(schema.staff.id, staffIds)) : [];
  const orders = await db.query.shopOrder.findMany({
    where: eq(schema.shopOrder.userId, user.id),
    orderBy: [desc(schema.shopOrder.createdAt)],
    limit: 50,
  });
  const orderItems = orders.length
    ? await db.select().from(schema.shopOrderItem).where(inArray(schema.shopOrderItem.orderId, orders.map((o) => o.id)))
    : [];

  const now = new Date();
  const upcoming = bookings.filter((b) => ["confirmed", "pending_payment"].includes(b.status) && istToDate(b.date, b.endMin) > now).reverse();
  const past = bookings.filter((b) => !upcoming.includes(b));
  const completed = bookings.filter((b) => b.status === "completed").length;
  const paid =
    bookings.reduce((n, b) => n + Math.max(0, b.amountPaid - b.refundAmount), 0) + orders.reduce((n, o) => n + Math.max(0, o.amountPaid - o.refundAmount), 0);
  const openOrders = orders.filter((o) => ["placed", "ready", "pending_payment"].includes(o.status)).length;
  const itemsOf = (id: string) => items.filter((i) => i.bookingId === id);
  const next = upcoming.find((b) => b.status === "confirmed");
  const rules = { advanceDays: s.booking.advanceDays, closedWeekdays: s.hours.closedWeekdays, closedDates: s.hours.closedDates };
  const first = user.name.split(" ")[0];

  const counts: Record<Tab, number | null> = { upcoming: upcoming.length, history: past.length, orders: orders.length, profile: null };

  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-24 pt-28 md:px-8 md:pt-36">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="relative bg-brand px-6 pb-16 pt-8 text-white md:px-10">
          <div className="dots pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent font-display text-3xl font-bold text-ink">{first[0]?.toUpperCase()}</span>
              <div>
                <h1 className="display text-3xl md:text-4xl">Hello, {first}</h1>
                <p className="mt-1 text-sm text-white/75">
                  {user.email}
                  {user.phone ? ` · ${user.phone}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.role === "admin" && (
                <Link href="/admin" className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/25">
                  Admin panel
                </Link>
              )}
              {user.role === "staff" && (
                <Link href="/staff" className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/25">
                  Staff panel
                </Link>
              )}
              <Link href="/book" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand-50">
                New booking <Arrow />
              </Link>
            </div>
          </div>
        </div>
        <div className="relative -mt-10 grid grid-cols-2 gap-3 px-4 pb-5 md:grid-cols-4 md:px-8">
          {[
            ["Upcoming", String(upcoming.length)],
            ["Visits completed", String(completed)],
            ["Orders in progress", String(openOrders)],
            ["Total paid", rupees(paid)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-xs font-medium text-mute">{l}</p>
              <p className="display mt-1 text-2xl md:text-3xl">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next visit highlight */}
      {next && tab === "upcoming" && (
        <div className="mt-6 flex flex-col gap-4 rounded-[1.75rem] bg-accent p-6 text-ink md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">Your next visit</p>
            <p className="display mt-1 text-2xl md:text-3xl">
              {dateLabel(next.date, { year: undefined })}, {minutesToLabel(next.startMin)}
            </p>
            <p className="mt-1 text-sm text-ink/70">{itemsOf(next.id).map((i) => i.name).join(", ")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={calendarLink(next, itemsOf(next.id).map((i) => i.name).join(", "), s.business.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand"
            >
              Add to Google Calendar
            </a>
            <a href={s.business.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-5 py-2 text-sm font-semibold hover:bg-ink hover:text-white">
              Directions <Arrow dir="out" />
            </a>
          </div>
        </div>
      )}

      {/* Tabs */}
      <nav className="no-scrollbar mt-8 flex gap-1 overflow-x-auto rounded-full border border-line bg-white p-1.5 md:w-fit" aria-label="Account sections">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "upcoming" ? "/account" : `/account?tab=${t.id}`}
            scroll={false}
            aria-current={tab === t.id ? "page" : undefined}
            className={clsx("flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors", tab === t.id ? "bg-ink text-white" : "text-mute hover:text-ink")}
          >
            {t.label}
            {counts[t.id] !== null && counts[t.id]! > 0 && (
              <span className={clsx("rounded-full px-1.5 text-[0.7rem]", tab === t.id ? "bg-white/20" : "bg-ivory")}>{counts[t.id]}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "upcoming" && (
          <div className="space-y-4">
            {upcoming.length === 0 && (
              <Empty title="No upcoming visits" text="Book a treatment and it will show up here." href="/book" cta="Book a visit" />
            )}
            {upcoming.map((b) => {
              const its = itemsOf(b.id);
              const names = its.map((i) => i.name).join(", ");
              const q = cancellationQuote(b, s);
              const r = rescheduleCheck(b, s);
              const therapist = staff.find((x) => x.id === b.staffId)?.name;
              const pendingPay = b.status === "pending_payment";
              return (
                <article key={b.id} className="card overflow-hidden">
                  <div className="flex flex-col gap-5 p-5 md:flex-row md:p-6">
                    <div className="flex shrink-0 flex-row items-center gap-4 md:w-28 md:flex-col md:items-start md:gap-0">
                      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand">
                        <span className="text-xs font-bold uppercase">{dateLabel(b.date, { month: "short", weekday: undefined, day: undefined, year: undefined })}</span>
                        <span className="display text-3xl leading-none">{Number(b.date.slice(8))}</span>
                        <span className="text-[0.65rem] font-semibold uppercase">{dateLabel(b.date, { weekday: "short", day: undefined, month: undefined, year: undefined })}</span>
                      </div>
                      <p className="text-sm font-semibold md:mt-3">
                        {minutesToLabel(b.startMin)}
                        <span className="block text-xs font-normal text-mute">to {minutesToLabel(b.endMin)}</span>
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge map={BOOKING_STATUS} value={b.status} />
                        <Badge map={PAYMENT_STATUS} value={b.paymentStatus} />
                        <span className="text-xs text-mute">Ref {b.code}</span>
                      </div>
                      <h3 className="display mt-2 text-xl md:text-2xl">{names}</h3>
                      <p className="mt-1 text-sm text-mute">
                        {therapist ? `With ${therapist} · ` : ""}
                        {b.paymentMethod === "online" ? "Paid online" : "Pay at the salon"} · {rupees(b.subtotal)}
                        {b.rescheduleCount > 0 && ` · Moved ${b.rescheduleCount}×`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-line bg-ivory/40 px-5 py-4 md:px-6">
                    {pendingPay ? (
                      <>
                        <p className="w-full text-sm text-warn">Payment not finished. Your slot is held for a few minutes.</p>
                        <CompletePaymentButtons kind="booking" id={b.id} businessName={s.business.name} allowCash={s.payments.cashEnabled} />
                      </>
                    ) : (
                      <>
                        {r.ok ? (
                          <RescheduleButton
                            booking={{ id: b.id, date: b.date, startMin: b.startMin, durationMin: b.endMin - b.startMin, services: names }}
                            rules={rules}
                            movesLeft={r.left}
                          />
                        ) : (
                          <span className="text-xs text-mute">{r.reason}</span>
                        )}
                        {s.cancellation.allowCustomerCancel && !q.started && (
                          <CancelBookingButton
                            id={b.id}
                            summary={
                              b.paymentStatus !== "paid"
                                ? "Nothing was paid online, so there's nothing to refund."
                                : q.fee === 0
                                  ? `You'll get a full refund of ${rupees(q.refund)}.`
                                  : `A cancellation fee of ${rupees(q.fee)} applies. We'll refund ${rupees(q.refund)}.`
                            }
                          />
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
            {upcoming.length > 0 && (
              <p className="px-2 text-xs text-mute">
                {s.reschedule.allowCustomer
                  ? `You can move a booking up to ${s.reschedule.cutoffHours} hours before the visit, ${s.reschedule.maxPerBooking} time${s.reschedule.maxPerBooking === 1 ? "" : "s"} per booking. `
                  : ""}
                <Link href="/cancellation-policy" className="underline">
                  Cancellation policy
                </Link>
              </p>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="card divide-y divide-line">
            {past.length === 0 && <p className="p-8 text-center text-sm text-mute">Completed and cancelled bookings appear here.</p>}
            {past.map((b) => {
              const its = itemsOf(b.id);
              const again = its.map((i) => i.serviceId).filter(Boolean).join(",");
              return (
                <div key={b.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:px-6">
                  <div className="md:w-48">
                    <p className="font-semibold">{dateLabel(b.date)}</p>
                    <p className="text-xs text-mute">{minutesToLabel(b.startMin)} · Ref {b.code}</p>
                  </div>
                  <p className="flex-1 text-sm">{its.map((i) => i.name).join(", ")}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge map={BOOKING_STATUS} value={b.status} />
                    {b.refundAmount > 0 && <span className="text-xs text-mute">Refunded {rupees(b.refundAmount)}</span>}
                    <span className="w-20 text-right text-sm font-semibold">{rupees(b.subtotal)}</span>
                    {again && (
                      <Link href={`/book?service=${again}`} className="rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold text-brand hover:bg-brand hover:text-white">
                        Book again
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 && <Empty title="No orders yet" text="Products you order for pickup show up here." href="/shop" cta="Visit the shop" />}
            {orders.map((o) => {
              const steps = ["placed", "ready", "picked_up"];
              const at = steps.indexOf(o.status);
              return (
                <article key={o.id} className="card p-5 md:p-6">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge map={ORDER_STATUS} value={o.status} />
                        <Badge map={PAYMENT_STATUS} value={o.paymentStatus} />
                      </div>
                      <p className="display mt-2 text-xl">Order {o.code}</p>
                      <p className="text-xs text-mute">{dateTimeLabel(o.createdAt)}</p>
                    </div>
                    <p className="display text-2xl">{rupees(o.total)}</p>
                  </div>
                  <ul className="mt-4 space-y-1 text-sm">
                    {orderItems
                      .filter((i) => i.orderId === o.id)
                      .map((i) => (
                        <li key={i.id} className="flex justify-between">
                          <span>
                            {i.name} <span className="text-mute">× {i.qty}</span>
                          </span>
                          <span>{rupees(i.price * i.qty)}</span>
                        </li>
                      ))}
                  </ul>
                  {at >= 0 && (
                    <ol className="mt-5 grid grid-cols-3 gap-2 text-xs font-semibold">
                      {["Preparing", "Ready for pickup", "Picked up"].map((l, i) => (
                        <li key={l} className={i <= at ? "text-brand" : "text-mute"}>
                          <span className={clsx("mb-2 block h-1.5 rounded-full", i <= at ? "bg-brand" : "bg-line")} />
                          {l}
                        </li>
                      ))}
                    </ol>
                  )}
                  {o.status === "ready" && (
                    <p className="mt-4 rounded-2xl bg-ok/10 p-3 text-sm text-ok">
                      Ready at the front desk. Show code {o.code}
                      {o.paymentStatus !== "paid" ? ` and pay ${rupees(o.total - o.amountPaid)} at pickup` : ""}.
                    </p>
                  )}
                  {o.status === "pending_payment" && (
                    <div className="mt-4 border-t border-line pt-4">
                      <CompletePaymentButtons kind="order" id={o.id} businessName={s.business.name} allowCash={false} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {tab === "profile" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-6 md:col-span-2 md:p-8">
              <h2 className="display text-2xl">Your details</h2>
              <p className="mb-6 mt-1 text-sm text-mute">We use these to confirm bookings and contact you about them.</p>
              <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} />
            </div>
            <div className="card flex flex-col gap-3 p-6">
              <h2 className="display text-xl">Account</h2>
              <Link href="/privacy" className="text-sm text-mute underline">
                Privacy Policy
              </Link>
              <Link href="/cancellation-policy" className="text-sm text-mute underline">
                Cancellation &amp; refunds
              </Link>
              <p className="text-sm text-mute">To delete your account, contact the salon.</p>
              <SignOutButton className="mt-auto w-full rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold hover:border-ink" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Empty({ title, text, href, cta }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <p className="display text-2xl">{title}</p>
      <p className="mt-2 text-sm text-mute">{text}</p>
      {href && (
        <Link href={href} className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          {cta}
        </Link>
      )}
    </div>
  );
}
