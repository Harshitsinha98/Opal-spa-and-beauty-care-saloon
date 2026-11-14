import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { LegalPage, LEGAL_UPDATED } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "How cancellations, cancellation fees and refunds work at Opal Spa.",
  alternates: { canonical: "/cancellation-policy" },
};

export default async function CancellationPage() {
  const s = await getSettings();
  const c = s.cancellation;
  const b = s.business;
  const fee = c.feeType === "percent" ? `${c.feeValue}% of the amount paid` : `₹${c.feeValue} (or the amount paid, if less)`;
  return (
    <LegalPage title="Cancellation & Refund Policy" updated={LEGAL_UPDATED}>
      <h2>Cancelling a booking</h2>
      {c.allowCustomerCancel ? (
        <p>
          You can cancel any upcoming booking from <Link href="/account">My account</Link> until your appointment starts.
          You can also call or visit the salon.
        </p>
      ) : (
        <p>To cancel a booking, please call or visit the salon.</p>
      )}

      <h2>Cancellation fee</h2>
      <ul>
        {c.freeWindowHours > 0 ? (
          <>
            <li>
              Cancel <strong>{c.freeWindowHours} hours or more</strong> before your appointment: full refund, no fee.
            </li>
            <li>
              Cancel <strong>less than {c.freeWindowHours} hours</strong> before: a cancellation fee of <strong>{fee}</strong> is
              kept and the rest is refunded.
            </li>
          </>
        ) : (
          <li>
            A cancellation fee of <strong>{fee}</strong> applies to every cancellation of a booking paid online.
          </li>
        )}
        <li>If you chose to pay at the salon, there is nothing to refund and no fee is charged online.</li>
        <li>Missed appointments without notice (no-shows) are not refunded.</li>
        <li>If we cancel or can&rsquo;t provide your treatment, you get a full refund.</li>
      </ul>
      <p>The salon may waive or reduce the fee at its discretion, for example for emergencies.</p>

      <h2>How refunds are paid</h2>
      <ul>
        <li>Refunds go back to the original payment method through Razorpay.</li>
        <li>Razorpay usually starts the refund straight away. Banks typically take 5–7 working days to show it in your account.</li>
        <li>Payments made in cash at the salon are refunded at the salon.</li>
      </ul>

      <h2>Shop orders</h2>
      <ul>
        <li>Orders are for pickup only. If an order is cancelled before pickup, the full amount paid online is refunded.</li>
        <li>Opened products can&rsquo;t be returned for hygiene reasons. Unopened products can be returned at the salon within 7 days of pickup.</li>
      </ul>

      <h2>Questions</h2>
      <p>
        Contact us {b.phone ? `on ${b.phone}` : "at the salon"}
        {b.email ? (
          <>
            {" "}or at <a href={`mailto:${b.email}`}>{b.email}</a>
          </>
        ) : null}
        , with your booking or order reference.
      </p>
    </LegalPage>
  );
}
