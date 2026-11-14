import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { requireRole } from "@/lib/session";
import { BookingDetail } from "@/components/admin/BookingDetail";

export default async function StaffBookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["staff", "admin"], "/staff");
  const { id } = await params;
  return (
    <div>
      <Link href="/staff" className="text-sm text-mute hover:text-ink">
        <Arrow dir="left" /> Back to the day
      </Link>
      <div className="mt-4">{/^[0-9a-f-]{36}$/i.test(id) ? <BookingDetail id={id} role="staff" /> : <p>Booking not found.</p>}</div>
    </div>
  );
}
