import type { Metadata } from "next";
import { getMenu, getBookableStaff } from "@/lib/catalog";
import { availableMethods, getSettings } from "@/lib/settings";
import { hhmmToMinutes } from "@/lib/format";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book a visit",
  description: "Book a massage, facial or salon service at Opal Spa, Arera Colony, Bhopal. See live availability and pay online or at the salon.",
  alternates: { canonical: "/book" },
};

export default async function BookPage() {
  const [menu, s] = await Promise.all([getMenu(), getSettings()]);
  const staff = s.booking.allowStaffSelection ? await getBookableStaff() : [];
  const c = s.cancellation;
  return (
    <BookingWizard
      businessName={s.business.name}
      menu={menu.map((cat) => ({
        id: cat.id,
        name: cat.name,
        services: cat.services.map((x) => ({ id: x.id, name: x.name, price: x.price, durationMin: x.durationMin, description: x.description })),
      }))}
      staff={staff}
      methods={availableMethods(s)}
      advanceDays={s.booking.advanceDays}
      closedWeekdays={s.hours.closedWeekdays}
      closedDates={s.hours.closedDates}
      dayLength={hhmmToMinutes(s.hours.close) - hhmmToMinutes(s.hours.open)}
      policy={{
        allowCancel: c.allowCustomerCancel,
        freeHours: c.freeWindowHours,
        fee: c.feeType === "percent" ? `${c.feeValue}% of the amount paid` : `₹${c.feeValue}`,
      }}
    />
  );
}
