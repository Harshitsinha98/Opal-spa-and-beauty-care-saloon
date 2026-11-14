import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db, schema } from "./db";

export type Role = "customer" | "staff" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: Role;
};

/**
 * Reads the session, then re-reads the role from the database so a role change
 * (e.g. a staff member being removed) takes effect immediately instead of
 * waiting for the session cookie cache to expire.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = await db.query.user.findFirst({ where: eq(schema.user.id, s.user.id) });
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    image: u.image,
    role: (["customer", "staff", "admin"].includes(u.role) ? u.role : "customer") as Role,
  };
}

export async function requireUser(next = "/account") {
  const u = await getCurrentUser();
  if (!u) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return u;
}

export async function requireRole(roles: Role[], next = "/") {
  const u = await requireUser(next);
  if (!roles.includes(u.role)) redirect("/account");
  return u;
}

/** For server actions: throws instead of redirecting. */
export async function assertRole(roles: Role[]) {
  const u = await getCurrentUser();
  if (!u || !roles.includes(u.role)) throw new Error("Not allowed");
  return u;
}
