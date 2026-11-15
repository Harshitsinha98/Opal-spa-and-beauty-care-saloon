"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut } from "@/lib/auth-client";
import {
  cancelMyBookingAction,
  resumePaymentAction,
  switchToCashAction,
  updateProfileAction,
  verifyPaymentAction,
} from "@/app/actions/booking";
import { payWithRazorpay } from "../payments/razorpay-checkout";
import { RescheduleSheet, type RescheduleRules } from "./RescheduleSheet";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.replace("/");
        router.refresh();
      }}
      className={className ?? "rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-ink"}
    >
      Sign out
    </button>
  );
}

export function CancelBookingButton({ id, summary }: { id: string; summary: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!confirming)
    return (
      <button onClick={() => setConfirming(true)} className="rounded-full px-4 py-2.5 text-sm font-semibold text-bad hover:bg-bad/5">
        Cancel
      </button>
    );

  return (
    <div className="w-full space-y-3 rounded-2xl bg-bad/5 p-4 text-sm">
      <p>{summary}</p>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelMyBookingAction(id);
              if (!r.ok) return setError(r.error);
              router.refresh();
            })
          }
          className="rounded-full bg-bad px-5 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Cancelling…" : "Yes, cancel booking"}
        </button>
        <button onClick={() => setConfirming(false)} className="rounded-full border border-line bg-white px-5 py-2.5 font-semibold">
          Keep it
        </button>
      </div>
      {error && <p className="text-bad">{error}</p>}
    </div>
  );
}

export function RescheduleButton(props: {
  booking: { id: string; date: string; startMin: number; durationMin: number; services: string };
  rules: RescheduleRules;
  movesLeft: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand">
        Reschedule
      </button>
      <RescheduleSheet open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}

/** For bookings or orders whose online payment wasn't finished while the hold is still open. */
export function CompletePaymentButtons({ kind, id, businessName, allowCash }: { kind: "booking" | "order"; id: string; businessName: string; allowCash: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pay = () =>
    start(async () => {
      setError(null);
      const r = await resumePaymentAction(kind, id);
      if (!r.ok) return setError(r.error);
      try {
        const res = await payWithRazorpay(r.checkout, businessName);
        if (!res) return;
        const v = await verifyPaymentAction(res);
        if (!v.ok) setError(v.error);
      } catch (e) {
        setError((e as Error).message);
      }
      router.refresh();
    });
  const cash = () =>
    start(async () => {
      const r = await switchToCashAction(id);
      if (!r.ok) return setError(r.error);
      router.refresh();
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={pay} disabled={pending} className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {pending ? "Please wait…" : "Complete payment"}
      </button>
      {kind === "booking" && allowCash && (
        <button onClick={cash} disabled={pending} className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-ink">
          Pay at salon instead
        </button>
      )}
      {error && <p className="w-full text-sm text-bad">{error}</p>}
    </div>
  );
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [v, setV] = useState({ name, phone });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="grid gap-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        setError(null);
        start(async () => {
          const r = await updateProfileAction(v);
          if (!r.ok) return setError(r.error);
          setSaved(true);
          router.refresh();
        });
      }}
    >
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-mute">Full name</span>
        <input className="field" required minLength={2} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-mute">Mobile number</span>
        <input className="field" inputMode="tel" placeholder="98xxxxxxxx" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} autoComplete="tel" />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1.5 block font-medium text-mute">Email</span>
        <input className="field bg-ivory/60 text-mute" value={email} disabled />
        <span className="mt-1 block text-xs text-mute">Your sign-in email can&rsquo;t be changed here.</span>
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button disabled={pending} className="rounded-full bg-brand px-7 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-ok">Saved</span>}
        {error && <span className="text-sm text-bad">{error}</span>}
      </div>
    </form>
  );
}
