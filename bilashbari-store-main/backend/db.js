import fs from "node:fs";
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
      .toLowerCase()
      .replace(/_/g, "-");
    return {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username) || "root",
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, "")) || "bilashbari",
      // MySQL client semantics: REQUIRED/PREFERRED encrypt without validating the
      // certificate, VERIFY_CA and VERIFY_IDENTITY validate it.
      wantsSsl: sslMode !== "" && sslMode !== "disabled",
      verify: sslMode.startsWith("verify"),
    };
  } catch (e) {
    console.error(`[db] could not parse MYSQL_URL/DATABASE_URL: ${e.message}`);
    return null;
  }
}

/**
 * DB_SSL_CA may be a path to a .pem file or the PEM text itself. Dashboards often
 * store pasted newlines as a literal "\n", so normalise that.
 */
function loadCa() {
  const raw = process.env.DB_SSL_CA;
  if (!raw) return undefined;
  if (raw.includes("-----BEGIN")) return raw.replace(/\\n/g, "\n");
  try {
    return fs.readFileSync(raw, "utf8");
  } catch (e) {
    console.error(`[db] DB_SSL_CA points at "${raw}" but it could not be read: ${e.message}`);
    return undefined;
  }
}

/**
 * TLS is enabled by DB_SSL=true or by any ssl-mode in a connection URL.
 *
 * Managed providers (Aiven, TiDB, ...) commonly present a chain ending in a CA
 * that Node does not ship with, which fails as
 *   HANDSHAKE_SSL_ERROR: self-signed certificate in certificate chain
 * Two ways out: paste the provider's CA into DB_SSL_CA (keeps verification on),
 * or set DB_SSL_NO_VERIFY=true to skip verification for that one connection.
 *
 * Precedence: an explicit CA is always validated, then DB_SSL_NO_VERIFY, then the
 * URL's ssl-mode, and finally plain DB_SSL=true which means "verify".
 */
function sslOption(fromUrl) {
  const flag = String(process.env.DB_SSL || "").toLowerCase();
  const enabled = !!fromUrl?.wantsSsl || ["1", "true", "yes", "require", "required"].includes(flag);
  const ca = loadCa();
  if (!enabled && !ca) return undefined;

  const noVerify = ["1", "true", "yes"].includes(
    String(process.env.DB_SSL_NO_VERIFY || "").toLowerCase(),
  );
  const rejectUnauthorized = ca ? true : noVerify ? false : (fromUrl?.verify ?? true);
  return { rejectUnauthorized, ...(ca ? { ca } : {}) };
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

  const ssl = sslOption(fromUrl);

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

