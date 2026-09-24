"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

export function RefreshButton() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function refresh() {
    setState("busy");
    const res = await fetch("/api/revalidate", { method: "POST" }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  }
  return (
    <button onClick={refresh} disabled={state === "busy"} className="btn btn-primary btn-sm">
      {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {state === "done" ? "Refreshed ✓" : state === "error" ? "Failed — retry" : "Refresh website content"}
    </button>
  );
}
