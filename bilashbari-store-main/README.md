# Bilashbari Store

A full-stack e-commerce storefront built with Vite, React, TanStack Router, Tailwind CSS, and a Node + Express + plain MySQL (`mysql2`) backend.

## Project structure

- `src/` — frontend application and routes
- `backend/` — Express API server, MySQL database integration, authentication, admin APIs
- `api/index.js` — Vercel serverless entry that re-exports the Express app
- `public/` — static assets
- `.env.example` — frontend environment variables sample
- `backend/.env.example` — backend environment variables sample

## Features

- Product listing and category browsing
- User registration and login with JWT authentication
- Shopping cart and checkout flow
- Order history for customers
- Admin dashboard APIs for products, categories, orders, and stats

## Getting started (local)

### 1. Clone the repository

```bash
git clone <repo-url>
cd bilashbari-store-main
```

### 2. Frontend setup

```bash
npm install
cp .env.example .env
```

### 3. Backend setup

The backend shares the root `node_modules` on Vercel, but locally you can still
install it standalone:

```bash
cd backend
npm install
cp .env.example .env
```

### 4. Configure environment variables

Edit `.env` and `backend/.env` with your local settings.

#### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

#### Backend `backend/.env`

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bilashbari
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

### 5. Initialize the database (plain MySQL)

Create the MySQL database schema:

```bash
mysql -u root -p < backend/schema.sql
```

Or let the helper script do it (creates the database, applies the schema, lists the tables):

```bash
npm run db:init
```

### 6. Run the app

Start the backend server:

```bash
cd backend
npm run dev
```

Start the frontend app from the project root:

```bash
npm run dev
```

The frontend should be available at `http://localhost:5173` and the backend at `http://localhost:5000/api`.

## Deploy on Vercel

Vercel deploys this as **one project** (no separate frontend/backend projects). The
TanStack Start SSR app and the Express API become two serverless functions.

### 1. Project settings

| Setting | Value |
| --- | --- |
| Framework Preset | `Other` (do **not** pick `Vite`) |
| Root Directory | this folder (`bilashbari-store-main`) |
| Build Command | `npm run build` |
| Output Directory | leave **empty** (Nitro emits prebuilt `.vercel/output`) |
| Install Command | `npm install` |
| Node.js Version | `20.x` |

### 2. Environment variables

Set these for **Production** *and* **Preview**:

```env
VITE_API_URL=/api
DB_HOST=<public mysql host>
DB_PORT=3306
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=bilashbari
JWT_SECRET=<long random string>
CORS_ORIGIN=https://<your-app>.vercel.app
```

### 3. You need an externally reachable MySQL server

Vercel functions **cannot** reach `127.0.0.1:3306` — that is the single most common
cause of `connect ECONNREFUSED 127.0.0.1:3306` on a fresh deployment. Use any
MySQL 8+ host that is reachable over the internet (Railway, Aiven, Clever Cloud,
Hostinger, RDS, a VPS…), then load the schema once:

```bash
# from your machine, pointing at the hosted database
DB_HOST=<host> DB_USER=<user> DB_PASSWORD=<pw> DB_NAME=bilashbari npm run db:init
```

Notes:

- Vercel's own **Storage** (Postgres / KV / Blob) is *not* compatible — the code
  uses `mysql2` only.
- PlanetScale dropped its free MySQL tier; if you use a provider that forbids
  `CREATE DATABASE`/`USE`, set `DB_CREATE_DATABASE=0` and create the database in
  their console first.
- Remember to whitelist `0.0.0.0/0` (or Vercel's egress IPs) in the DB firewall.

### 4. Verify the deployment

```bash
npm run api:check -- https://<your-app>.vercel.app
```

`GET /api/health` should return `{"ok":true,"db":{"ok":true}}`. A `db.ok:false`
value tells you the DB credentials are wrong or the host is unreachable, without
needing the Vercel logs.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `connect ECONNREFUSED 127.0.0.1:3306` | `DB_HOST` missing/unreadable, so `mysql2` falls back to `localhost` | Set `DB_HOST` (and friends) in Vercel env vars, then **redeploy** |
| `504` on `/api/products`, `/api/categories` | async handler rejection was never forwarded to Express (older code); fixed by the `asyncSafe` wrapper in `backend/server.js` | update + redeploy |
| `503 Database unavailable (ECONNREFUSED)` | Correct: the API failed fast and told you the DB is unreachable | check `DB_HOST` + DB firewall |
| `API returned a non-JSON response (HTTP 404)` | Request never reached Express (rewrite/Root Directory wrong) | verify `vercel.json` rewrites and Root Directory |
| Register works but `/admin` rejects you | account `role` is `user` | `UPDATE users SET role='admin' WHERE email='you@example.com';` |

## Notes for public repos

- `.env` and `backend/.env` are ignored by `.gitignore`
- Do not commit real passwords, API keys, or JWT secrets
- Use `.env.example` files as the public template
