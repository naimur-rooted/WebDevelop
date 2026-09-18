function resolveApiBase(): string {
  const fromEnv = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.replace(/\/$/, "");
  // In production (Vercel) the Express app lives on the same deployment at /api.
  // Defaulting to "/api" instead of localhost fixes "Failed to fetch" after deploy
  // even if VITE_API_URL was not baked in at build time.
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return "/api";
  }
  return "http://localhost:5000/api";
}

const API = resolveApiBase();

function token() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("bb_token");
}

export async function api<T = any>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data as T;
}

export const API_URL = API;
