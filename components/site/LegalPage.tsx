import type { ReactNode } from "react";
import { Reveal } from "../motion/Reveal";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-5 pb-32 pt-36 md:pt-44">
      <Reveal>
        <p className="eyebrow">Last updated {updated}</p>
        <h1 className="display mt-4 text-5xl md:text-7xl">{title}</h1>
      </Reveal>
      <div className="prose-legal mt-12">{children}</div>
    </article>
  );
}

export const LEGAL_UPDATED = "14 November 2026";
