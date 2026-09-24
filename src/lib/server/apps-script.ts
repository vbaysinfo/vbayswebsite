import "server-only";

// Thin server-side client for the Google Apps Script Web App.
// The URL and shared secret live only in server environment variables and
// are never sent to the browser. Every call is a POST with a JSON body so the
// secret never appears in URLs or logs.

export class BackendError extends Error {
  constructor(message: string, public readonly code: string = "BACKEND_ERROR") {
    super(message);
  }
}

export const isBackendConfigured = () => Boolean(process.env.APPS_SCRIPT_URL && process.env.APPS_SCRIPT_SECRET);

export async function callAppsScript<T = unknown>(
  route: string,
  data: Record<string, unknown> = {},
  { timeoutMs = 20000 }: { timeoutMs?: number } = {},
): Promise<T> {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) throw new BackendError("Apps Script is not configured", "NOT_CONFIGURED");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      // Apps Script only reads text bodies reliably; it parses JSON itself.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ route, secret, data }),
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new BackendError(`Apps Script HTTP ${res.status}`, "HTTP_ERROR");
    const text = await res.text();
    let json: { ok: boolean; data?: T; error?: string; code?: string };
    try {
      json = JSON.parse(text);
    } catch {
      throw new BackendError("Apps Script returned a non-JSON response", "BAD_RESPONSE");
    }
    if (!json.ok) throw new BackendError(json.error || "Apps Script error", json.code || "SCRIPT_ERROR");
    return json.data as T;
  } catch (err) {
    if (err instanceof BackendError) throw err;
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new BackendError(aborted ? "Apps Script timed out" : "Apps Script unreachable", aborted ? "TIMEOUT" : "NETWORK");
  } finally {
    clearTimeout(timer);
  }
}
