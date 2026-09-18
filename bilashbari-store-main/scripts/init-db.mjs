// Run with:  node scripts/init-db.mjs      (loads .env then backend/.env)
// Applies backend/schema.sql to the MySQL server you are pointing at.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

if (!process.env.DB_HOST && fs.existsSync("backend/.env")) {
  for (const line of fs.readFileSync("backend/.env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const host = process.env.DB_HOST;
if (!host) {
  console.error("DB_HOST is not set. Copy backend/.env.example to backend/.env first.");
  process.exit(1);
}

const database = process.env.DB_NAME || "bilashbari";
const sql = fs.readFileSync(path.join("backend", "schema.sql"), "utf8");
const useDatabase = ["1", "true"].includes(String(process.env.DB_CREATE_DATABASE || "1"));

console.log(`Connecting to mysql://${process.env.DB_USER || "root"}@${host}:${process.env.DB_PORT || 3306}`);

// DATABASE()/CREATE DATABASE cannot be parameterised, so create it first with a
// connection that has no default database selected.
let conn;
try {
  conn = await mysql.createConnection({
    host,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    ...(useDatabase ? {} : { database }),
    multipleStatements: true,
    connectTimeout: 10000,
  });
} catch (e) {
  console.error(`\nCould not connect to ${host}:${Number(process.env.DB_PORT) || 3306} - ${e.code || e.message}`);
  if (e.code === "ECONNREFUSED") {
    console.error("Nothing is listening there. Start MySQL locally, or point DB_HOST at a reachable host.");
  } else if (e.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("Check DB_USER and DB_PASSWORD.");
  } else if (e.code === "ENOTFOUND") {
    console.error("The hostname does not resolve - check DB_HOST for typos.");
  }
  process.exit(1);
}

try {
  if (useDatabase) {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await conn.query(`USE \`${database}\``);
  }

  // schema.sql contains CREATE DATABASE/USE statements; they are harmless here.
  await conn.query(sql);

  const [tables] = await conn.query("SHOW TABLES");
  console.log(`\nDone. Tables in \`${database}\`:`);
  for (const row of tables) console.log("  -", Object.values(row)[0]);

  const [admins] = await conn.query("SELECT COUNT(*) c FROM users WHERE role='admin'");
  if (!admins[0].c) {
    console.log("\nNo admin user yet. Promote one after signing up:");
    console.log(`  UPDATE users SET role='admin' WHERE email='you@example.com';`);
  }
} catch (e) {
  console.error(`\nSchema import failed: ${e.code || e.message}`);
  if (e.code === "ER_DBACCESS_DENIED_ERROR" || e.code === "ER_TABLEACCESS_DENIED_ERROR") {
    console.error("This MySQL user cannot create databases. Set DB_CREATE_DATABASE=0 and create it in the provider console first.");
  }
  process.exitCode = 1;
} finally {
  await conn.end();
}