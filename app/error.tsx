"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <h1 className="display text-5xl md:text-7xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-mute">Please try again. If it keeps happening, call the salon and we&rsquo;ll help you book.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="rounded-full bg-plum px-6 py-3 text-sm text-paper">
          Try again
        </button>
        <Link href="/" className="rounded-full border border-line px-6 py-3 text-sm">
          Home
        </Link>
      </div>
    </main>
  );
}
