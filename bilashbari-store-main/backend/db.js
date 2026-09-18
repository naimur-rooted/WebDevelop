import mysql from "mysql2/promise";
import "dotenv/config";

const globalForDb = globalThis;
const isServerless = !!process.env.VERCEL;

function poolConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bilashbari",
    waitForConnections: true,
    connectionLimit: isServerless ? 3 : 10,
    // Fail fast. Without this an unreachable DB host keeps the request open
    // until Vercel's function timeout and the client only sees a 504.
    connectTimeout: 5000,
    enableKeepAlive: true,
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
  if (!process.env.DB_HOST) {
    return { ok: false, error: "DB_HOST is not set" };
  }
  try {
    const conn = await pool.getConnection();
    try {
      await conn.ping();
    } finally {
      conn.release();
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.code || e?.message || "unknown error" };
  }
}

