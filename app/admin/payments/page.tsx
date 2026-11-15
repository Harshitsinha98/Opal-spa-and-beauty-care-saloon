import Link from "next/link";
import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { dateTimeLabel, rupees } from "@/lib/format";
import { addDays, isValidYMD, istToDate, nowIST } from "@/lib/time";
import { PageTitle } from "@/components/admin/PanelShell";
import { Card } from "@/components/admin/ui";

export default async function AdminPayments({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(["admin"], "/admin/payments");
  const sp = await searchParams;
  const today = nowIST().ymd;
  const from = sp.from && isValidYMD(sp.from) ? sp.from : `${today.slice(0, 7)}-01`;
  const to = sp.to && isValidYMD(sp.to) ? sp.to : today;
  const method = sp.method ?? "all";
  const type = sp.type ?? "all";

  const where: SQL[] = [gte(schema.payment.createdAt, istToDate(from, 0)), lte(schema.payment.createdAt, istToDate(addDays(to, 1), 0))];
  if (method !== "all") where.push(eq(schema.payment.method, method));
  if (type !== "all") where.push(eq(schema.payment.type, type));

  const [rows, [t]] = await Promise.all([
    db
      .select({ p: schema.payment, by: schema.user.name })
      .from(schema.payment)
      .leftJoin(schema.user, eq(schema.payment.recordedBy, schema.user.id))
      .where(and(...where))
      .orderBy(desc(schema.payment.createdAt))
      .limit(500),
    db
      .select({
        inOnline: sql<number>`coalesce(sum(case when type='payment' and method='razorpay' and status='success' then amount end),0)::int`,
        inCash: sql<number>`coalesce(sum(case when type='payment' and method='cash' and status='success' then amount end),0)::int`,
        out: sql<number>`coalesce(sum(case when type='refund' and status<>'failed' then amount end),0)::int`,
        pendingRefunds: sql<number>`count(*) filter (where type='refund' and status='pending')::int`,
      })
      .from(schema.payment)
      .where(and(...where)),
  ]);

  return (
    <div>
      <PageTitle title="Payments" sub="Every online payment, counter payment and refund." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Online received", rupees(t.inOnline)],
          ["Counter received", rupees(t.inCash)],
          ["Refunded", rupees(t.out)],
          ["Net", rupees(t.inOnline + t.inCash - t.out)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-line bg-white p-4">
            <p className="text-xs text-mute">{l}</p>
            <p className="display mt-1 text-3xl">{v}</p>
          </div>
        ))}
      </div>
      {t.pendingRefunds > 0 && (
        <p className="mb-4 text-sm text-warn">{t.pendingRefunds} refund(s) are still processing at Razorpay. They update automatically via the webhook.</p>
      )}
      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="text-xs text-mute">
            From
            <input type="date" name="from" defaultValue={from} className="field mt-1 text-sm text-ink" />
          </label>
          <label className="text-xs text-mute">
            To
            <input type="date" name="to" defaultValue={to} className="field mt-1 text-sm text-ink" />
          </label>
          <label className="text-xs text-mute">
            Method
            <select name="method" defaultValue={method} className="field mt-1 text-sm text-ink">
              <option value="all">All</option>
              <option value="razorpay">Razorpay</option>
              <option value="cash">Counter</option>
            </select>
          </label>
          <label className="text-xs text-mute">
            Type
            <select name="type" defaultValue={type} className="field mt-1 text-sm text-ink">
              <option value="all">All</option>
              <option value="payment">Payments</option>
              <option value="refund">Refunds</option>
            </select>
          </label>
          <button className="rounded-md bg-brand px-4 py-2.5 text-sm text-paper">Filter</button>
        </form>
      </Card>
      <Card>
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-mute">
              <tr className="border-b border-line">
                <th className="px-5 py-2 font-medium">When</th>
                <th className="px-5 py-2 font-medium">For</th>
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Reference</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, by }) => (
                <tr key={p.id} className="border-b border-line/70 last:border-0">
                  <td className="whitespace-nowrap px-5 py-3">{dateTimeLabel(p.createdAt)}</td>
                  <td className="px-5 py-3">
                    {p.kind === "booking" ? (
                      <Link className="text-accent hover:underline" href={`/admin/bookings/${p.refId}`}>
                        {p.refCode}
                      </Link>
                    ) : (
                      <Link className="text-accent hover:underline" href={`/admin/orders?q=${p.refCode}&status=all`}>
                        {p.refCode}
                      </Link>
                    )}
                  </td>
                  <td className="px-5 py-3 capitalize">
                    {p.type} · {p.method === "razorpay" ? "Razorpay" : "Counter"}
                    {by && <span className="block text-xs text-mute">by {by}</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-mute">{p.razorpayId ?? p.note ?? "—"}</td>
                  <td className="px-5 py-3">{p.status}</td>
                  <td className={`whitespace-nowrap px-5 py-3 text-right ${p.type === "refund" ? "text-bad" : ""}`}>
                    {p.type === "refund" ? "−" : ""}
                    {rupees(p.amount)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-mute">
                    No payments in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
