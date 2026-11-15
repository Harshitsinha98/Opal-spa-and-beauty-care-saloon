"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut } from "@/lib/auth-client";
import { cancelMyBookingAction } from "@/app/actions/booking";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.replace("/");
        router.refresh();
      }}
      className="rounded-full border border-line px-5 py-2.5 text-sm hover:border-ink"
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
      <button onClick={() => setConfirming(true)} className="text-sm text-bad underline underline-offset-4">
        Cancel
      </button>
    );

  return (
    <div className="space-y-2 text-left text-xs md:text-right">
      <p className="text-mute">{summary}</p>
      <div className="flex gap-3 md:justify-end">
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelMyBookingAction(id);
              if (!r.ok) return setError(r.error);
              router.refresh();
            })
          }
          className="rounded-full bg-bad px-4 py-2 text-paper disabled:opacity-60"
        >
          {pending ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button onClick={() => setConfirming(false)} className="rounded-full border border-line px-4 py-2">
          Keep it
        </button>
      </div>
      {error && <p className="text-bad">{error}</p>}
    </div>
  );
}
