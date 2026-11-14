import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { authFlags } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  return <AuthForm mode="sign-in" googleEnabled={authFlags.googleEnabled} />;
}
