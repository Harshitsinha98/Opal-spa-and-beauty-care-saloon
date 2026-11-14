import { desc, eq, ilike, or, sql, and } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { dateTimeLabel, rupees } from "@/lib/format";
import { PageTitle } from "@/components/admin/PanelShell";
import { Card } from "@/components/admin/ui";

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRole(["admin"], "/admin/customers");
  const { q: raw } = await searchParams;
  const q = raw?.trim().slice(0, 60);
  const like = q ? `%${q.replace(/[%_]/g, "")}%` : null;
  const rows = await db
    .select({
      u: schema.user,
      bookings: sql<number>`(select count(*) from booking b where b.user_id = ${schema.user.id} and b.status in ('confirmed','completed'))::int`,
      spent: sql<number>`(select coalesce(sum(b.amount_paid - b.refund_amount),0) from booking b where b.user_id = ${schema.user.id})::int`,
    })
    .from(schema.user)
    .where(
      and(
        eq(schema.user.role, "customer"),
        like ? or(ilike(schema.user.name, like), ilike(schema.user.email, like), ilike(schema.user.phone, like)) : undefined,
      ),
    )
    .orderBy(desc(schema.user.createdAt))
    .limit(300);

  return (
    <div>
      <PageTitle title="Customers" sub={`${rows.length} shown`} />
      <Card className="mb-4">
        <form method="get" className="flex gap-3">
          <input name="q" defaultValue={q} className="field max-w-sm text-sm" placeholder="Name, email or phone" />
          <button className="rounded-md bg-plum px-4 text-sm text-paper">Search</button>
        </form>
      </Card>
      <Card>
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-mute">
              <tr className="border-b border-line">
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Contact</th>
                <th className="px-5 py-2 font-medium">Joined</th>
                <th className="px-5 py-2 text-right font-medium">Visits</th>
                <th className="px-5 py-2 text-right font-medium">Paid</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ u, bookings, spent }) => (
                <tr key={u.id} className="border-b border-line/70 last:border-0">
                  <td className="px-5 py-3 font-medium">
                    <a className="hover:underline" href={`/admin/bookings?q=${encodeURIComponent(u.email)}`}>
                      {u.name}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    {u.email}
                    {u.phone && <span className="block text-xs text-mute">{u.phone}</span>}
                  </td>
                  <td className="px-5 py-3 text-mute">{dateTimeLabel(u.createdAt)}</td>
                  <td className="px-5 py-3 text-right">{bookings}</td>
                  <td className="px-5 py-3 text-right">{rupees(spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
