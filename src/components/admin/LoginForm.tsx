"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && json.ok) {
      window.location.href = "/admin";
      return;
    }
    setError(json.error || "Sign in failed. Please try again.");
    setLoading(false);
  }
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="u">Username</label>
        <input id="u" name="username" className="field" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="p">Password</label>
        <input id="p" name="password" type="password" className="field" autoComplete="current-password" required />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="btn btn-primary w-full">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}</button>
    </form>
  );
}
