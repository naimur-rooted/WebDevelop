function resolveApiBase(): string {
  const fromEnv = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.replace(/\/$/, "");

  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "";

  // Dev without a build step: the Express backend runs on :5000 (npm run dev
  // inside backend/). On the deployed static site the API lives on Render,
  // so VITE_API_URL MUST be set at build time (Render -> Environment).
  if (isLocal) return "http://localhost:5000/api";

  console.error(
    "VITE_API_URL is not set. The static site does not know where the API is. " +
      "Set it to your backend URL (e.g. https://bilashbari-api.onrender.com/api) " +
      "in the hosting provider's environment variables and rebuild.",
  );
  return "/api";
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
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // A non-JSON body means the request never reached the Express app
    // (misrouted rewrite / platform error page). Surface something actionable
    // instead of a bare "Unexpected token <" parser error.
    if (!res.ok) {
      throw new Error(
        `API returned a non-JSON response (HTTP ${res.status}). ` +
          `Check that the /api function is deployed and reachable at ${API}.`,
      );
    }
  }

  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data as T;
}

export const API_URL = API;
