# Zahlx

Point-of-sale, inventory and double-entry bookkeeping for small businesses, with an AI assistant that answers questions about the business's own numbers.

## Overview

Zahlx is a business management and accounting web app for small businesses in Kosovo, with an Albanian-language interface. Owners and their staff ring up sales at a point-of-sale screen and manage stock, quotes, purchases and clients. Every sale, purchase and tax payment is posted as balanced debit and credit entries to a ledger, and the cash book and reports are built from that ledger. The app is a React single-page frontend on top of an Express + MySQL API, designed and built by Art Halimi.

## Features

- Point of sale with barcode-scanner input, client selection, discounts, payment method and payment terms (immediate, net 15, net 30)
- Printable receipts with a CODE128 barcode and a QR code, keyed to a random per-invoice code
- Inventory with purchase and sale prices, VAT rates, barcodes, stock levels and product image uploads
- Quotes with status tracking and one-click conversion into an invoice
- Purchase book: scanning the barcode on another Zahlx business's invoice imports the supplier's line items
- Cash book, VAT payments and reports with revenue-versus-cost charts by day, week or month
- Client directory with per-client totals and transaction history
- Staff accounts with a restricted worker role, an onboarding wizard, light and dark themes, and AI insights plus a chat assistant for owners

## Tech stack

- Frontend: React 18, Vite 5, React Router 6, Tailwind CSS 3, Framer Motion, Recharts, qrcode.react, JsBarcode
- Backend: Node.js, Express 4, MySQL (`mysql2`) with a SQLite fallback (`sqlite3`)
- Auth: JSON Web Tokens in httpOnly cookies, bcrypt password hashing
- Uploads: multer
- AI: Google Gemini API (REST)
- Hosting config: Netlify for the frontend (`netlify.toml` proxies `/api` to the hosted API)

## Technical highlights

- **Transactional sales with a double-entry ledger.** `POST /api/sales` locks the product rows (`SELECT ... FOR UPDATE`) and checks stock. It then computes VAT-inclusive tax per line and the discount, writes the invoice and its items, and decrements stock. Finally it posts balanced ledger lines (cash or receivables, sales revenue, VAT payable), all in one transaction that rolls back on any failure. Purchases do the same in reverse (expenses, deductible VAT, cash or payables). See [`server/server.js`](server/server.js).
- **Race-free document numbering.** Invoice, quote and purchase numbers (`FAT-`/`OFR-`/`BLR-YYYYMMDD-NNNN`) come from a `counters` table with a unique `(user_id, prefix, date)` key. An `INSERT ... ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)` statement makes each increment atomic per tenant, and a migration seeds the counters from existing records. See [`server/server.js`](server/server.js) and [`server/init-db.js`](server/init-db.js).
- **Multi-tenant access control.** Each business is a tenant. Worker accounts resolve to their owner's tenant, every query is scoped by `user_id`, owner-only endpoints reject workers, and the frontend mirrors this with role-aware routes. See [`server/server.js`](server/server.js) and [`src/App.jsx`](src/App.jsx).
- **Portable data layer.** The pool accepts either a connection URI or separate settings, supports TLS with a custom CA, and tests MySQL with a 3-second timeout. If MySQL is unreachable it falls back to SQLite through a pool and connection shim that translates common MySQL syntax (`DATE_FORMAT`, `CURDATE`, `DATE_SUB`, auto-increment DDL, `ENUM`). See [`server/db.js`](server/db.js).
- **Grounded AI assistant.** The chat and insight endpoints load the tenant's live figures (revenue, today's sales, stock, recent transactions) into the system prompt and tell Gemini not to invent numbers. See [`server/server.js`](server/server.js) and [`src/components/AssistantChatWidget.jsx`](src/components/AssistantChatWidget.jsx).

## Getting started

Prerequisites: Node.js 18+ and npm, and a MySQL database. If MySQL is unreachable the server falls back to a local SQLite file, but MySQL is the primary target.

```bash
# Frontend
npm install
npm run dev                  # Vite dev server; proxies /api and /uploads to localhost:3001
npm run build                # production build to dist/
npm run preview              # serve the production build locally
npm run lint                 # run ESLint

# API
npm install --prefix server
node index.js                # create or migrate the schema, then start the API on port 3001
npm run init-db --prefix server   # create or migrate the schema only
```

The API reads environment variables, loaded with dotenv from the directory it is started in. `server/.env.example` lists the database settings.

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (defaults to 3001) |
| `NODE_ENV` | `production` switches session cookies to `Secure` and `SameSite=None` |
| `JWT_SECRET` | Secret used to sign session tokens |
| `DATABASE_URL` or `MYSQL_URL` | MySQL connection URI (alternative to the separate settings below) |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | MySQL host, port and database name |
| `DB_USER`, `DB_PASSWORD` | MySQL credentials |
| `DB_SSL_MODE`, `DB_SSL_CA`, `DB_SSL_CA_PATH` | TLS mode and CA certificate (inline or file path) for managed MySQL |
| `DB_MODE` | Set to `SQLITE` to skip MySQL and use the local SQLite file |
| `DEFAULT_BUSINESS_NAME`, `DEFAULT_BUSINESS_EMAIL` | Name and email of the owner account created when the database is empty |
| `DEFAULT_OWNER_PASSWORD` | Password for that first owner account (if unset, a random one is generated and printed once at startup) |
| `GEMINI_API_KEY` | Enables the AI assistant and insights |
| `GEMINI_MODEL` | Optional Gemini model override |
| `RENDER_EXTERNAL_URL` | Public URL the API pings on its health endpoint to stay awake |

## Project structure

```
.
├── index.js              # API entry: prepares the schema, then starts the server
├── server/
│   ├── server.js         # Express API: auth, sales, quotes, purchases, reports, AI
│   ├── db.js             # MySQL pool with SQLite fallback and SQL translation
│   ├── init-db.js        # Idempotent schema creation and migrations
│   └── schema.sql        # Base MySQL schema
├── src/
│   ├── pages/            # Dashboard, POS, inventory, quotes, purchases, reports, ...
│   ├── components/       # Sidebar, AI chat widget, onboarding wizard, quick sale
│   └── contexts/         # Auth and theme providers
├── netlify.toml          # Frontend build and /api proxy
└── vite.config.js        # Dev proxy for /api and /uploads
```

## Author

Designed and built by [Art Halimi](https://arthalimi.com) · [GitHub](https://github.com/ArtHalimi7)
