/** Circular rotating text seal — a signature luxury-studio detail. */
export function RotatingBadge({ text = "DESIGN · MANUFACTURE · INSTALL · ", className = "" }: { text?: string; className?: string }) {
  return (
    <div className={`grid h-28 w-28 place-items-center rounded-full bg-ink text-brass shadow-lift md:h-36 md:w-36 ${className || "relative"}`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spin-slow" aria-hidden>
        <defs>
          <path id="badge-circle" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
        </defs>
        <text fill="currentColor" fontSize="15.5" letterSpacing="5" style={{ fontFamily: "var(--font-sans)" }}>
          <textPath href="#badge-circle">{text}{text}</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 40 40" className="h-9 w-9 md:h-11 md:w-11" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <path d="M8 36V18a12 12 0 0 1 24 0v18M4 36h32" />
        <path d="M14 36V20a6 6 0 0 1 12 0v16" />
      </svg>
      <span className="sr-only">Design, manufacture and install</span>
    </div>
  );
}
