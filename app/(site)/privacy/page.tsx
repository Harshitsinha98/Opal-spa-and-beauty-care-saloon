import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { LegalPage, LEGAL_UPDATED } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Opal Spa collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const s = await getSettings();
  const b = s.business;
  const who = b.legalName || b.name;
  const contact = b.email ? <a href={`mailto:${b.email}`}>{b.email}</a> : "the salon front desk";
  return (
    <LegalPage title="Privacy Policy" updated={LEGAL_UPDATED}>
      <p>
        This policy explains what personal data {who} collects through this website and at the salon, why, and what you can do
        about it. We follow the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> name, email address, mobile number and, if you sign in with Google, your Google profile name and photo.</li>
        <li><strong>Bookings and orders:</strong> the treatments or products you choose, dates and times, amounts, and any notes you add.</li>
        <li><strong>Health notes you choose to share:</strong> for example allergies or pressure preferences. We use these only to give you a safe treatment.</li>
        <li><strong>Payment records:</strong> Razorpay payment and refund IDs, amount and status. Card, UPI and bank details are handled by Razorpay and never reach us.</li>
        <li><strong>Technical data:</strong> a sign-in cookie, your IP address and browser type (kept with your login session for security).</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To create and manage your bookings and orders, and to contact you about them.</li>
        <li>To take payments and issue refunds.</li>
        <li>To keep accounts secure and prevent misuse.</li>
        <li>To meet tax and accounting obligations.</li>
      </ul>
      <p>We don&rsquo;t sell your data, and we don&rsquo;t send marketing messages unless you ask us to.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li><strong>Razorpay</strong>, to process payments and refunds.</li>
        <li><strong>Google</strong>, if you choose Google sign-in, and to show the map on our contact page.</li>
        <li><strong>Our hosting and database providers</strong> (Vercel and Neon), who store the website and its data on our behalf.</li>
        <li>Authorities, when the law requires it.</li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>
        We use one essential cookie to keep you signed in. Your shopping bag is saved in your browser&rsquo;s local storage so it
        survives a page refresh. We don&rsquo;t use advertising cookies.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep account details while your account is open. Booking, order and payment records are kept for as long as Indian tax
        and accounting law requires, then deleted.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see the data we hold about you, correct it, or delete your account. You can also withdraw consent for
        optional data such as health notes. Contact {contact} and we&rsquo;ll respond within 30 days. Some records may need to be
        kept for legal reasons even after you close your account.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are stored as one-way hashes. Data travels over HTTPS. Only salon staff who need it can see booking details,
        and only the salon admin can see payment records.
      </p>

      <h2>Grievances</h2>
      <p>
        If you have a concern about how we handle your data, contact {contact}
        {b.phone ? ` or call ${b.phone}` : ""}, or write to us at {b.address}.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy we&rsquo;ll update the date at the top of this page.</p>
    </LegalPage>
  );
}
