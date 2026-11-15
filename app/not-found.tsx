import Link from "next/link";
import { OpalMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <OpalMark className="h-14 w-auto text-brand" />
      <h1 className="display mt-8 text-6xl md:text-8xl">
        Wrong <em className="text-accent">room.</em>
      </h1>
      <p className="mt-4 text-mute">This page doesn&rsquo;t exist, or it has moved.</p>
      <Link href="/" className="mt-10 rounded-full bg-brand px-7 py-4 text-sm text-paper hover:bg-brand-700">
        Back to the front desk
      </Link>
    </main>
  );
}
