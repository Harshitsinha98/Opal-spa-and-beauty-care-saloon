import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "./db";

export async function getMenu() {
  const cats = await db.select().from(schema.serviceCategory).orderBy(asc(schema.serviceCategory.sort), asc(schema.serviceCategory.id));
  const services = await db
    .select()
    .from(schema.service)
    .where(eq(schema.service.active, true))
    .orderBy(asc(schema.service.sort), asc(schema.service.id));
  return cats
    .map((c) => ({ ...c, services: services.filter((s) => s.categoryId === c.id) }))
    .filter((c) => c.services.length > 0);
}

export async function getFeaturedServices(limit = 6) {
  const rows = await db
    .select({ s: schema.service, c: schema.serviceCategory })
    .from(schema.service)
    .innerJoin(schema.serviceCategory, eq(schema.service.categoryId, schema.serviceCategory.id))
    .where(and(eq(schema.service.active, true), eq(schema.service.featured, true)))
    .orderBy(asc(schema.serviceCategory.sort), asc(schema.service.sort))
    .limit(limit);
  return rows.map(({ s, c }) => ({ ...s, category: c.name }));
}

export async function getProducts() {
  return db
    .select()
    .from(schema.product)
    .where(eq(schema.product.active, true))
    .orderBy(asc(schema.product.sort), asc(schema.product.id));
}

export async function getBookableStaff() {
  return db
    .select({ id: schema.staff.id, name: schema.staff.name, title: schema.staff.title })
    .from(schema.staff)
    .where(and(eq(schema.staff.active, true), eq(schema.staff.bookable, true)))
    .orderBy(asc(schema.staff.name));
}
