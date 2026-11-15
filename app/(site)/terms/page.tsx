import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { LegalPage, LEGAL_UPDATED } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for booking treatments, buying products and using the Opal Spa website.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const s = await getSettings();
  const b = s.business;
  const who = b.legalName || b.name;
  return (
    <LegalPage title="Terms of Service" updated={LEGAL_UPDATED}>
      <p>
        These terms apply when you use this website, book a treatment or buy a product from {who} (&ldquo;Opal&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;), located at {b.address}. By making a booking or an order you agree to them.
      </p>

      <h2>1. Your account</h2>
      <p>
        You need an account to book or order. Keep your password private and give us accurate contact details. We use your phone
        number and email only to manage your bookings and orders (see our <Link href="/privacy">Privacy Policy</Link>).
      </p>

      <h2>2. Bookings</h2>
      <ul>
        <li>A booking is confirmed when you see a booking reference on screen. Online-paid bookings are confirmed once Razorpay confirms the payment.</li>
        <li>If you choose online payment, the time is held for {s.booking.holdMinutes} minutes while you pay. If payment isn&rsquo;t completed, the hold is released.</li>
        <li>Please arrive a few minutes early. If you arrive late, we may need to shorten your session so the next guest isn&rsquo;t delayed.</li>
        <li>We may occasionally need to move or cancel a booking (for example, staff illness). We&rsquo;ll contact you and offer a new time or a full refund.</li>
      </ul>

      <h2>3. Prices and payment</h2>
      <ul>
        <li>Prices are in Indian Rupees and shown on the menu at the time you book. The price at booking is the price you pay for that booking.</li>
        <li>Online payments are processed by Razorpay. We never see or store your card, UPI PIN or bank login.</li>
        <li>If you choose to pay at the salon, payment is due after your session.</li>
      </ul>

      <h2>4. Cancellations and refunds</h2>
      <p>
        See our <Link href="/cancellation-policy">Cancellation &amp; Refund Policy</Link>. It forms part of these terms.
      </p>

      <h2>5. Your health and safety</h2>
      <ul>
        <li>Tell your therapist before the session about any medical condition, injury, allergy, skin sensitivity, pregnancy or recent surgery.</li>
        <li>Our treatments are for relaxation and personal care. They are not medical treatment and don&rsquo;t replace advice from a doctor.</li>
        <li>We may decline or stop a treatment if we believe it isn&rsquo;t safe for you.</li>
      </ul>

      <h2>6. Conduct</h2>
      <p>
        All services at Opal are strictly professional. We will end a session, without refund, if a guest behaves inappropriately
        towards staff or other guests, or asks for anything outside the listed services.
      </p>

      <h2>7. Shop orders (pickup only)</h2>
      <ul>
        <li>Products are for pickup from the salon front desk only. We don&rsquo;t deliver or ship.</li>
        <li>Collect your order during opening hours and show your order reference. Please collect within 7 days; if you can&rsquo;t, call us.</li>
        <li>For hygiene reasons, opened products can&rsquo;t be returned. Unopened, unused products can be returned within 7 days of pickup with the order reference.</li>
      </ul>

      <h2>8. Website</h2>
      <p>
        The photos, text and design on this website belong to Opal and may not be copied without permission. Reviews shown on
        the site are quoted from our public Google Business Profile.
      </p>

      <h2>9. Liability</h2>
      <p>
        We take care to provide services safely. To the extent allowed by law, our liability for any claim related to a booking
        or order is limited to the amount you paid for it. Nothing in these terms limits rights you have under the Consumer
        Protection Act, 2019.
      </p>

      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of India. Courts in Bhopal, Madhya Pradesh have jurisdiction.</p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms: {b.email ? <a href={`mailto:${b.email}`}>{b.email}</a> : "ask at the front desk"}
        {b.phone ? `, or call ${b.phone}` : ""}. Address: {b.address}.
      </p>
    </LegalPage>
  );
}
