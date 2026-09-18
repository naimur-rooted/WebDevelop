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

1. Push this folder as the Vercel project root.
2. Build command: `npm run build` (Nitro `vercel` preset, output is prebuilt).
3. Set these environment variables in Vercel:
   - `VITE_API_URL=/api` (frontend calls the same deployment)
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `JWT_SECRET`
   - `CORS_ORIGIN=https://<your-app>.vercel.app`
4. Use an externally reachable MySQL host (Vercel functions cannot reach
   `localhost`). PlanetScale, Aiven, Railway, or any MySQL 8+ host works —
   import `backend/schema.sql` there first.
5. API routes are served by `api/index.js` (`/api/*` → Express + `mysql2`).

## Notes for public repos

- `.env` and `backend/.env` are ignored by `.gitignore`
- Do not commit real passwords, API keys, or JWT secrets
- Use `.env.example` files as the public template
