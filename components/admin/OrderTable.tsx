import { dateTimeLabel, rupees } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS, Badge } from "@/lib/labels";
import { OrderActions } from "./OrderActions";

type Row = Awaited<ReturnType<typeof import("@/lib/admin-data").listOrders>>[number];

export function OrderTable({ rows, role }: { rows: Row[]; role: "admin" | "staff" }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-xs text-mute">
          <tr className="border-b border-line">
            <th className="px-5 py-2 font-medium">Order</th>
            <th className="px-5 py-2 font-medium">Customer</th>
            <th className="px-5 py-2 font-medium">Items</th>
            <th className="px-5 py-2 font-medium">Status</th>
            <th className="px-5 py-2 text-right font-medium">Total</th>
            <th className="px-5 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b border-line/70 align-top last:border-0">
              <td className="px-5 py-3">
                <span className="font-medium">{o.code}</span>
                <span className="block text-xs text-mute">{dateTimeLabel(o.createdAt)}</span>
              </td>
              <td className="px-5 py-3">
                {o.customerName}
                <span className="block text-xs text-mute">{o.phone}</span>
              </td>
              <td className="px-5 py-3">
                {o.items.map((i) => (
                  <span key={i.id} className="block">
                    {i.name} × {i.qty}
                  </span>
                ))}
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  <Badge map={ORDER_STATUS} value={o.status} />
                  <Badge map={PAYMENT_STATUS} value={o.paymentStatus} />
                </div>
                <span className="mt-0.5 block text-xs text-mute">{o.paymentMethod === "online" ? "Online" : "At pickup"}</span>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right">{rupees(o.total)}</td>
              <td className="px-5 py-3">
                <OrderActions
                  role={role}
                  o={{
                    id: o.id,
                    status: o.status,
                    paymentStatus: o.paymentStatus,
                    paymentMethod: o.paymentMethod,
                    due: Math.max(0, o.total - o.amountPaid),
                    refundable: Math.max(0, o.amountPaid - o.refundAmount),
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
