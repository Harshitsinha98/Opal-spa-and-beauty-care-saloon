import { eq } from "drizzle-orm";
import { Arrow } from "@/components/Arrow";
import { requireRole } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { listBookings } from "@/lib/admin-data";
import { expireStaleHolds } from "@/lib/booking";
import { addDays, isValidYMD, nowIST } from "@/lib/time";
import { dateLabel } from "@/lib/format";
import { PageTitle } from "@/components/admin/PanelShell";
import { Card } from "@/components/admin/ui";
import { BookingTable } from "@/components/admin/BookingTable";

export default async function StaffHome({ searchParams }: { searchParams: Promise<{ date?: string; mine?: string }> }) {
  const user = await requireRole(["staff", "admin"], "/staff");
  await expireStaleHolds();
  const sp = await searchParams;
  const today = nowIST().ymd;
  const date = sp.date && isValidYMD(sp.date) ? sp.date : today;
  const me = await db.query.staff.findFirst({ where: eq(schema.staff.userId, user.id) });
  let rows = (await listBookings({ from: date, to: date })).filter((b) => b.status !== "pending_payment");
  if (sp.mine && me) rows = rows.filter((b) => b.staffId === me.id);

  return (
    <div>
      <PageTitle title={date === today ? "Today" : dateLabel(date)} sub={`${rows.filter((r) => r.status !== "cancelled").length} bookings`} />
      <Card className="mb-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <a href={`/staff?date=${addDays(date, -1)}`} className="rounded-md border border-line px-3 py-2 text-sm">
            <Arrow dir="left" /> Prev
          </a>
          <input type="date" name="date" defaultValue={date} className="field w-auto text-sm" />
          <button className="rounded-md bg-brand px-4 py-2 text-sm text-paper">Go</button>
          <a href={`/staff?date=${addDays(date, 1)}`} className="rounded-md border border-line px-3 py-2 text-sm">
            Next <Arrow />
          </a>
          {me && (
            <label className="ml-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="mine" value="1" defaultChecked={Boolean(sp.mine)} /> Only mine
            </label>
          )}
        </form>
      </Card>
      <Card>{rows.length ? <BookingTable rows={rows} hideDate base="/staff/bookings" /> : <p className="text-sm text-mute">No bookings for this day.</p>}</Card>
    </div>
  );
}
