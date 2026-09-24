/** Endless horizontal ticker of services (pure CSS). */
export function Marquee({ items }: { items: string[] }) {
  const row = items.map((t) => (
    <span key={t} className="flex shrink-0 items-center gap-10 pr-10">
      <span className="font-display text-3xl italic text-ink md:text-5xl">{t}</span>
      <span className="text-brass" aria-hidden>✦</span>
    </span>
  ));
  return (
    <div className="overflow-hidden border-y border-line bg-paper py-6 md:py-8" aria-label={items.join(", ")}>
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]" aria-hidden>
        {row}
        {row}
      </div>
    </div>
  );
}
