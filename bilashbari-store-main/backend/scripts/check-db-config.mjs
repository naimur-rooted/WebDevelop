// Check how the API will resolve its MySQL settings before/after deploying.
//   node scripts/check-db-config.mjs          # print resolved config
//   node scripts/check-db-config.mjs --probe  # also try to connect
//
// Loads .env then backend/.env (same order as scripts/init-db.mjs), then asks
// backend/db.js itself what it resolved, so the output always matches runtime.
import fs from "node:fs";

for (const line of [`${process.cwd()}/.env`, `${process.cwd()}/backend/.env`]) {
  if (!fs.existsSync(line)) continue;
  for (const raw of fs.readFileSync(line, "utf8").split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { poolConfig, dbStatus } = await import("../backend/db.js");
const cfg = poolConfig();
const mask = (v) => (v ? `${String(v).slice(0, 2)}***` : "(empty)");

console.log("Resolved MySQL pool config");
console.log(`  host      : ${cfg.host}`);
console.log(`  port      : ${cfg.port}`);
console.log(`  user      : ${cfg.user}`);
console.log(`  password  : ${mask(cfg.password)}`);
console.log(`  database  : ${cfg.database}`);
console.log(`  ssl       : ${cfg.ssl ? "on" : "off"}`);
console.log(`  connectionLimit: ${cfg.connectionLimit} (VERCEL=${process.env.VERCEL || "unset"})`);

const local = ["localhost", "127.0.0.1", "::1"].includes(String(cfg.host));
if (local) {
  console.log(
    "\n>> host is a loopback address. That only works when MySQL runs on the same machine.\n" +
      ">> A Vercel function cannot reach it - use a publicly reachable MySQL host there.",
  );
} else if (!cfg.ssl) {
  console.log("\n>> Tip: managed MySQL providers usually require TLS. Set DB_SSL=true if the connect fails.");
}

if (process.argv.includes("--probe")) {
  const db = await dbStatus();
  console.log(`\nProbe: ${db.ok ? "OK - connected" : `FAILED - ${db.error}`} (source: ${db.source})`);
  process.exitCode = db.ok ? 0 : 1;
}
process.exit(process.exitCode || 0);