import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { requireRole } from "@/lib/session";
import { BookingDetail } from "@/components/admin/BookingDetail";

export default async function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin"], "/admin/bookings");
  const { id } = await params;
  const valid = /^[0-9a-f-]{36}$/i.test(id);
  return (
    <div>
      <Link href="/admin/bookings" className="text-sm text-mute hover:text-ink">
        <Arrow dir="left" /> All bookings
      </Link>
      <div className="mt-4">{valid ? <BookingDetail id={id} role="admin" /> : <p>Booking not found.</p>}</div>
    </div>
  );
}
