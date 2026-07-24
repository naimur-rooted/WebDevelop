import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { pool } from "./db.js";
import { auth, adminOnly } from "./middleware/auth.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json());

const sign = (u) =>
  jwt.sign({ id: u.id, role: u.role, name: u.name, email: u.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// ---------- Auth ----------
app.post("/api/auth/register", async (req, res) => {
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
    res.status(500).json({ error: e.message });
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

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Bilashbari API running on http://localhost:${port}`));
