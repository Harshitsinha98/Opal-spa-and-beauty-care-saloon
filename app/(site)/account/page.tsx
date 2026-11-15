import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { cancellationQuote, expireStaleHolds } from "@/lib/booking";
import { dateLabel, dateTimeLabel, minutesToLabel, rupees } from "@/lib/format";
import { BOOKING_STATUS, ORDER_STATUS, PAYMENT_STATUS, Badge } from "@/lib/labels";
import { istToDate } from "@/lib/time";
import { CancelBookingButton, SignOutButton } from "@/components/account/AccountActions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");
  await expireStaleHolds();
  const s = await getSettings();

  const bookings = await db.query.booking.findMany({
    where: eq(schema.booking.userId, user.id),
    orderBy: [desc(schema.booking.date), desc(schema.booking.startMin)],
    limit: 50,
  });
  const items = bookings.length
    ? await db.select().from(schema.bookingItem).where(inArray(schema.bookingItem.bookingId, bookings.map((b) => b.id)))
    : [];
  const orders = await db.query.shopOrder.findMany({
    where: eq(schema.shopOrder.userId, user.id),
    orderBy: [desc(schema.shopOrder.createdAt)],
    limit: 30,
  });
  const orderItems = orders.length
    ? await db.select().from(schema.shopOrderItem).where(inArray(schema.shopOrderItem.orderId, orders.map((o) => o.id)))
    : [];

  const now = new Date();
  const upcoming = bookings.filter((b) => ["confirmed", "pending_payment"].includes(b.status) && istToDate(b.date, b.endMin) > now).reverse();
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-32 pt-36 md:px-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="display mt-4 text-5xl md:text-7xl">
            Hello, <em className="text-brand">{user.name.split(" ")[0]}</em>
          </h1>
          <p className="mt-3 text-sm text-mute">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {user.role === "admin" && (
            <Link href="/admin" className="rounded-full border border-line px-5 py-2.5 text-sm hover:border-ink">
              Admin panel
            </Link>
          )}
          {user.role === "staff" && (
            <Link href="/staff" className="rounded-full border border-line px-5 py-2.5 text-sm hover:border-ink">
              Staff panel
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      <div className="mt-16">
        <div className="flex items-end justify-between border-b border-line pb-4">
          <h2 className="display text-4xl">Upcoming</h2>
          <Link href="/book" className="text-sm text-brand underline underline-offset-4">
            New booking
          </Link>
        </div>
        {upcoming.length === 0 && <p className="py-8 text-mute">No upcoming visits.</p>}
        <ul className="divide-y divide-line">
          {upcoming.map((b) => {
            const q = cancellationQuote(b, s);
            const its = items.filter((i) => i.bookingId === b.id);
            return (
              <li key={b.id} className="grid gap-4 py-7 md:grid-cols-12 md:items-center">
                <div className="md:col-span-3">
                  <p className="display text-2xl">{dateLabel(b.date)}</p>
                  <p className="text-sm text-mute">
                    {minutesToLabel(b.startMin)} – {minutesToLabel(b.endMin)}
                  </p>
                </div>
                <div className="md:col-span-4">
                  <p>{its.map((i) => i.name).join(", ")}</p>
                  <p className="text-xs text-mute">Ref {b.code}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                  <Badge map={BOOKING_STATUS} value={b.status} />
                  <Badge map={PAYMENT_STATUS} value={b.paymentStatus} />
                </div>
                <div className="md:col-span-1 md:text-right">{rupees(b.subtotal)}</div>
                <div className="md:col-span-2 md:text-right">
                  {s.cancellation.allowCustomerCancel && !q.started ? (
                    <CancelBookingButton
                      id={b.id}
                      summary={
                        b.status === "pending_payment" || b.paymentStatus !== "paid"
                          ? "This booking hasn't been paid online, so there's nothing to refund."
                          : q.fee === 0
                            ? `You'll get a full refund of ${rupees(q.refund)}.`
                            : `A cancellation fee of ${rupees(q.fee)} applies. We'll refund ${rupees(q.refund)}.`
                      }
                    />
                  ) : (
                    <span className="text-xs text-mute">Call the salon to change</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {past.length > 0 && (
        <div className="mt-16">
          <h2 className="display border-b border-line pb-4 text-4xl">History</h2>
          <ul className="divide-y divide-line text-sm">
            {past.map((b) => (
              <li key={b.id} className="grid gap-2 py-5 md:grid-cols-12 md:items-center">
                <span className="md:col-span-3">
                  {dateLabel(b.date)} · {minutesToLabel(b.startMin)}
                </span>
                <span className="text-mute md:col-span-5">
                  {items
                    .filter((i) => i.bookingId === b.id)
                    .map((i) => i.name)
                    .join(", ")}
                </span>
                <span className="flex gap-2 md:col-span-3">
                  <Badge map={BOOKING_STATUS} value={b.status} />
                  {b.refundAmount > 0 && <span className="text-xs text-mute">Refunded {rupees(b.refundAmount)}</span>}
                </span>
                <span className="md:col-span-1 md:text-right">{rupees(b.subtotal)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-16">
        <h2 className="display border-b border-line pb-4 text-4xl">Shop orders</h2>
        {orders.length === 0 && <p className="py-8 text-mute">No orders yet.</p>}
        <ul className="divide-y divide-line text-sm">
          {orders.map((o) => (
            <li key={o.id} className="grid gap-2 py-5 md:grid-cols-12 md:items-center">
              <span className="md:col-span-3">
                {o.code}
                <span className="block text-xs text-mute">{dateTimeLabel(o.createdAt)}</span>
              </span>
              <span className="text-mute md:col-span-5">
                {orderItems
                  .filter((i) => i.orderId === o.id)
                  .map((i) => `${i.name} × ${i.qty}`)
                  .join(", ")}
              </span>
              <span className="flex gap-2 md:col-span-3">
                <Badge map={ORDER_STATUS} value={o.status} />
                <Badge map={PAYMENT_STATUS} value={o.paymentStatus} />
              </span>
              <span className="md:col-span-1 md:text-right">{rupees(o.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
