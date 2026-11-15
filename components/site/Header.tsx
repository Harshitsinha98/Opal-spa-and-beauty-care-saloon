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
    setSolid(y > 40);
    setHidden(y > 300 && y > prev && !menu);
  });

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const panelHref = user?.role === "admin" ? "/admin" : user?.role === "staff" ? "/staff" : "/account";

  return (
    <>
      <motion.header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          solid && !menu ? "bg-paper/85 backdrop-blur-md border-b border-line/70" : "bg-transparent",
        )}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between px-5 md:px-10">
          <Link href="/" aria-label="Opal Spa home" className="relative z-10">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-9 text-[0.82rem] tracking-wide lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx("link-u py-1", pathname.startsWith(n.href) ? "text-wine" : "text-ink/80 hover:text-ink")}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="relative z-10 flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setOpen(true)}
              className="relative px-2 py-1 text-[0.82rem] tracking-wide text-ink/80 hover:text-ink"
              aria-label={`Open bag, ${count} items`}
            >
              Bag
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-plum px-1 text-[0.65rem] text-paper">
                {count}
              </span>
            </button>
            <Link href={user ? panelHref : "/sign-in"} className="hidden text-[0.82rem] tracking-wide text-ink/80 hover:text-ink md:block">
              {user ? (user.role === "customer" ? "Account" : "Dashboard") : "Sign in"}
            </Link>
            <Link
              href="/book"
              className="hidden rounded-full bg-plum px-5 py-2.5 text-[0.8rem] tracking-wide text-paper transition-colors hover:bg-wine sm:inline-block"
            >
              Book a visit
            </Link>
            <button
              className="flex h-10 w-10 flex-col items-center justify-center gap-[6px] lg:hidden"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-label={menu ? "Close menu" : "Open menu"}
            >
              <motion.span className="block h-px w-6 bg-ink" animate={menu ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }} />
              <motion.span className="block h-px w-6 bg-ink" animate={menu ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }} />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-between bg-ivory px-6 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="flex flex-col gap-2" aria-label="Mobile">
              {[...NAV, { href: "/book", label: "Book a visit" }, { href: user ? panelHref : "/sign-in", label: user ? "My account" : "Sign in" }].map((n, i) => (
                <div key={n.href + n.label} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.06 }}
                  >
                    <Link href={n.href} className="display block py-1 text-[3.1rem] text-ink">
                      {n.label}
                    </Link>
                  </motion.div>
                </div>
              ))}
            </nav>
            <motion.div
              className="text-sm text-mute"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p>Arera Colony, Bhopal · {hours}</p>
              {phone && <p className="mt-1">{phone}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
