import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { dateLabel, dateTimeLabel, minutesToLabel, rupees } from "@/lib/format";
import { BOOKING_STATUS, PAYMENT_STATUS, Badge } from "@/lib/labels";
import { listStaff } from "@/lib/admin-data";
import { Card } from "./ui";
import { BookingActions } from "./BookingActions";

export async function BookingDetail({ id, role }: { id: string; role: "admin" | "staff" }) {
  const b = await db.query.booking.findFirst({ where: eq(schema.booking.id, id) });
  if (!b) return <p className="text-mute">Booking not found.</p>;
  const [items, staff, payments] = await Promise.all([
    db.select().from(schema.bookingItem).where(eq(schema.bookingItem.bookingId, id)),
    listStaff(),
    role === "admin" ? db.select().from(schema.payment).where(eq(schema.payment.refId, id)).orderBy(asc(schema.payment.createdAt)) : Promise.resolve([]),
  ]);
  const due = Math.max(0, b.subtotal - b.amountPaid);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title={`Booking ${b.code}`}>
          <div className="flex flex-wrap gap-2">
            <Badge map={BOOKING_STATUS} value={b.status} />
            <Badge map={PAYMENT_STATUS} value={b.paymentStatus} />
            <span className="text-xs text-mute">{b.paymentMethod === "online" ? "Paid online (Razorpay)" : "Pay at salon"}</span>
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-mute">When</dt>
              <dd className="font-medium">{dateLabel(b.date)}</dd>
              <dd>
                {minutesToLabel(b.startMin)} – {minutesToLabel(b.endMin)}
              </dd>
              {b.rescheduleCount > 0 && <dd className="text-xs text-mute">Moved by the guest {b.rescheduleCount}×</dd>}
            </div>
            <div>
              <dt className="text-xs text-mute">Guest</dt>
              <dd className="font-medium">{b.customerName}</dd>
              <dd>
                <a href={`tel:${b.phone}`} className="underline">
                  {b.phone}
                </a>{" "}
                · {b.email}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-mute">Treatments</dt>
              <dd>
                <ul className="mt-1 divide-y divide-line rounded-md border border-line">
                  {items.map((i) => (
                    <li key={i.id} className="flex justify-between px-3 py-2">
                      <span>
                        {i.name} <span className="text-xs text-mute">({i.durationMin} min)</span>
                      </span>
                      <span>{rupees(i.price)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between bg-ivory/60 px-3 py-2 font-medium">
                    <span>Total</span>
                    <span>{rupees(b.subtotal)}</span>
                  </li>
                </ul>
              </dd>
            </div>
            {b.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-mute">Guest notes</dt>
                <dd className="whitespace-pre-wrap rounded-md bg-ivory/60 p-3">{b.notes}</dd>
              </div>
            )}
            {b.status === "cancelled" && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-mute">Cancelled</dt>
                <dd>
                  {b.cancelledAt && dateTimeLabel(b.cancelledAt)} by {b.cancelledBy} · {b.cancelReason}
                  {b.cancellationFee > 0 && <> · fee kept {rupees(b.cancellationFee)}</>}
                  {b.refundAmount > 0 && <> · refunded {rupees(b.refundAmount)}</>}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {role === "admin" && (
          <Card title="Payment history">
            {payments.length === 0 ? (
              <p className="text-sm text-mute">No payments recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-line/70 last:border-0">
                      <td className="py-2">{dateTimeLabel(p.createdAt)}</td>
                      <td className="py-2 capitalize">
                        {p.type} · {p.method}
                      </td>
                      <td className="py-2 text-xs text-mute">{p.razorpayId ?? p.note}</td>
                      <td className="py-2">{p.status}</td>
                      <td className={`py-2 text-right ${p.type === "refund" ? "text-bad" : ""}`}>
                        {p.type === "refund" ? "−" : ""}
                        {rupees(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>

      <BookingActions
        role={role}
        b={{
          id: b.id,
          status: b.status,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          staffId: b.staffId,
          date: b.date,
          startMin: b.startMin,
          due,
          refundable: Math.max(0, b.amountPaid - b.refundAmount),
        }}
        staff={staff.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
