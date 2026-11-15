import type { ReactNode } from "react";
import { Reveal } from "../motion/Reveal";

export function SectionHead({ eyebrow, title, sub, action }: { eyebrow: string; title: ReactNode; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display mt-3 max-w-2xl text-4xl md:text-5xl">{title}</h2>
        {sub && <p className="mt-3 max-w-xl text-mute">{sub}</p>}
      </Reveal>
      {action && <Reveal delay={0.1}>{action}</Reveal>}
    </div>
  );
}
