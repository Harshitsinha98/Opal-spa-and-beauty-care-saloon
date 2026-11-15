"use client";

import { useEffect, useRef, useState } from "react";

/** Google Maps embed that only loads once it's close to the viewport. */
export function LazyMap({ address }: { address: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const src = `https://www.google.com/maps?q=${encodeURIComponent(`Opal Spa & Beauty Care Salon, ${address}`)}&output=embed`;

  return (
    <div ref={ref} className="relative h-full min-h-[22rem] w-full overflow-hidden bg-sand">
      {load ? (
        <iframe
          title="Map to Opal Spa, Arera Colony"
          src={src}
          className="absolute inset-0 h-full w-full border-0 [filter:saturate(0.7)_contrast(1.02)]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-mute">Loading map…</div>
      )}
    </div>
  );
}
