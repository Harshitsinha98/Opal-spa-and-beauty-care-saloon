/** Marigold band listing the treatments, scrolling slowly. */
export function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden bg-accent py-4" aria-hidden>
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="display text-2xl text-ink md:text-3xl">{t}</span>
            <span className="h-2.5 w-2.5 rotate-45 bg-brand" />
          </span>
        ))}
      </div>
    </div>
  );
}
