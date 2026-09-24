// Single-series horizontal bar chart (magnitude comparison across categories).
// One hue, value labels at the bar end, hover tooltip via <title>, and the
// numbers are always visible as text — no colour-only encoding.
export function BarChart({ title, data, emptyText = "No data yet" }: { title: string; data: [string, number][]; emptyText?: string }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <figure className="card p-5">
      <figcaption className="text-sm font-bold text-ink">{title}</figcaption>
      {data.length === 0 || data.every((d) => d[1] === 0) ? (
        <p className="py-8 text-center text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {data.slice(0, 8).map(([label, value]) => (
            <li key={label} className="group grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm" title={`${label}: ${value}`}>
              <span className="truncate text-ink-soft">{label}</span>
              <span className="flex items-center gap-2">
                <span className="h-4 rounded-r-[4px] bg-brass transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
                <span className="tabular-nums font-semibold text-ink">{value}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

/** Vertical columns for a time series (leads per month). */
export function ColumnChart({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <figure className="card p-5">
      <figcaption className="text-sm font-bold text-ink">{title}</figcaption>
      <div className="mt-4 flex h-44 items-end gap-3 border-b border-line">
        {data.map(([label, value]) => (
          <div key={label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${label}: ${value}`}>
            <span className="text-xs font-semibold tabular-nums text-ink">{value}</span>
            <span className="w-full max-w-10 rounded-t-[4px] bg-brass transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(2, (value / max) * 85)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {data.map(([label]) => <span key={label} className="flex-1 text-center text-xs text-muted">{label}</span>)}
      </div>
    </figure>
  );
}
