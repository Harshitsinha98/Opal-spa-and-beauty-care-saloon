import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Post-login landing: sends each role to its own home (used after Google sign-in). */
export default async function Go() {
  const u = await getCurrentUser();
  if (!u) redirect("/sign-in");
  redirect(u.role === "admin" ? "/admin" : u.role === "staff" ? "/staff" : "/account");
}
