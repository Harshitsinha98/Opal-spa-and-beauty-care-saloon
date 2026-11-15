"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { signIn, signUp } from "@/lib/auth-client";

const GOOGLE_ERRORS: Record<string, string> = {
  account_not_linked:
    "An account with this email already exists with a password. Sign in with your email and password instead.",
  "account not linked":
    "An account with this email already exists with a password. Sign in with your email and password instead.",
  access_denied: "Google sign-in was cancelled.",
};

function safeNext(raw: string | null) {
  // Only allow same-site relative paths to avoid open redirects.
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/account";
  return raw;
}

export function AuthForm({ mode, googleEnabled }: { mode: "sign-in" | "sign-up"; googleEnabled: boolean }) {
  const router = useRouter();
  const [next, setNext] = useState("/account");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNext(safeNext(q.get("next")));
    const err = q.get("error");
    if (err) setError(GOOGLE_ERRORS[err] ?? "Google sign-in didn't work. Please try again or use your email and password.");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res =
      mode === "sign-in"
        ? await signIn.email({ email: form.email, password: form.password })
        : await signUp.email({ name: form.name, email: form.email, password: form.password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Something went wrong. Please try again.");
      return;
    }
    const role = (res.data?.user as { role?: string } | undefined)?.role;
    const dest = next === "/account" && role === "admin" ? "/admin" : next === "/account" && role === "staff" ? "/staff" : next;
    router.replace(dest);
    router.refresh();
  };

  const google = async () => {
    setError(null);
    setLoading(true);
    const here = `${window.location.pathname}?next=${encodeURIComponent(next)}`;
    const res = await signIn.social({
      provider: "google",
      // "/go" sends admins to /admin, staff to /staff, customers to /account
      callbackURL: next === "/account" ? "/go" : next,
      newUserCallbackURL: next === "/account" ? "/go" : next,
      errorCallbackURL: here,
    });
    setLoading(false);
    if (res?.error) setError(res.error.message ?? "Google sign-in failed.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
      <h1 className="display text-5xl">{mode === "sign-in" ? "Welcome back" : "Create an account"}</h1>
      <p className="mt-3 text-sm text-mute">
        {mode === "sign-in" ? "Sign in to book and manage your visits." : "Takes a few seconds. You'll use it to manage bookings and orders."}
      </p>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white py-3.5 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9h-4v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
            </svg>
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-4 text-xs text-mute">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={submit} className={googleEnabled ? "space-y-4" : "mt-8 space-y-4"}>
        {mode === "sign-up" && (
          <label className="block text-sm">
            <span className="mb-1.5 block text-mute">Name</span>
            <input className="field" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1.5 block text-mute">Email</span>
          <input className="field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-mute">Password</span>
          <input
            className="field"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          />
        </label>
        {error && (
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
        )}
        <button disabled={loading} className="w-full rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
          {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-mute">
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="text-accent underline underline-offset-4">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="text-accent underline underline-offset-4">
              Sign in
            </Link>
          </>
        )}
      </p>
      {mode === "sign-up" && (
        <p className="mt-4 text-xs leading-relaxed text-mute">
          By creating an account you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      )}
    </motion.div>
  );
}
