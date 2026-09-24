import { Suspense } from "react";
import { requireSession } from "@/lib/server/auth";
import { isDemoMode } from "@/lib/server/backend";
import { AdminNav } from "@/components/admin/AdminNav";

async function Frame({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[15rem_1fr]">
      <AdminNav user={session.sub} role={session.role} demo={isDemoMode()} />
      <div className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10 text-muted">Loading…</div>}>
      <Frame>{children}</Frame>
    </Suspense>
  );
}
