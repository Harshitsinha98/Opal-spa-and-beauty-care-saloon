import Link from "next/link";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { expireStaleHolds } from "@/lib/booking";
import { listBookings } from "@/lib/admin-data";
import { nowIST, addDays, istToDate } from "@/lib/time";
import { rupees } from "@/lib/format";
import { razorpayConfigured } from "@/lib/settings";
import { PageTitle } from "@/components/admin/PanelShell";
import { Card } from "@/components/admin/ui";
import { BookingTable } from "@/components/admin/BookingTable";

export default async function AdminDashboard() {
  await requireRole(["admin"], "/admin");
  await expireStaleHolds();
  const { ymd: today } = nowIST();
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthStartDate = istToDate(monthStart, 0);

  const [todayList, [week], [money], [dues], [pickups]] = await Promise.all([
    listBookings({ from: today, to: today }),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.booking)
      .where(and(gte(schema.booking.date, today), sql`${schema.booking.date} <= ${addDays(today, 7)}`, eq(schema.booking.status, "confirmed"))),
    db
      .select({
        received: sql<number>`coalesce(sum(case when ${schema.payment.type} = 'payment' and ${schema.payment.status} = 'success' then ${schema.payment.amount} else 0 end), 0)::int`,
        refunded: sql<number>`coalesce(sum(case when ${schema.payment.type} = 'refund' and ${schema.payment.status} <> 'failed' then ${schema.payment.amount} else 0 end), 0)::int`,
        online: sql<number>`coalesce(sum(case when ${schema.payment.type} = 'payment' and ${schema.payment.method} = 'razorpay' and ${schema.payment.status} = 'success' then ${schema.payment.amount} else 0 end), 0)::int`,
      })
      .from(schema.payment)
      .where(gte(schema.payment.createdAt, monthStartDate)),
    db
      .select({ n: sql<number>`count(*)::int`, amt: sql<number>`coalesce(sum(${schema.booking.subtotal} - ${schema.booking.amountPaid}), 0)::int` })
      .from(schema.booking)
      .where(and(eq(schema.booking.status, "completed"), eq(schema.booking.paymentStatus, "unpaid"))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.shopOrder)
      .where(inArray(schema.shopOrder.status, ["placed", "ready"])),
  ]);

  const active = todayList.filter((b) => b.status !== "cancelled");
  const stats = [
    { label: "Today's bookings", value: String(active.length), href: `/admin/bookings?from=${today}&to=${today}` },
    { label: "Confirmed, next 7 days", value: String(week.n), href: `/admin/bookings?from=${today}&to=${addDays(today, 7)}&status=confirmed` },
    { label: "Net received this month", value: rupees(money.received - money.refunded), href: "/admin/payments" },
    { label: "Unpaid after service", value: dues.n ? `${dues.n} · ${rupees(dues.amt)}` : "0", href: "/admin/bookings?status=completed" },
    { label: "Orders to hand over", value: String(pickups.n), href: "/admin/orders" },
  ];

  return (
    <div>
      <PageTitle title="Dashboard" sub={`Today is ${new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(new Date())}`} />

      {!razorpayConfigured() && (
        <div className="mb-6 rounded-lg border border-warn/40 bg-warn/5 p-4 text-sm">
          <strong>Online payments are off.</strong> Add <code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code> and{" "}
          <code>RAZORPAY_WEBHOOK_SECRET</code> in Vercel, under Settings &gt; Environment Variables,, then redeploy. Until then customers can
          only choose &ldquo;pay at the salon&rdquo;.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border border-line bg-white p-4 transition-colors hover:border-brand/40">
            <p className="text-xs text-mute">{s.label}</p>
            <p className="display mt-2 text-3xl">{s.value}</p>
          </Link>
        ))}
      </div>

      <Card title="Today's schedule" className="mt-6" action={<Link href="/admin/bookings" className="text-xs text-brand underline">All bookings</Link>}>
        {todayList.length === 0 ? <p className="text-sm text-mute">No bookings today.</p> : <BookingTable rows={todayList} hideDate />}
      </Card>

      <p className="mt-6 text-xs text-mute">
        Online received this month: {rupees(money.online)} · Refunds this month: {rupees(money.refunded)}
      </p>
    </div>
  );
}
