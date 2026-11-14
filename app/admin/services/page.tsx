import { asc } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { PageTitle } from "@/components/admin/PanelShell";
import { ServicesManager } from "@/components/admin/ServicesManager";

export default async function AdminServices() {
  await requireRole(["admin"], "/admin/services");
  const [cats, services] = await Promise.all([
    db.select().from(schema.serviceCategory).orderBy(asc(schema.serviceCategory.sort), asc(schema.serviceCategory.id)),
    db.select().from(schema.service).orderBy(asc(schema.service.sort), asc(schema.service.id)),
  ]);
  return (
    <div>
      <PageTitle
        title="Services & prices"
        sub="The menu, booking page and home page update as soon as you save. The demo services and prices are placeholders, so edit them to match your real menu."
      />
      <ServicesManager cats={cats} services={services} />
    </div>
  );
}
