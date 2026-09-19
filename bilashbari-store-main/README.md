# Bilashbari Store

Plants, tools & garden essentials storefront. Plain **Vite SPA (React + TanStack Router)** frontend, **Express + MySQL** backend.

```
WebDevelop/                  <- repo root (Render Blueprint reads render.yaml here)
├── render.yaml              # Blueprint: creates BOTH services at once
└── bilashbari-store-main/
    ├── frontend/            # Vite SPA -> deploy as Render Static Site (or any static host)
    └── backend/             # Express + mysql2 -> deploy as Render Web Service
```

> Manual setup: every path below is relative to `bilashbari-store-main/`,
> but Render's **Root Directory** must include that folder, e.g.
> `bilashbari-store-main/frontend` (repo root is the parent).

## Deploy on Render (recommended structure)

**Storage: none needed on Render.** The database is an external MySQL host
(e.g. the free [Aiven for MySQL](https://aiven.io) service). Do not create
Render Postgres/Key Value — the backend speaks plain `mysql2`.

### 1. Create the database once (if not done already)

Follow [Aiven's guide](https://aiven.io) → MySQL Free plan → copy Host/Port/User/Password.
Leave the IP filter at `0.0.0.0/0` so Vercel/Render functions can connect, then load the schema:

```powershell
cd backend
$env:DB_HOST='<aiven host>'; $env:DB_PORT='<port>'; $env:DB_USER='avnadmin'
$env:DB_PASSWORD='<password>'; $env:DB_NAME='bilashbari'
$env:DB_SSL='true'; $env:DB_SSL_NO_VERIFY='true'
npm run db:init
```

### 2. API — Render Web Service

New → Blueprint (uses `render.yaml`) **or** manually:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Environment variables (values marked `sync` in render.yaml must be filled in the dashboard):

```
DB_HOST=<aiven host>          DB_PORT=<aiven port>
DB_USER=avnadmin              DB_PASSWORD=<password>
DB_NAME=bilashbari            DB_SSL=true
DB_SSL_NO_VERIFY=true         # avoids HANDSHAKE_SSL_ERROR on managed MySQL
JWT_SECRET=<long random>
CORS_ORIGIN=https://<your-static-site>.onrender.com,https://*.onrender.com
```

### 3. Frontend — Render Static Site

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| SPA Rewrite | `/* → /index.html` (render.yaml includes it) |

Environment variable (**build-time** — set before building, rebuild after changing):

```
VITE_API_URL=https://<api-service>.onrender.com/api
```

### 4. Verify

```powershell
npm run api:check -- https://<api-service>.onrender.com   # from backend/
```

- `GET /api/health` → `{"ok":true,"db":{"ok":true},"render":true}`
- Open the static site → Shop lists products, signup/login works.

## Local development

```powershell
# Terminal 1 - API (reads backend/.env)
cd backend; npm install; npm run dev          # http://localhost:5000/api

# Terminal 2 - SPA (reads frontend/.env)
cd frontend; npm install; npm run dev         # http://localhost:5173
```

Seed the local/remote DB with `npm run db:init` (backend/) — it creates the
`bilashbari` database and all tables from `backend/schema.sql`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `HANDSHAKE_SSL_ERROR` in health | TLS required but no-verify off | set `DB_SSL_NO_VERIFY=true` |
| `ER_BAD_DB_ERROR` | database not created on host | run `npm run db:init` |
| `ECONNREFUSED` | wrong host/port or firewall | use the **public** Aiven host/port |
| `ER_ACCESS_DENIED_ERROR` | wrong DB_USER/DB_PASSWORD | re-copy credentials exactly |
| Shop shows "Couldn't reach the API" | `VITE_API_URL` missing at build time | set it on the Static Site, rebuild |
| CORS error in console | `CORS_ORIGIN` doesn't include the frontend URL | add it (wildcards ok: `https://*.onrender.com`) |
