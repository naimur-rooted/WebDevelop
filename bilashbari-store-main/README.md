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

Optional (only if your provider needs them):

```env
DB_SSL=true              # managed MySQL almost always requires TLS
DB_SSL_NO_VERIFY=true    # provider uses a private CA Node does not trust
DB_CREATE_DATABASE=0     # the user may not run CREATE DATABASE
DB_COLLATION=utf8mb4_general_ci   # MySQL-compatible servers that reject utf8mb4_unicode_ci
# MYSQL_URL=mysql://user:pw@host:3306/bilashbari?ssl-mode=REQUIRED   # single-string alternative
```

### 3. You need an externally reachable MySQL server

Vercel functions **cannot** reach `127.0.0.1:3306` — that is the single most common
cause of `connect ECONNREFUSED 127.0.0.1:3306` on a fresh deployment. Vercel's own
**Storage** (Postgres / KV / Blob) is *not* usable here: the code talks `mysql2`
to a MySQL server and nothing else.

Pick any MySQL 8+ host reachable over the internet:

| Provider | Cost | Notes |
| --- | --- | --- |
| **Aiven for MySQL (free tier)** | free, no credit card, no time limit | **best fit.** Real MySQL 8, 1 vCPU / 1 GB RAM / 1 GB disk, `max_connections` 76, reachable from anywhere because its IP filter defaults to `0.0.0.0/0`. Only one free service per service type |
| TiDB Cloud Starter | free | 5 GiB + 50M request units/month, MySQL-*compatible*. TLS is mandatory, port is `4000` and the username is prefixed with the instance id (`3pTAoNNegb47Uc8.root`). Set `DB_COLLATION=utf8mb4_general_ci` if `utf8mb4_unicode_ci` is rejected |
| Railway | paid (trial credit) | easiest UI, no longer genuinely free |
| cPanel shared hosting (Hostinger, Namecheap…) | cheap, paid | MySQL exists but you must enable *Remote MySQL* and add `%` as an allowed host |
| Amazon RDS / Azure / a VPS | paid | full control, most setup |

#### Aiven free-tier walkthrough (no credit card)

1. Sign up at [aiven.io](https://aiven.io) and create a project.
2. **Create service** → `MySQL` → plan **Free** → pick the cloud/region closest to
   your users (the free plan does not let you choose a specific cloud).
3. Wait for the service state to become **Running**, then open its **Overview**
   page. You need `Host`, `Port`, `User` (usually `avnadmin`) and `Password`.
4. Leave **Service settings → Cloud and network → IP filter** at `0.0.0.0/0` —
   Aiven needs all inbound IPs allowed because Vercel functions have no fixed
   outbound IPs.
5. Import the schema from your machine:

   ```bash
   DB_HOST=<host> DB_PORT=<port> DB_USER=avnadmin DB_PASSWORD=<pw> \
   DB_NAME=bilashbari DB_SSL=true npm run db:init
   ```

6. Put the same values into the Vercel environment variables from step 2, then
   redeploy.

Notes:

- **TLS:** managed providers require it. Set `DB_SSL=true`, or use a single
  `MYSQL_URL=mysql://avnadmin:pw@host:port/bilashbari?ssl-mode=REQUIRED`. If the
  provider uses a private CA and Node rejects the chain, add
  `DB_SSL_NO_VERIFY=true` (or install their CA).
- **No `CREATE DATABASE` permission?** Set `DB_CREATE_DATABASE=0` and create the
  database in the provider console first; the script then only applies the schema.
- **`Unknown collation`?** `schema.sql` uses `utf8mb4_unicode_ci`. MySQL 8 supports
  it; some MySQL-compatible servers do not. Retry with `DB_COLLATION=utf8mb4_general_ci`.
- **Whitelist remote access:** if the provider has a firewall/allow-list, allow
  `0.0.0.0/0` (or the Vercel egress IPs) otherwise you get `ECONNREFUSED`/timeouts.
- Copy `backend/.env.example` to `backend/.env` and fill it in to keep the same
  settings locally — `npm run db:check` prints exactly what the API will resolve.

### 4. Verify the deployment

```bash
npm run api:check -- https://<your-app>.vercel.app
```

`GET /api/health` should return `{"ok":true,"db":{"ok":true}}`. A `db.ok:false`
value tells you the DB credentials are wrong or the host is unreachable, without
needing the Vercel logs. To check the same settings from your own machine first:

```bash
npm run db:check    # prints the resolved host/port/db and probes the connection
```

`npm run db:check` loads `.env` then `backend/.env`, so `npm run db:check` tells you
exactly what `backend/db.js` will use at runtime — useful for spotting a `DB_HOST`
that is still a loopback address.

## Alternative: API on Render, frontend on Vercel

Vercel never asks whether you are deploying a frontend or a backend — **one project
deploys both**. If you would rather run the API as a normal long-lived Node process
(no 10s serverless limit, plain logs, one always-on server), you can keep the
frontend on Vercel and host `backend/` on [Render](https://render.com).

> **Render cannot host MySQL.** Its managed storage is Postgres and Key Value only,
> and free web services have no persistent disks, so a self-hosted MySQL container
> on Render is not an option either. You still need an external MySQL host (Aiven /
> TiDB / Railway / RDS) from the section above — Render only replaces the `/api`
> serverless function, it does not solve the database problem.

### 1. Create the Render web service

| Setting | Value |
| --- | --- |
| Type | Web Service |
| Repository | this repo (`WebDevelop`) |
| Root Directory | `bilashbari-store-main/backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` (`node server.js`) |
| Health Check Path | `/api/health` |
| Instance Type | Free (spins down when idle — expect a cold start of roughly a minute) |

`backend/server.js` listens on `process.env.PORT` and binds every interface, so
Render's default port works unchanged. Add `PORT=10000` explicitly if the deploy
log shows the service never becoming healthy.

### 2. Render environment variables

```env
PORT=10000
DB_HOST=<public mysql host>
DB_PORT=3306
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=bilashbari
DB_SSL=true
JWT_SECRET=<long random string>
CORS_ORIGIN=https://<your-app>.vercel.app,https://*.vercel.app
```

`CORS_ORIGIN` takes a comma separated list and supports `*` wildcards inside an
entry, so Vercel preview deployments keep working without editing the variable for
every build. A lone `*` allows every origin — fine for a first smoke test, not for
anything public.

### 3. Point the frontend at Render

In Vercel → Settings → Environment Variables set the **absolute** URL, then redeploy:

```env
VITE_API_URL=https://<your-service>.onrender.com/api
```

`VITE_API_URL` is inlined during `vite build`, so the frontend must be rebuilt
(redeployed) for a change to take effect. Set it back to `/api` — or delete it — to
return to the Vercel function; `src/lib/api.ts` falls back to the same-origin `/api`
path automatically.

### 4. Verify

```bash
npm run api:check -- https://<your-service>.onrender.com
```

On Render the health response reports `"render":true, "vercel":false`, so the body
alone tells you which host answered the request.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `connect ECONNREFUSED 127.0.0.1:3306` | `DB_HOST` missing in the deployment, so `mysql2` falls back to `localhost` | Set `DB_HOST` (and friends) in Vercel env vars, then **redeploy** |
| `504` on `/api/products`, `/api/categories` | async handler rejection was never forwarded to Express (older code); fixed by the `asyncSafe` wrapper in `backend/server.js` | update + redeploy |
| `503 Database unavailable (ECONNREFUSED)` | Correct: the API failed fast and told you the DB is unreachable instead of hanging until the 10s function timeout | check `DB_HOST` + the DB firewall/allowlist |
| `503 Database unavailable (ENOTFOUND)` | the DB hostname does not resolve | typo in `DB_HOST`; some providers also give an internal-only hostname — use the public one |
| `503 Database unavailable (ER_ACCESS_DENIED_ERROR)` | wrong `DB_USER`/`DB_PASSWORD`, or the user is not allowed in from your IP | re-copy the credentials; allow `0.0.0.0/0` in the provider firewall |
| TLS / certificate error, or `HANDSHAKE` on the DB | managed MySQL requires TLS (or uses a private CA) | set `DB_SSL=true`; if it still fails add `DB_SSL_NO_VERIFY=true` |
| `Unknown collation: utf8mb4_unicode_ci` while importing | MySQL-compatible server that lacks that collation | `DB_COLLATION=utf8mb4_general_ci npm run db:init` |
| `ER_DBACCESS_DENIED_ERROR` while importing | the user may not run `CREATE DATABASE` | create the DB in the provider console, then `DB_CREATE_DATABASE=0 npm run db:init` |
| `API returned a non-JSON response (HTTP 404)` | Request never reached Express (rewrite/Root Directory wrong) | verify `vercel.json` rewrites and Root Directory |
| `API returned a non-JSON response (HTTP 500)` | The `/api` function crashed before Express replied (usually a bad env var) | check `JWT_SECRET` is set, then the function logs |
| `Failed to fetch` / `blocked by CORS policy` after moving the API to another host | the browser calls a different origin, so CORS applies | add that origin to `CORS_ORIGIN` on the API host (wildcards like `https://*.vercel.app` are supported), then restart/redeploy it |
| Edited `VITE_API_URL` but the frontend still calls the old URL | the value is inlined at build time | trigger a new Vercel deployment; a runtime env change alone has no effect |
| First request to a Render free service takes ~1 minute | free web services spin down when idle | expected cold start; keep the API on the Vercel function or use a paid instance |
| Register works but `/admin` rejects you | account `role` is `user` | `UPDATE users SET role='admin' WHERE email='you@example.com';` |

Status codes the API uses on purpose: `400` missing fields, `401` bad credentials/token,
`403` not an admin, `404` unknown route, `409` email already used, **`503` database
unreachable**, `500` unexpected error.

## Notes for public repos

- `.env` and `backend/.env` are ignored by `.gitignore`
- Do not commit real passwords, API keys, or JWT secrets
- Use `.env.example` files as the public template
