import Link from "next/link";
import type { BookingRow } from "@/lib/admin-data";
import { dateLabel, minutesToLabel, rupees } from "@/lib/format";
import { BOOKING_STATUS, PAYMENT_STATUS, Badge } from "@/lib/labels";

export function BookingTable({ rows, hideDate, base = "/admin/bookings" }: { rows: BookingRow[]; hideDate?: boolean; base?: string }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs text-mute">
          <tr className="border-b border-line">
            {!hideDate && <th className="px-5 py-2 font-medium">Date</th>}
            <th className="px-5 py-2 font-medium">Time</th>
            <th className="px-5 py-2 font-medium">Guest</th>
            <th className="px-5 py-2 font-medium">Treatments</th>
            <th className="px-5 py-2 font-medium">Therapist</th>
            <th className="px-5 py-2 font-medium">Status</th>
            <th className="px-5 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-b border-line/70 last:border-0 hover:bg-ivory/60">
              {!hideDate && <td className="whitespace-nowrap px-5 py-3">{dateLabel(b.date, { year: undefined })}</td>}
              <td className="whitespace-nowrap px-5 py-3">
                <Link href={`${base}/${b.id}`} className="font-medium text-wine underline-offset-4 hover:underline">
                  {minutesToLabel(b.startMin)}
                </Link>
                <span className="block text-xs text-mute">to {minutesToLabel(b.endMin)}</span>
              </td>
              <td className="px-5 py-3">
                <Link href={`${base}/${b.id}`} className="hover:underline">
                  {b.customerName}
                </Link>
                <span className="block text-xs text-mute">
                  {b.phone} · {b.code}
                </span>
              </td>
              <td className="px-5 py-3">{b.items.map((i) => i.name).join(", ")}</td>
              <td className="px-5 py-3">{b.staffName ?? <span className="text-mute">—</span>}</td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  <Badge map={BOOKING_STATUS} value={b.status} />
                  <Badge map={PAYMENT_STATUS} value={b.paymentStatus} />
                </div>
                <span className="mt-0.5 block text-xs text-mute">{b.paymentMethod === "online" ? "Online" : "At salon"}</span>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right">
                {rupees(b.subtotal)}
                {b.amountPaid > 0 && b.amountPaid < b.subtotal && <span className="block text-xs text-mute">paid {rupees(b.amountPaid)}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
