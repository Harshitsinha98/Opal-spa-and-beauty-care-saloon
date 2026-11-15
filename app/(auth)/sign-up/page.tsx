import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { authFlags } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignUpPage() {
  return <AuthForm mode="sign-up" googleEnabled={authFlags.googleEnabled} />;
}
