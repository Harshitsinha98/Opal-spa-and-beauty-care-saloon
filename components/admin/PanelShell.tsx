"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Logo } from "../Logo";
import { signOut } from "@/lib/auth-client";

export function PanelShell({
  nav,
  user,
  label,
  children,
}: {
  nav: { href: string; label: string }[];
  user: { name: string; email: string };
  label: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" || href === "/staff" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-[#f7f3ee] text-ink">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Link href={nav[0].href}>
          <Logo />
        </Link>
        <button onClick={() => setOpen((o) => !o)} className="text-sm" aria-expanded={open}>
          {open ? "Close" : "Menu"}
        </button>
      </header>
      <div className="flex">
        <aside
          className={clsx(
            "fixed inset-y-0 left-0 z-30 w-60 shrink-0 flex-col border-r border-line bg-white pt-14 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:pt-0",
            open ? "flex" : "hidden",
          )}
        >
          <div className="hidden px-5 py-5 lg:block">
            <Link href={nav[0].href}>
              <Logo />
            </Link>
            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-mute">{label}</p>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  isActive(n.href) ? "bg-plum text-paper" : "text-ink/75 hover:bg-ivory",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line p-4 text-xs">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-mute">{user.email}</p>
            <div className="mt-3 flex gap-3">
              <Link href="/" className="text-wine underline">
                View site
              </Link>
              <button
                className="text-mute underline"
                onClick={async () => {
                  await signOut();
                  router.replace("/sign-in");
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="display text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
