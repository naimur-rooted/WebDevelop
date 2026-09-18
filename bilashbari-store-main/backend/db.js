import mysql from "mysql2/promise";
import "dotenv/config";

const globalForDb = globalThis;
const isServerless = !!process.env.VERCEL;

// Hosted MySQL providers hand out a single connection string. Accepting it means
// only one variable has to be pasted into the Vercel dashboard.
const connectionUrl =
  process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL || "";

function configFromUrl(raw) {
  try {
    const url = new URL(raw);
    if (!/^mysqls?:$/.test(url.protocol)) {
      throw new Error(`unsupported protocol "${url.protocol}" (expected mysql://)`);
    }
    const sslMode = (url.searchParams.get("ssl-mode") || url.searchParams.get("sslmode") || "")
      .toLowerCase();
    return {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username) || "root",
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, "")) || "bilashbari",
      wantsSsl: sslMode.includes("required") || sslMode.includes("require"),
    };
  } catch (e) {
    console.error(`[db] could not parse MYSQL_URL/DATABASE_URL: ${e.message}`);
    return null;
  }
}

// DB_SSL=true (or ?ssl-mode=REQUIRED on the URL) enables TLS. Managed providers
// commonly use a certificate chain Node does not trust by default.
function sslOption(urlWantsSsl) {
  const flag = String(process.env.DB_SSL || "").toLowerCase();
  const enabled = urlWantsSsl || ["1", "true", "yes", "require", "required"].includes(flag);
  if (!enabled) return undefined;
  return { rejectUnauthorized: String(process.env.DB_SSL_NO_VERIFY || "") === "true" ? false : true };
}

/**
 * Resolved mysql2 pool options. DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME win
 * over a MYSQL_URL/DATABASE_URL when both are present, so a single wrong value
 * can be corrected without rewriting the connection string.
 */
export function poolConfig() {
  const fromUrl = connectionUrl ? configFromUrl(connectionUrl) : null;
  const explicit = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  const ssl = sslOption(fromUrl?.wantsSsl);

  return {
    host: explicit.host || fromUrl?.host || "localhost",
    port: explicit.port || fromUrl?.port || 3306,
    user: explicit.user || fromUrl?.user || "root",
    password: explicit.password ?? fromUrl?.password ?? "",
    database: explicit.database || fromUrl?.database || "bilashbari",
    waitForConnections: true,
    connectionLimit: isServerless ? 3 : 10,
    // Fail fast. Without this an unreachable DB host keeps the request open
    // until Vercel's function timeout and the client only sees a 504.
    connectTimeout: 5000,
    enableKeepAlive: true,
    ...(ssl ? { ssl } : {}),
  };
}

function getPool() {
  if (!globalForDb.__bilashbariPool) {
    globalForDb.__bilashbariPool = mysql.createPool(poolConfig());
  }
  return globalForDb.__bilashbariPool;
}

export const pool = getPool();

/**
 * Cheap connectivity probe used by GET /api/health so a deployment can be
 * diagnosed from the browser without leaking credentials.
 */
export async function dbStatus() {
  const source = connectionUrl ? "MYSQL_URL/DATABASE_URL" : process.env.DB_HOST ? "DB_HOST" : "none";
  if (source === "none") {
    return {
      ok: false,
      source,
      error:
        "No database configured. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME " +
        "(or a single MYSQL_URL) in the deployment environment variables.",
    };
  }
  try {
    const conn = await pool.getConnection();
    try {
      await conn.ping();
    } finally {
      conn.release();
    }
    return { ok: true, source };
  } catch (e) {
    return { ok: false, source, error: e?.code || e?.message || "unknown error" };
  }
}

