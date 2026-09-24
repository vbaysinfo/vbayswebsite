"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X, Phone } from "lucide-react";
import { NAV_MAIN } from "@/data/site";
import { cn } from "@/lib/cn";
import { WhatsAppButton, CallButton } from "@/components/cta/TrackedLinks";
import type { Settings } from "@/lib/types";

function Logo({ settings, light }: { settings: Settings; light: boolean }) {
  if (settings.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={settings.logoUrl} alt={settings.companyName} className="h-9 w-auto md:h-10" />;
  }
  const [first, ...rest] = settings.companyName.split(" ");
  return (
    <span className={cn("font-display text-[1.35rem] leading-none tracking-tight md:text-2xl", light ? "text-white" : "text-ink")}>
      {first}
      <span className={light ? "text-brass-soft" : "text-brass"}> {rest.join(" ")}</span>
    </span>
  );
}

export function HeaderClient({ settings }: { settings: Settings }) {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [interiorsOpen, setInteriorsOpen] = useState(false);
  // Close menus on navigation (state adjustment during render, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setInteriorsOpen(false);
  }
  const transparent = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        transparent ? "bg-gradient-to-b from-black/45 to-transparent" : "border-b border-line bg-paper/95 backdrop-blur",
      )}
    >
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-4 md:h-20">
        <Link href="/" aria-label={`${settings.companyName} home`} className="shrink-0">
          <Logo settings={settings} light={transparent} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_MAIN.map((item) =>
            item.children ? (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.92rem] font-semibold transition-colors",
                    transparent ? "text-white/90 hover:text-white" : "text-ink-soft hover:text-ink",
                    isActive(item.href) && (transparent ? "text-white" : "text-brass-dark"),
                  )}
                >
                  {item.label}
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" aria-hidden />
                </Link>
                <div className="invisible absolute left-1/2 top-full w-[34rem] -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="card grid grid-cols-2 gap-1 p-3">
                    {item.children.map((c) => (
                      <Link key={c.href} href={c.href} className="rounded-xl px-4 py-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-stone hover:text-ink">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[0.92rem] font-semibold transition-colors",
                  transparent ? "text-white/90 hover:text-white" : "text-ink-soft hover:text-ink",
                  isActive(item.href) && (transparent ? "text-white" : "text-brass-dark"),
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <WhatsAppButton
            number={settings.whatsappNumber}
            message={settings.whatsappDefaultMessage}
            label="WhatsApp"
            size="sm"
            className="hidden sm:inline-flex"
          />
          <Link href="/get-quote" className={cn("btn btn-sm hidden md:inline-flex", transparent ? "bg-white text-ink hover:bg-brass-soft" : "btn-primary")}>
            {settings.primaryCta}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn("grid h-11 w-11 place-items-center rounded-full lg:hidden", transparent ? "text-white" : "text-ink")}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-paper pb-28 lg:hidden">
          <nav aria-label="Mobile" className="container-x flex flex-col py-4">
            {NAV_MAIN.map((item) =>
              item.children ? (
                <div key={item.href} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setInteriorsOpen((v) => !v)}
                    aria-expanded={interiorsOpen}
                    className="flex w-full items-center justify-between py-4 text-left text-lg font-semibold"
                  >
                    {item.label}
                    <ChevronDown className={cn("h-5 w-5 transition-transform", interiorsOpen && "rotate-180")} />
                  </button>
                  {interiorsOpen && (
                    <div className="grid grid-cols-1 gap-1 pb-3">
                      {item.children.map((c) => (
                        <Link key={c.href} href={c.href} className="rounded-lg px-3 py-2.5 text-[0.95rem] text-ink-soft hover:bg-stone">
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={item.href} href={item.href} className={cn("border-b border-line py-4 text-lg font-semibold", isActive(item.href) && "text-brass-dark")}>
                  {item.label}
                </Link>
              ),
            )}
            <div className="mt-6 grid gap-3">
              <Link href="/get-quote" className="btn btn-primary btn-lg">{settings.primaryCta}</Link>
              <WhatsAppButton number={settings.whatsappNumber} message={settings.whatsappDefaultMessage} label={settings.secondaryCta} size="lg" />
              <CallButton phone={settings.phone} label={`Call ${settings.phone}`} size="lg">
                <span className="btn btn-outline btn-lg w-full"><Phone className="h-4 w-4" /> Call {settings.phone}</span>
              </CallButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
