"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import clsx from "clsx";
import { Logo } from "../Logo";
import { NAV } from "@/lib/site";
import { useCart } from "../cart/CartContext";
import { useSession } from "@/lib/auth-client";

type Props = { phone: string; hours: string };

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function Header({ phone, hours }: Props) {
  const { data: session } = useSession();
  const user = session?.user ? { name: session.user.name, role: (session.user as { role?: string }).role ?? "customer" } : null;
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const { count, setOpen } = useCart();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(y > 24);
    setHidden(y > 400 && y > prev && !menu);
  });

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const panelHref = user?.role === "admin" ? "/admin" : user?.role === "staff" ? "/staff" : "/account";
  const links = [{ href: "/", label: "Home" }, ...NAV];

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4"
        animate={{ y: hidden ? "-120%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={clsx(
            "mx-auto flex h-16 max-w-[1280px] items-center justify-between rounded-full border px-3 pl-4 transition-all duration-500 md:pl-5",
            solid || menu ? "border-line bg-white/85 shadow-[var(--shadow-card)] backdrop-blur-xl" : "border-transparent bg-white/60 backdrop-blur-md",
          )}
        >
          <Link href="/" aria-label="Opal Spa home" className="relative z-10">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-ivory/70 p-1 text-[0.86rem] font-medium lg:flex" aria-label="Main">
            {links.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={clsx("relative rounded-full px-4 py-2 transition-colors", active ? "text-ink" : "text-mute hover:text-ink")}
                >
                  {active && (
                    <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white shadow-sm" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                  )}
                  <span className="relative">{n.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="relative z-10 flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => setOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ivory"
              aria-label={`Open bag, ${count} items`}
            >
              <BagIcon />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
            <Link
              href={user ? panelHref : "/sign-in"}
              className="hidden rounded-full px-4 py-2.5 text-[0.86rem] font-semibold text-ink transition-colors hover:bg-ivory md:block"
            >
              {user ? (user.role === "customer" ? "My account" : "Dashboard") : "Sign in"}
            </Link>
            <Link
              href="/book"
              className="hidden rounded-full bg-brand px-5 py-2.5 text-[0.86rem] font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:inline-block"
            >
              Book now
            </Link>
            <button
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full hover:bg-ivory lg:hidden"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-label={menu ? "Close menu" : "Open menu"}
            >
              <motion.span className="block h-[2px] w-5 rounded bg-ink" animate={menu ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }} />
              <motion.span className="block h-[2px] w-5 rounded bg-ink" animate={menu ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }} />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-between bg-paper px-6 pb-8 pt-28 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {[...links, { href: user ? panelHref : "/sign-in", label: user ? "My account" : "Sign in" }].map((n, i) => (
                <motion.div
                  key={n.href + n.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 + i * 0.04 }}
                >
                  <Link href={n.href} className="display block border-b border-line py-3.5 text-3xl text-ink">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="space-y-4">
              <Link href="/book" className="block rounded-full bg-brand py-4 text-center font-semibold text-white">
                Book a visit
              </Link>
              <p className="text-center text-sm text-mute">
                Arera Colony, Bhopal · {hours}
                {phone && <span className="block">{phone}</span>}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
