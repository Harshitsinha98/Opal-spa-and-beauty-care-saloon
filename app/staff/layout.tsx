import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { PanelShell } from "@/components/admin/PanelShell";

export const metadata: Metadata = { title: "Staff", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["staff", "admin"], "/staff");
  const nav = [
    { href: "/staff", label: "Today's bookings" },
    { href: "/staff/orders", label: "Shop pickups" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Admin panel" }] : []),
  ];
  return (
    <PanelShell nav={nav} user={user} label="Staff">
      {children}
    </PanelShell>
  );
}
