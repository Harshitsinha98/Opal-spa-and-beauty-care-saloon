import { asc, desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageTitle } from "@/components/admin/PanelShell";
import { StaffManager } from "@/components/admin/StaffManager";

export default async function AdminStaff() {
  await requireRole(["admin"], "/admin/staff");
  const [rows, s] = await Promise.all([
    db
      .select({ st: schema.staff, email: schema.user.email })
      .from(schema.staff)
      .leftJoin(schema.user, eq(schema.staff.userId, schema.user.id))
      .orderBy(desc(schema.staff.active), asc(schema.staff.name)),
    getSettings(),
  ]);
  return (
    <div>
      <PageTitle title="Staff" sub="Separate logins for your team, with a limited staff panel." />
      <StaffManager staff={rows.map((r) => ({ ...r.st, email: r.email }))} staffSelection={s.booking.allowStaffSelection} />
    </div>
  );
}
