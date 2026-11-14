import { requireRole } from "@/lib/session";
import { listOrders } from "@/lib/admin-data";
import { expireStaleHolds } from "@/lib/booking";
import { PageTitle } from "@/components/admin/PanelShell";
import { Card } from "@/components/admin/ui";
import { OrderTable } from "@/components/admin/OrderTable";

export default async function StaffOrders() {
  await requireRole(["staff", "admin"], "/staff/orders");
  await expireStaleHolds();
  const rows = (await listOrders({})).filter((o) => o.status === "placed" || o.status === "ready");
  return (
    <div>
      <PageTitle title="Shop pickups" sub="Pack the order, mark it ready, take payment if due, then hand it over." />
      <Card>{rows.length ? <OrderTable rows={rows} role="staff" /> : <p className="text-sm text-mute">Nothing waiting for pickup.</p>}</Card>
    </div>
  );
}
