"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, Phone, X } from "lucide-react";
import { NAV_MAIN } from "@/data/site";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";
import { telUrl, whatsappUrl, WA_MESSAGES } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icons";
import type { Settings } from "@/lib/types";

function Logo({ settings, light }: { settings: Settings; light: boolean }) {
  if (settings.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={settings.logoUrl} alt={settings.companyName} className="h-9 w-auto md:h-10" />;
  }
  const [first, ...rest] = settings.companyName.split(" ");
  return (
    <span className="flex items-center gap-2.5 leading-none">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brass to-brass-dark text-white shadow-soft">
        <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 34V17a11 11 0 0 1 22 0v17M5 34h30" />
        </svg>
      </span>
      <span className="flex flex-col">
        <span className={cn("text-[1.2rem] font-normal tracking-tight md:text-[1.3rem]", light ? "text-white" : "text-ink")}>
          {first}
          <span className="gold-italic"> {rest.join(" ")}</span>
        </span>
        <span className={cn("mt-0.5 hidden text-[0.52rem] font-medium tracking-[0.3em] uppercase sm:block lg:hidden xl:block", light ? "text-white/55" : "text-muted")}>
          Design · Manufacture · Install
        </span>
      </span>
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
  // Light (glass-on-dark) styling when the page opens with a dark hero.
  const [darkTop, setDarkTop] = useState(pathname === "/");
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const first = document.querySelector("main > section:first-child, main > div:first-child > section:first-child");
      setDarkTop(Boolean(first?.classList.contains("bg-espresso")));
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const light = (darkTop && !scrolled) || open;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const interiors = NAV_MAIN.find((i) => i.children)?.children ?? [];

  const linkCls = (href: string) =>
    cn(
      "relative whitespace-nowrap px-2.5 py-2 text-base font-normal transition-colors xl:px-4",
      light ? "text-white/80 hover:text-white" : "text-ink-soft hover:text-ink",
      isActive(href) && (light ? "text-white" : "text-ink"),
    );
  const activeDot = (href: string) =>
    isActive(href) && <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brass shadow-[0_0_10px_2px_rgb(184_134_79/0.8)]" aria-hidden />;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-4">
      <div
        className={cn(
          "mx-auto flex h-16 max-w-[84rem] items-center justify-between gap-3 rounded-full border pl-4 pr-2 transition-all duration-500 md:h-[4.25rem] md:pl-6",
          light
            ? "border-white/15 bg-white/[0.06] backdrop-blur-md"
            : "border-line/80 bg-paper/80 shadow-[0_10px_40px_-18px_rgb(29_31_33/0.35)] backdrop-blur-xl",
          scrolled && "md:h-[3.75rem]",
        )}
      >
        <Link href="/" aria-label={`${settings.companyName} home`} className="shrink-0">
          <Logo settings={settings} light={light} />
        </Link>

        <nav aria-label="Main" className="hidden items-center lg:flex">
          {NAV_MAIN.map((item) =>
            item.children ? (
              <div key={item.href} className="group relative">
                <Link href={item.href} className={cn(linkCls(item.href), "flex items-center gap-1")}>
                  {item.label}
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" aria-hidden />
                  {activeDot(item.href)}
                </Link>
                {/* Mega menu */}
                <div className="invisible absolute left-1/2 top-full w-[46rem] -translate-x-1/2 translate-y-2 pt-4 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="grid grid-cols-[1.5fr_1fr] overflow-hidden rounded-3xl border border-line bg-paper shadow-lift">
                    <div className="grid grid-cols-2 gap-1 p-4">
                      {item.children.map((c) => (
                        <Link key={c.href} href={c.href} className="group/item flex items-center justify-between rounded-2xl px-4 py-3 text-base text-ink-soft transition-colors hover:bg-white hover:text-ink">
                          {c.label}
                          <ArrowUpRight className="h-3.5 w-3.5 text-brass opacity-0 transition-opacity group-hover/item:opacity-100" aria-hidden />
                        </Link>
                      ))}
                    </div>
                    <div className="grain panels relative flex flex-col justify-end bg-espresso p-6 text-white">
                      <div aria-hidden className="walnut-grain absolute right-6 top-6 h-16 w-2 rounded-full" />
                      <p className="eyebrow text-brass">Our factory</p>
                      <p className="mt-3 text-2xl leading-tight font-light">See how your interiors are <span className="gold-italic">made</span></p>
                      <Link href="/factory" className="mt-5 inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-brass uppercase hover:text-white">
                        Visit our factory <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link key={item.href} href={item.href} className={linkCls(item.href)}>
                {item.label}
                {activeDot(item.href)}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5 md:gap-2">
          <a
            href={telUrl(settings.phone)}
            onClick={() => track("call_click", { label: "header" })}
            className={cn(
              "hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-base font-medium transition-colors min-[1360px]:flex",
              light ? "text-white hover:bg-white/10" : "text-ink hover:bg-white",
            )}
          >
            <span className={cn("grid h-8 w-8 place-items-center rounded-full", light ? "bg-white/10" : "bg-stone")}>
              <Phone className="h-3.5 w-3.5 text-brass" aria-hidden />
            </span>
            {settings.phone}
          </a>
          <a
            href={whatsappUrl(settings.whatsappNumber, settings.whatsappDefaultMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { label: "header" })}
            aria-label="Chat on WhatsApp"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wa text-white transition-transform hover:scale-105"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
          <Link
            href="/get-quote"
            className={cn(
              "hidden h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full pl-5 pr-2 text-base font-medium transition-colors md:flex",
              light ? "bg-white text-ink hover:bg-brass hover:text-white" : "bg-ink text-white hover:bg-brass-dark",
            )}
          >
            <span className="xl:hidden">Free Quote</span>
            <span className="hidden xl:inline">Get Free Quote</span>
            <span className={cn("grid h-7 w-7 place-items-center rounded-full", light ? "bg-ink text-white" : "bg-brass text-white")}>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn("grid h-11 w-11 place-items-center rounded-full lg:hidden", light ? "bg-white/10 text-white" : "bg-ink text-white")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="grain panels fixed inset-0 -z-10 overflow-y-auto bg-espresso px-5 pb-32 pt-24 text-white lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-lg flex-col">
            {NAV_MAIN.map((item, i) =>
              item.children ? (
                <div key={item.href} className="border-b border-white/10">
                  <button type="button" onClick={() => setInteriorsOpen((v) => !v)} aria-expanded={interiorsOpen} className="flex w-full items-center justify-between py-4 text-left text-3xl font-light">
                    <span><span className="mr-4 align-middle text-xs text-brass">0{i + 1}</span>{item.label}</span>
                    <ChevronDown className={cn("h-5 w-5 transition-transform", interiorsOpen && "rotate-180")} />
                  </button>
                  {interiorsOpen && (
                    <div className="grid grid-cols-2 gap-1 pb-4">
                      {interiors.map((c) => (
                        <Link key={c.href} href={c.href} className="rounded-xl px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">{c.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={item.href} href={item.href} className={cn("border-b border-white/10 py-4 text-3xl font-light", isActive(item.href) && "gold-italic")}>
                  <span className="mr-4 align-middle font-sans text-xs not-italic text-brass">0{i + 1}</span>{item.label}
                </Link>
              ),
            )}
            <div className="mt-8 grid gap-3">
              <Link href="/get-quote" className="btn btn-lg btn-light">Get Free Quote</Link>
              <a href={whatsappUrl(settings.whatsappNumber, WA_MESSAGES.default)} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { label: "mobile_menu" })} className="btn btn-lg btn-wa">
                <WhatsAppIcon /> WhatsApp Us
              </a>
              <a href={telUrl(settings.phone)} onClick={() => track("call_click", { label: "mobile_menu" })} className="btn btn-lg btn-ghost-light">
                <Phone className="h-4 w-4" /> {settings.phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
