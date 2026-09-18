import mysql from "mysql2/promise";
import "dotenv/config";

const globalForDb = globalThis;

function getPool() {
  if (!globalForDb.__bilashbariPool) {
    globalForDb.__bilashbariPool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "bilashbari",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return globalForDb.__bilashbariPool;
}

export const pool = getPool();

