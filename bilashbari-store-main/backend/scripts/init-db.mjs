// Run with:  node scripts/init-db.mjs      (loads .env then backend/.env)
// Applies backend/schema.sql to the MySQL server you are pointing at.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const configured = () =>
  !!(process.env.DB_HOST || process.env.MYSQL_URL || process.env.DATABASE_URL);

// Backend/.env is the file the API itself reads, so inherit it and talk to
// exactly the same server (MYSQL_URL / DB_SSL included).
if (!configured() && fs.existsSync("backend/.env")) {
  for (const line of fs.readFileSync("backend/.env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

if (!configured()) {
  console.error(
    "No database configured. Set DB_HOST (plus DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)\n" +
      "or a single MYSQL_URL in .env or backend/.env - see backend/.env.example.",
  );
  process.exit(1);
}

// Reuse backend/db.js so MYSQL_URL, DB_SSL and the DB_* precedence rules behave
// identically here and in the deployed API. Imported after the env is loaded
// because db.js reads process.env while building its pool.
const { poolConfig } = await import("../db.js");
const config = poolConfig();

const host = config.host;
const database = config.database;
const useDatabase = ["1", "true"].includes(String(process.env.DB_CREATE_DATABASE || "1"));
const collation = process.env.DB_COLLATION || "utf8mb4_unicode_ci";

if (["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.warn(
    `! ${host} is a loopback address. That only works if MySQL runs on this machine -\n` +
      "  a Vercel function can never reach it. Point DB_HOST at a public host instead.\n",
  );
}

console.log(
  `Connecting to mysql://${config.user}@${host}:${config.port}${config.ssl ? " (TLS)" : ""}`,
);

// schema.sql pins utf8mb4_unicode_ci, which MySQL-compatible services (e.g. TiDB)
// may not implement. DB_COLLATION lets those servers still import the schema.
const sql = fs
  .readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "schema.sql"), "utf8")
  .replaceAll("utf8mb4_unicode_ci", collation);

// DATABASE()/CREATE DATABASE cannot be parameterised, so create it first with a
// connection that has no default database selected.
let conn;
try {
  conn = await mysql.createConnection({
    ...config,
    ...(useDatabase ? { database: undefined } : { database }),
    multipleStatements: true,
    connectTimeout: 10000,
  });
} catch (e) {
  console.error(`\nCould not connect to ${host}:${config.port} - ${e.code || e.message}`);
  if (e.code === "ECONNREFUSED") {
    console.error("Nothing is listening there. Start MySQL locally, or point DB_HOST at a reachable host.");
  } else if (e.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("Check DB_USER and DB_PASSWORD.");
  } else if (e.code === "ENOTFOUND") {
    console.error("The hostname does not resolve - check DB_HOST for typos.");
  } else if (/self[- ]signed|unable to verify|CERT_|certificate/i.test(String(e.message))) {
    console.error(
      "The TLS certificate was rejected. If the provider uses a private CA set DB_SSL_NO_VERIFY=true,\n" +
        "otherwise the server does not expect TLS - drop DB_SSL=true.",
    );
  }
  process.exit(1);
}

try {
  if (useDatabase) {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE ${collation}`,
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
  } else if (e.code === "ER_UNKNOWN_COLLATION" || /unknown collation/i.test(String(e.message))) {
    console.error(`This server does not support ${collation}. Retry with DB_COLLATION=utf8mb4_general_ci.`);
  }
  process.exitCode = 1;
} finally {
  await conn.end();
}