// Diagnose a running API (local or deployed).
//   node scripts/check-api.mjs
//   node scripts/check-api.mjs https://your-app.vercel.app
//   node scripts/check-api.mjs https://your-app.vercel.app ""        # skip register
//
// Prints status + body for every step so a 404 / 500 / 503 is obvious.
const target = (process.argv[2] || "http://localhost:5000").replace(/\/$/, "");
const base = target.endsWith("/api") ? target : `${target}/api`;
const email = process.argv[3] === "" ? "" : process.argv[3] || `probe+${Date.now()}@example.com`;

console.log(`Probing ${base}\n`);

async function step(label, path, init) {
  const started = Date.now();
  try {
    const res = await fetch(`${base}${path}`, init);
    const text = (await res.text()).slice(0, 400);
    const bad = !res.ok;
    console.log(`${bad ? "FAIL" : " OK "} ${label}  ${res.status}  ${Date.now() - started}ms`);
    console.log(`     ${text || "<empty body>"}`);
    return { ok: res.ok, status: res.status, body: text };
  } catch (e) {
    console.log(`FAIL ${label}  network error: ${e.message}`);
    console.log(`     The /api function is not reachable at ${base} (check rewrites / Root Directory).`);
    return { ok: false, status: 0, body: e.message };
  }
  finally {
    console.log("");
  }
}

const health = await step("GET  /api/health", "/health");
if (health.ok && health.body.includes('"ok":false')) {
  console.log(">> Health check reached the server but the database refused the connection.");
  console.log(">> Set DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME in Vercel env vars, then redeploy.");
  console.log(">> DB_HOST must be a public MySQL host - Vercel cannot reach localhost:3306.\n");
}

await step("GET  /api/products", "/products");
await step("GET  /api/categories", "/categories");

if (email) {
  await step("POST /api/auth/register", "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "API probe", email, password: "probe-password-123" }),
  });
  console.log(`>> Probe account created with ${email} - delete it from the users table afterwards.`);
}