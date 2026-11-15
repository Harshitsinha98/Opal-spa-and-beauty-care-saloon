import type { ReactNode } from "react";
import { MaskLines, Reveal } from "../motion/Reveal";

export function PageHeader({ eyebrow, lines, intro }: { eyebrow: string; lines: ReactNode[]; intro?: ReactNode }) {
  return (
    <header className="mx-auto max-w-[1440px] px-5 pb-14 pt-36 md:px-10 md:pb-20 md:pt-44">
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <MaskLines as="h1" immediate delay={0.1} className="display mt-5 text-[3.4rem] md:text-[6.5rem]" lines={lines} />
      {intro && (
        <Reveal delay={0.3} className="mt-8 max-w-xl text-[0.98rem] leading-relaxed text-ink/75">
          {intro}
        </Reveal>
      )}
    </header>
  );
}
