import { asc } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import { db, schema } from "@/lib/db";
import { PageTitle } from "@/components/admin/PanelShell";
import { ProductsManager } from "@/components/admin/ProductsManager";

export default async function AdminProducts() {
  await requireRole(["admin"], "/admin/products");
  const products = await db.select().from(schema.product).orderBy(asc(schema.product.sort), asc(schema.product.id));
  return (
    <div>
      <PageTitle title="Products" sub="Sold for pickup at the salon. Stock drops when an order is placed and returns if it's cancelled." />
      <ProductsManager products={products} />
    </div>
  );
}
