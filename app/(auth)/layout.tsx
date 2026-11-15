import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Photo } from "@/components/Photo";
import { MotionRoot } from "@/components/motion/MotionRoot";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionRoot>
      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-plum lg:block">
          <Photo name="room-buddha" sizes="50vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/10 to-transparent" />
          <p className="display absolute bottom-12 left-12 right-12 text-5xl text-paper">
            Your bookings, <em className="text-blush">in one place.</em>
          </p>
        </div>
        <div className="flex flex-col px-6 py-8 md:px-16">
          <Link href="/" aria-label="Back to home" className="w-fit">
            <Logo />
          </Link>
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
        </div>
      </div>
    </MotionRoot>
  );
}
