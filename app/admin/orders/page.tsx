import { requireRole } from "@/lib/session";
import { listOrders } from "@/lib/admin-data";
import { expireStaleHolds } from "@/lib/booking";
import { PageTitle } from "@/components/admin/PanelShell";
import { Card } from "@/components/admin/ui";
import { OrderTable } from "@/components/admin/OrderTable";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(["admin"], "/admin/orders");
  await expireStaleHolds();
  const sp = await searchParams;
  const status = sp.status ?? "open";
  const q = sp.q?.trim().slice(0, 60) || undefined;
  const all = await listOrders({ status: status === "open" ? "all" : status, q });
  const rows = status === "open" ? all.filter((o) => o.status === "placed" || o.status === "ready") : all;
  return (
    <div>
      <PageTitle title="Shop orders" sub="Pickup only. Mark ready when packed, record payment, then hand over." />
      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="text-xs text-mute">
            Show
            <select name="status" defaultValue={status} className="field mt-1 text-sm text-ink">
              <option value="open">To hand over</option>
              <option value="all">All</option>
              <option value="placed">Preparing</option>
              <option value="ready">Ready</option>
              <option value="picked_up">Picked up</option>
              <option value="pending_payment">Awaiting payment</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="text-xs text-mute">
            Search
            <input name="q" defaultValue={q} className="field mt-1 text-sm text-ink" placeholder="Code, name, phone" />
          </label>
          <button className="rounded-md bg-plum px-4 py-2.5 text-sm text-paper">Filter</button>
        </form>
      </Card>
      <Card>{rows.length ? <OrderTable rows={rows} role="admin" /> : <p className="text-sm text-mute">No orders.</p>}</Card>
    </div>
  );
}
