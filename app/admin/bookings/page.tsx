import { requireRole } from "@/lib/session";
import { listBookings } from "@/lib/admin-data";
import { expireStaleHolds } from "@/lib/booking";
import { addDays, isValidYMD, nowIST } from "@/lib/time";
import { PageTitle } from "@/components/admin/PanelShell";
import { Card } from "@/components/admin/ui";
import { BookingTable } from "@/components/admin/BookingTable";

export default async function AdminBookings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(["admin"], "/admin/bookings");
  await expireStaleHolds();
  const sp = await searchParams;
  const today = nowIST().ymd;
  const from = sp.from && isValidYMD(sp.from) ? sp.from : sp.q ? undefined : today;
  const to = sp.to && isValidYMD(sp.to) ? sp.to : sp.q ? undefined : addDays(today, 30);
  const status = sp.status ?? "all";
  const q = sp.q?.trim().slice(0, 60) || undefined;
  const rows = await listBookings({ from, to, status, q });

  return (
    <div>
      <PageTitle title="Bookings" sub={`${rows.length} shown`} />
      <Card className="mb-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
          <label className="text-xs text-mute">
            From
            <input type="date" name="from" defaultValue={from} className="field mt-1 text-sm text-ink" />
          </label>
          <label className="text-xs text-mute">
            To
            <input type="date" name="to" defaultValue={to} className="field mt-1 text-sm text-ink" />
          </label>
          <label className="text-xs text-mute">
            Status
            <select name="status" defaultValue={status} className="field mt-1 text-sm text-ink">
              <option value="all">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending_payment">Awaiting payment</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-show</option>
            </select>
          </label>
          <label className="text-xs text-mute">
            Search
            <input name="q" defaultValue={q} placeholder="Name, phone, ref" className="field mt-1 text-sm text-ink" />
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded-md bg-brand px-4 py-2.5 text-sm text-paper">Filter</button>
            <a href="/admin/bookings" className="rounded-md border border-line px-4 py-2.5 text-sm">
              Reset
            </a>
          </div>
        </form>
      </Card>
      <Card>{rows.length ? <BookingTable rows={rows} /> : <p className="text-sm text-mute">No bookings match.</p>}</Card>
    </div>
  );
}
