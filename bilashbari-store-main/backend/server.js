import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { pool, dbStatus } from "./db.js";
import { auth, adminOnly } from "./middleware/auth.js";

const app = express();

// Express 4 does not forward rejected promises from async route handlers to the
// error middleware, so a failing query kept the request open until Vercel's
// function timeout killed it (the browser only saw a 504). Wrap every handler so
// rejections reach the error middleware at the bottom of this file. Registered
// before any route so nothing is missed.
const asyncSafe = (handler) =>
  typeof handler !== "function" || handler.length >= 4
    ? handler
    : (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

for (const method of ["get", "post", "put", "patch", "delete", "all"]) {
  const original = app[method].bind(app);
  app[method] = (path, ...handlers) => original(path, ...handlers.map(asyncSafe));
}

/**
 * CORS_ORIGIN accepts one or more origins, comma separated. A literal "*" as the
 * whole value allows every origin (handy for quick tests). Individual entries may
 * use "*" as a wildcard so Vercel preview deployments keep working after the
 * backend is hosted on another platform (e.g. https://*.vercel.app).
 * Exported so the allowed-origin rules can be tested without a live server.
 */
export function corsOrigin() {
  const raw = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (raw.length === 0 || raw.includes("*")) return "*";
  return raw.map((value) =>
    value.includes("*")
      ? new RegExp(`^${value.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`)
      : value,
  );
}

// Middleware must be registered before any route, otherwise the route answers
// without CORS headers and a browser fetch from another origin fails — which is
// exactly the case when the frontend stays on Vercel and the API runs elsewhere.
app.use(cors({ origin: corsOrigin() }));
app.use(express.json());

app.get("/api/health", async (_req, res) =>
  res.json({ ok: true, db: await dbStatus(), vercel: !!process.env.VERCEL, render: !!process.env.RENDER }),
);

const sign = (u) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign(
    { id: u.id, role: u.role, name: u.name, email: u.email },
    secret,
    { expiresIn: "7d" },
  );
};

// ---------- Auth ----------
app.post("/api/auth/register", async (req, res, next) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      "INSERT INTO users (name,email,password,role) VALUES (?,?,?,'user')",
      [name, email, hash],
    );
    const user = { id: r.insertId, name, email, role: "user" };
    res.json({ token: sign(user), user });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email already used" });
    // Let the error middleware translate DB/JWT failures into a clear response.
    next(e);
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password)))
    return res.status(401).json({ error: "Invalid credentials" });
  const user = { id: u.id, name: u.name, email: u.email, role: u.role };
  res.json({ token: sign(user), user });
});

app.get("/api/auth/me", auth(), async (req, res) => res.json(req.user));

// ---------- Categories ----------
app.get("/api/categories", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM categories ORDER BY name");
  res.json(rows);
});
app.post("/api/categories", auth(), adminOnly, async (req, res) => {
  const { name, slug } = req.body;
  const [r] = await pool.query("INSERT INTO categories (name,slug) VALUES (?,?)", [name, slug]);
  res.json({ id: r.insertId, name, slug });
});
app.put("/api/categories/:id", auth(), adminOnly, async (req, res) => {
  const { name, slug } = req.body;
  await pool.query("UPDATE categories SET name=?, slug=? WHERE id=?", [name, slug, req.params.id]);
  res.json({ ok: true });
});
app.delete("/api/categories/:id", auth(), adminOnly, async (req, res) => {
  await pool.query("DELETE FROM categories WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});

// ---------- Products ----------
app.get("/api/products", async (req, res) => {
  const { category } = req.query;
  const params = [];
  let sql =
    "SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id";
  if (category) {
    sql += " WHERE c.slug=?";
    params.push(category);
  }
  sql += " ORDER BY p.created_at DESC";
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});
app.get("/api/products/:id", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=?",
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});
app.post("/api/products", auth(), adminOnly, async (req, res) => {
  const { name, description, category_id, price, discount = 0, image_url, stock = 100 } = req.body;
  const [r] = await pool.query(
    "INSERT INTO products (name,description,category_id,price,discount,image_url,stock) VALUES (?,?,?,?,?,?,?)",
    [name, description, category_id, price, discount, image_url, stock],
  );
  res.json({ id: r.insertId });
});
app.put("/api/products/:id", auth(), adminOnly, async (req, res) => {
  const { name, description, category_id, price, discount, image_url, stock } = req.body;
  await pool.query(
    "UPDATE products SET name=?, description=?, category_id=?, price=?, discount=?, image_url=?, stock=? WHERE id=?",
    [name, description, category_id, price, discount, image_url, stock, req.params.id],
  );
  res.json({ ok: true });
});
app.delete("/api/products/:id", auth(), adminOnly, async (req, res) => {
  await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});

// ---------- Orders ----------
app.post("/api/orders", auth(), async (req, res) => {
  const { items, billing } = req.body;
  if (!items?.length || !billing) return res.status(400).json({ error: "Missing data" });
  if (billing.method !== "COD") return res.status(400).json({ error: "Only COD is available" });
  const area = billing.delivery_area === "outside" ? "outside" : "inside";
  const deliveryCharge = area === "inside" ? 80 : 150;
  if (!/^\+8801\d{9}$/.test(billing.phone || ""))
    return res.status(400).json({ error: "Invalid phone. Use +8801XXXXXXXXX" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ids = items.map((i) => i.product_id);
    const [products] = await conn.query(
      `SELECT id, price, discount FROM products WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids,
    );
    let subtotal = 0;
    const rowsToInsert = items.map((i) => {
      const p = products.find((pp) => pp.id === i.product_id);
      const unit = Number(p.price) - Number(p.discount || 0);
      subtotal += unit * i.quantity;
      return [i.product_id, i.quantity, unit];
    });
    const total = subtotal + deliveryCharge;
    const [o] = await conn.query(
      "INSERT INTO orders (user_id,total_price,status) VALUES (?,?, 'Pending')",
      [req.user.id, total],
    );
    for (const [pid, qty, price] of rowsToInsert) {
      await conn.query(
        "INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)",
        [o.insertId, pid, qty, price],
      );
    }
    const areaLabel = area === "inside" ? "Inside Dhaka" : "Outside Dhaka";
    const addressWithArea = `${billing.address}\n[Delivery: ${areaLabel} — ৳${deliveryCharge}]`;
    await conn.query(
      "INSERT INTO payments (order_id,user_id,method,name,address,phone) VALUES (?,?,?,?,?,?)",
      [o.insertId, req.user.id, "COD", billing.name, addressWithArea, billing.phone],
    );
    await conn.commit();
    res.json({ id: o.insertId, total, subtotal, delivery_charge: deliveryCharge });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.get("/api/orders/mine/:id", auth(), async (req, res) => {
  const [[order]] = await pool.query(
    "SELECT * FROM orders WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
  );
  if (!order) return res.status(404).json({ error: "Not found" });
  const [items] = await pool.query(
    `SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE order_id=?`,
    [req.params.id],
  );
  const [[payment]] = await pool.query(`SELECT * FROM payments WHERE order_id=?`, [req.params.id]);
  res.json({ order, items, payment });
});

app.put("/api/orders/mine/:id/cancel", auth(), async (req, res) => {
  const [[order]] = await pool.query(
    "SELECT * FROM orders WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
  );
  if (!order) return res.status(404).json({ error: "Not found" });
  if (!["Pending", "Paid"].includes(order.status))
    return res.status(400).json({ error: `Cannot cancel an order that is already ${order.status}` });
  await pool.query("UPDATE orders SET status='Cancelled' WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/orders/mine", auth(), async (req, res) => {
  const [orders] = await pool.query(
    "SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC",
    [req.user.id],
  );
  res.json(orders);
});

app.get("/api/admin/orders", auth(), adminOnly, async (_req, res) => {
  const [orders] = await pool.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o JOIN users u ON u.id=o.user_id
     ORDER BY o.created_at DESC`,
  );
  res.json(orders);
});

app.get("/api/admin/orders/:id", auth(), adminOnly, async (req, res) => {
  const [[order]] = await pool.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?`,
    [req.params.id],
  );
  const [items] = await pool.query(
    `SELECT oi.*, p.name FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE order_id=?`,
    [req.params.id],
  );
  const [[payment]] = await pool.query(`SELECT * FROM payments WHERE order_id=?`, [req.params.id]);
  res.json({ order, items, payment });
});

app.put("/api/admin/orders/:id/status", auth(), adminOnly, async (req, res) => {
  const { status } = req.body;
  await pool.query("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
  res.json({ ok: true });
});

// ---------- Admin ----------
app.get("/api/admin/payments", auth(), adminOnly, async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, o.total_price, o.status FROM payments p JOIN orders o ON o.id=p.order_id ORDER BY p.created_at DESC`,
  );
  res.json(rows);
});

app.get("/api/admin/stats", auth(), adminOnly, async (_req, res) => {
  const [[u]] = await pool.query("SELECT COUNT(*) c FROM users");
  const [[p]] = await pool.query("SELECT COUNT(*) c FROM products");
  const [[o]] = await pool.query("SELECT COUNT(*) c FROM orders");
  const [[r]] = await pool.query(
    "SELECT COALESCE(SUM(total_price),0) c FROM orders WHERE status IN ('Paid','Shipped','Delivered')",
  );
  res.json({ users: u.c, products: p.c, orders: o.c, revenue: Number(r.c) });
});

app.get("/api/admin/users", auth(), adminOnly, async (_req, res) => {
  const [rows] = await pool.query("SELECT id,name,email,role,created_at FROM users ORDER BY id");
  res.json(rows);
});

// ---------- Fallbacks ----------
app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` }));

const DB_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "ER_BAD_HOST_ERROR",
  "POOL_CLOSED",
  // TLS negotiation with the database failed.
  "HANDSHAKE_SSL_ERROR",
  "HANDSHAKE_NO_SSL_SUPPORT",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

/** Per-code guidance so the response says what to change, not just what broke. */
function dbErrorHint(code, message) {
  const missing = ["DB_HOST", "DB_USER", "DB_NAME"].filter((k) => !process.env[k]);
  if (missing.length) {
    return `Missing environment variable(s): ${missing.join(", ")}. Set them in Vercel > Project > Settings > Environment Variables and redeploy.`;
  }
  switch (code) {
    case "HANDSHAKE_SSL_ERROR":
    case "SELF_SIGNED_CERT_IN_CHAIN":
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
    case "ERR_TLS_CERT_ALTNAME_INVALID":
      return (
        "TLS handshake failed: this server's certificate chain is not trusted by Node " +
        "(managed providers like Aiven use their own CA). Set DB_SSL_NO_VERIFY=true to skip " +
        "verification, or paste the provider's CA certificate into DB_SSL_CA to keep it."
      );
    case "HANDSHAKE_NO_SSL_SUPPORT":
      return "The server refused TLS. Remove DB_SSL=true (and any ssl-mode=REQUIRED on MYSQL_URL).";
    case "ER_ACCESS_DENIED_ERROR":
      return (
        "Credentials rejected. Re-copy DB_USER/DB_PASSWORD (the provider console can reset the " +
        "password) and make sure the user is allowed to connect from this network."
      );
    case "ER_BAD_DB_ERROR":
      return `The database "${process.env.DB_NAME || "?"}" does not exist. Run "npm run db:init", or set DB_NAME to an existing database.`;
    case "ENOTFOUND":
      return "The hostname does not resolve. Some providers publish an internal-only host - use the public one.";
    default:
      if (/self[- ]signed|certificate/i.test(String(message))) {
        return "TLS certificate rejected. Set DB_SSL_NO_VERIFY=true, or supply the provider's CA via DB_SSL_CA.";
      }
      return "Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME in the deployment environment variables.";
  }
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
app.use((err, _req, res, _next) => {
  if (res.headersSent) return;
  const code = err?.code || "";
  if (err?.fatal || DB_ERROR_CODES.has(code)) {
    console.error("[api] database error:", code || err?.message);
    return res.status(503).json({
      error: `Database unavailable (${code || err?.message}). ${dbErrorHint(code, err?.message)}`,
      code: code || undefined,
    });
  }
  console.error("[api] unhandled error:", err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

const port = process.env.PORT || 5000;
if (process.env.VERCEL !== "1") {
  app.listen(port, () => console.log(`Bilashbari API running on http://localhost:${port}`));
}

export default app;
