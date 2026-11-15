import type { ReactNode } from "react";
import { Reveal } from "../motion/Reveal";

export function PageHeader({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="wash">
      <div className="mx-auto max-w-[1280px] px-5 pb-12 pt-32 md:px-8 md:pb-16 md:pt-40">
        <Reveal>
          <span className="pill border border-line bg-white text-brand">{eyebrow}</span>
          <h1 className="display mt-5 max-w-3xl text-[2.7rem] md:text-6xl">{title}</h1>
          {intro && <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">{intro}</p>}
        </Reveal>
        {children}
      </div>
    </header>
  );
}
