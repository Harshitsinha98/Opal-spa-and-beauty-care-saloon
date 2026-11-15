import type { Metadata } from "next";
import { availableMethods, getSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const s = await getSettings();
  return <CheckoutForm methods={availableMethods(s)} businessName={s.business.name} address={s.business.address} />;
}
