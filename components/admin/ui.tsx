"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import clsx from "clsx";

type R = { ok: true } | { ok: false; error: string };

export function Btn({
  children,
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "soft" }) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-plum text-paper hover:bg-wine",
        variant === "ghost" && "border border-line bg-white hover:border-ink/40",
        variant === "danger" && "bg-bad text-paper hover:bg-bad/90",
        variant === "soft" && "bg-ivory text-ink hover:bg-sand",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Runs a server action, shows pending state and errors, then refreshes server data. */
export function ActionBtn({
  action,
  children,
  confirm,
  variant,
  className,
  onDone,
}: {
  action: () => Promise<R>;
  children: ReactNode;
  confirm?: string;
  variant?: "primary" | "ghost" | "danger" | "soft";
  className?: string;
  onDone?: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <span className="inline-flex flex-col">
      <Btn
        variant={variant}
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          start(async () => {
            const r = await action();
            if (!r.ok) return setError(r.error);
            onDone?.();
            router.refresh();
          });
        }}
      >
        {pending ? "…" : children}
      </Btn>
      {error && <span className="mt-1 text-xs text-bad">{error}</span>}
    </span>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 md:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="display text-2xl">{title}</h2>
          <button onClick={onClose} className="text-sm text-mute hover:text-ink">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx("block text-sm", className)}>
      <span className="mb-1 block font-medium text-ink/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-lg border border-line bg-white", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          {title && <h2 className="text-sm font-semibold tracking-wide">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function useFormAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const run = (fn: () => Promise<R>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error);
      onOk?.();
      router.refresh();
    });
  };
  return { pending, error, run, setError };
}
