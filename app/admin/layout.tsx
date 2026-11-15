import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { PanelShell } from "@/components/admin/PanelShell";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/orders", label: "Shop orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/services", label: "Services & prices" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin"], "/admin");
  return (
    <PanelShell nav={NAV} user={user} label="Admin">
      {children}
    </PanelShell>
  );
}
