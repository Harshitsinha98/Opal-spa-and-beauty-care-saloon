import { requireRole } from "@/lib/session";
import { getSettings, razorpayConfigured } from "@/lib/settings";
import { PageTitle } from "@/components/admin/PanelShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettings() {
  await requireRole(["admin"], "/admin/settings");
  const s = await getSettings();
  return (
    <div>
      <PageTitle title="Settings" sub="Business details, opening hours, booking rules, payments and the cancellation fee." />
      <SettingsForm
        initial={s}
        env={{
          razorpay: razorpayConfigured(),
          webhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
          google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
        }}
      />
    </div>
  );
}
