"use client";

import { useState } from "react";
import type { Settings } from "@/lib/settings";
import { saveSettingsAction } from "@/app/actions/admin";
import { Btn, Card, Field, useFormAction } from "./ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Env = { razorpay: boolean; webhook: boolean; google: boolean; blob: boolean; siteUrl: string };

export function SettingsForm({ initial, env }: { initial: Settings; env: Env }) {
  const [s, setS] = useState<Settings>(initial);
  const [closedDate, setClosedDate] = useState("");
  const [saved, setSaved] = useState(false);
  const f = useFormAction();

  const up = <K extends keyof Settings>(k: K, patch: Partial<Settings[K]>) => {
    setSaved(false);
    setS((cur) => ({ ...cur, [k]: { ...cur[k], ...patch } }));
  };
  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <form
      className="space-y-4 pb-20"
      onSubmit={(e) => {
        e.preventDefault();
        f.run(() => saveSettingsAction(s), () => setSaved(true));
      }}
    >
      <Card title="Business details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Business name">
            <input className="field" value={s.business.name} onChange={(e) => up("business", { name: e.target.value })} />
          </Field>
          <Field label="Legal name" hint="Shown in the footer and legal pages. Leave blank to use the business name.">
            <input className="field" value={s.business.legalName} onChange={(e) => up("business", { legalName: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="field" value={s.business.phone} onChange={(e) => up("business", { phone: e.target.value })} placeholder="+91 98xxx xxxxx" />
          </Field>
          <Field label="WhatsApp number">
            <input className="field" value={s.business.whatsapp} onChange={(e) => up("business", { whatsapp: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className="field" type="email" value={s.business.email} onChange={(e) => up("business", { email: e.target.value })} />
          </Field>
          <Field label="Instagram URL">
            <input className="field" value={s.business.instagram} onChange={(e) => up("business", { instagram: e.target.value })} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="Address" className="md:col-span-2">
            <textarea className="field min-h-16" value={s.business.address} onChange={(e) => up("business", { address: e.target.value })} />
          </Field>
          <Field label="Google Maps / review link">
            <input className="field" value={s.business.mapsUrl} onChange={(e) => up("business", { mapsUrl: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Google rating">
              <input className="field" inputMode="decimal" value={s.business.googleRating} onChange={(e) => up("business", { googleRating: num(e.target.value) })} />
            </Field>
            <Field label="Review count">
              <input className="field" type="number" value={s.business.googleReviewCount} onChange={(e) => up("business", { googleReviewCount: num(e.target.value) })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Opening hours">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Opens">
            <input className="field" type="time" value={s.hours.open} onChange={(e) => up("hours", { open: e.target.value })} />
          </Field>
          <Field label="Closes" hint="Last booking must finish by this time">
            <input className="field" type="time" value={s.hours.close} onChange={(e) => up("hours", { close: e.target.value })} />
          </Field>
          <Field label="Closed every">
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => {
                const on = s.hours.closedWeekdays.includes(i);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => up("hours", { closedWeekdays: on ? s.hours.closedWeekdays.filter((x) => x !== i) : [...s.hours.closedWeekdays, i].sort() })}
                    className={`rounded border px-2.5 py-1.5 text-xs ${on ? "border-bad bg-bad/10 text-bad" : "border-line"}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Holidays (closed dates)" className="md:col-span-3">
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" className="field w-auto" value={closedDate} onChange={(e) => setClosedDate(e.target.value)} />
              <Btn
                type="button"
                variant="ghost"
                disabled={!closedDate}
                onClick={() => {
                  if (!s.hours.closedDates.includes(closedDate)) up("hours", { closedDates: [...s.hours.closedDates, closedDate].sort() });
                  setClosedDate("");
                }}
              >
                Add
              </Btn>
              {s.hours.closedDates.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 rounded bg-ivory px-2 py-1 text-xs">
                  {d}
                  <button type="button" className="text-bad" onClick={() => up("hours", { closedDates: s.hours.closedDates.filter((x) => x !== d) })} aria-label={`Remove ${d}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      <Card title="Booking">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Guests at the same time" hint="Rooms / therapists available in parallel">
            <input className="field" type="number" min={1} max={50} value={s.booking.capacityPerSlot} onChange={(e) => up("booking", { capacityPerSlot: num(e.target.value) })} />
          </Field>
          <Field label="Slot interval (minutes)" hint="Start times every…">
            <select className="field" value={s.booking.slotIntervalMin} onChange={(e) => up("booking", { slotIntervalMin: num(e.target.value) })}>
              {[15, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Book up to (days ahead)">
            <input className="field" type="number" min={1} max={180} value={s.booking.advanceDays} onChange={(e) => up("booking", { advanceDays: num(e.target.value) })} />
          </Field>
          <Field label="Minimum notice (minutes)" hint="For same-day bookings">
            <input className="field" type="number" min={0} max={1440} value={s.booking.minLeadMinutes} onChange={(e) => up("booking", { minLeadMinutes: num(e.target.value) })} />
          </Field>
          <Field label="Hold slot during online payment (minutes)">
            <input className="field" type="number" min={5} max={60} value={s.booking.holdMinutes} onChange={(e) => up("booking", { holdMinutes: num(e.target.value) })} />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={s.booking.allowStaffSelection} onChange={(e) => up("booking", { allowStaffSelection: e.target.checked })} />
            Let customers choose a therapist
          </label>
        </div>
      </Card>

      <Card title="Payments">
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.payments.onlineEnabled} onChange={(e) => up("payments", { onlineEnabled: e.target.checked })} />
            Online payment (Razorpay)
            {!env.razorpay && <span className="text-xs text-warn">Keys not set yet, so this option stays hidden from customers</span>}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.payments.cashEnabled} onChange={(e) => up("payments", { cashEnabled: e.target.checked })} />
            Pay at the salon / at pickup
          </label>
          <ul className="mt-2 space-y-1 rounded-md bg-ivory/70 p-3 text-xs">
            <li>Razorpay keys: {env.razorpay ? "✓ set" : "✗ missing (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)"}</li>
            <li>
              Razorpay webhook: {env.webhook ? "✓ set" : "✗ missing (RAZORPAY_WEBHOOK_SECRET)"}. URL: <code>{env.siteUrl}/api/razorpay/webhook</code>
            </li>
            <li>Google sign-in: {env.google ? "✓ on" : "off (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)"}</li>
            <li>Image uploads: {env.blob ? "✓ on" : "off (BLOB_READ_WRITE_TOKEN). You can still paste image URLs."}</li>
          </ul>
        </div>
      </Card>

      <Card title="Cancellation fee">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="flex items-center gap-2 text-sm md:col-span-4">
            <input type="checkbox" checked={s.cancellation.allowCustomerCancel} onChange={(e) => up("cancellation", { allowCustomerCancel: e.target.checked })} />
            Customers can cancel from their account
          </label>
          <Field label="Free cancellation until (hours before)" hint="0 = fee always applies">
            <input className="field" type="number" min={0} max={168} value={s.cancellation.freeWindowHours} onChange={(e) => up("cancellation", { freeWindowHours: num(e.target.value) })} />
          </Field>
          <Field label="Fee type">
            <select className="field" value={s.cancellation.feeType} onChange={(e) => up("cancellation", { feeType: e.target.value as "percent" | "flat" })}>
              <option value="percent">Percentage of amount paid</option>
              <option value="flat">Fixed amount (₹)</option>
            </select>
          </Field>
          <Field label={s.cancellation.feeType === "percent" ? "Fee (%)" : "Fee (₹)"} hint="Set 0 for no fee">
            <input className="field" inputMode="decimal" value={s.cancellation.feeValue} onChange={(e) => up("cancellation", { feeValue: num(e.target.value) })} />
          </Field>
          <p className="self-end pb-2 text-xs text-mute md:col-span-1">
            The fee is kept from online payments when a customer cancels late. You can always change the refund when you cancel a booking yourself.
          </p>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="flex items-center gap-4">
          <Btn type="submit" disabled={f.pending}>
            {f.pending ? "Saving…" : "Save settings"}
          </Btn>
          {saved && <span className="text-sm text-ok">Saved. The website is updated.</span>}
          {f.error && <span className="text-sm text-bad">{f.error}</span>}
        </div>
      </div>
    </form>
  );
}
