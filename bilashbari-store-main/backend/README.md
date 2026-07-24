# Bilashbari Backend

A lightweight Node.js + Express backend for the Bilashbari store.
It uses MySQL for data storage, JWT for authentication, and provides both customer and admin APIs.

## Prerequisites

- Node.js 18+ or compatible runtime
- MySQL 8+ database
- `npm` installed

## Install

```bash
cd backend
npm install
```

## Environment

Copy the example file and configure your own credentials. Do not commit real values.

```bash
cp .env.example .env
```

### Required environment variables

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

## Database

Import the schema into MySQL:

```bash
mysql -u root -p < schema.sql
```

## Run

```bash
npm run dev
```

The API will be available at `http://localhost:5000/api`.

## Default admin account

This project may include seeded admin data in the schema.
If not, create an admin user directly in the database and set `role='admin'`.

## API overview

- `POST /api/auth/register` — register a user
- `POST /api/auth/login` — login and receive a JWT
- `GET /api/auth/me` — return current user
- `GET /api/products` — list products
- `GET /api/products/:id` — product details
- `GET /api/categories` — list categories
- `POST /api/orders` — create order (auth required)
- `GET /api/orders/mine` — list current user orders (auth required)

### Admin routes

- `POST /api/products` — create product
- `PUT /api/products/:id` — update product
- `DELETE /api/products/:id` — delete product
- `POST /api/categories` — create category
- `PUT /api/categories/:id` — update category
- `DELETE /api/categories/:id` — delete category
- `GET /api/admin/orders` — view all orders
- `PUT /api/admin/orders/:id/status` — update order status
- `GET /api/admin/payments` — payment history
- `GET /api/admin/stats` — backend stats
- `GET /api/admin/users` — list users

## Notes

- `backend/.env` is ignored by git via `.gitignore`.
- Keep credentials and JWT secrets out of source control.
