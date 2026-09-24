"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Megaphone, Settings2, Share2, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, admin: false },
  { href: "/admin/leads", label: "Leads", icon: Users, admin: false },
  { href: "/admin/social", label: "Social Media", icon: Share2, admin: true },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone, admin: true },
  { href: "/admin/content", label: "Website Content", icon: Settings2, admin: true },
];

export function AdminNav({ user, role, demo }: { user: string; role: "admin" | "staff"; demo: boolean }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => role === "admin" || !i.admin);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  return (
    <aside className="sticky top-0 z-30 border-b border-line bg-ink text-white lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-5 lg:py-6">
        <Link href="/admin" className="font-display text-xl">Admin</Link>
        <p className="hidden text-xs text-white/60 lg:mt-1 lg:block">{user} · {role}</p>
        {demo && <p className="rounded-full bg-amber-400/20 px-2.5 py-1 text-[0.7rem] font-bold text-amber-200 lg:mt-3 lg:inline-block">DEMO MODE — data not saved to Sheets</p>}
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={cn("flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold", active(i.href) ? "bg-white text-ink" : "text-white/75 hover:bg-white/10 hover:text-white")}>
            <i.icon className="h-4 w-4" />{i.label}
          </Link>
        ))}
        <a href="/" target="_blank" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/10 lg:mt-6"><ExternalLink className="h-4 w-4" />View website</a>
        <button onClick={logout} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/75 hover:bg-white/10"><LogOut className="h-4 w-4" />Sign out</button>
      </nav>
    </aside>
  );
}
