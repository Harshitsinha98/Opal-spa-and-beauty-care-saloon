export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-line py-6" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="display text-4xl italic text-plum/85 md:text-5xl">{t}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose" />
          </span>
        ))}
      </div>
    </div>
  );
}
