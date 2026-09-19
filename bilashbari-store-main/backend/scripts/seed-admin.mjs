// One-off seed: ensure naimur.rooted@gmail.com exists as admin. Safe to re-run.
import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { poolConfig } from "../db.js";

const EMAIL = "naimur.rooted@gmail.com";
const NAME = "Naimur";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Naimur@2026";

const conn = await mysql.createConnection({ ...poolConfig(), multipleStatements: false });
const [existing] = await conn.query("SELECT id, name, email, role FROM users WHERE email = ?", [EMAIL]);

if (existing.length === 0) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  await conn.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')", [
    NAME,
    EMAIL,
    hash,
  ]);
  console.log(`SEEDED: admin user ${EMAIL} created (password: ${PASSWORD})`);
} else {
  await conn.query("UPDATE users SET role = 'admin' WHERE email = ?", [EMAIL]);
  console.log(`UPDATED: existing user promoted to admin (was role: ${existing[0].role})`);
}

const [row] = await conn.query("SELECT id, name, email, role, created_at FROM users WHERE email = ?", [EMAIL]);
console.log(JSON.stringify(row[0], null, 2));
await conn.end();
