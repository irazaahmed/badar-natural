# Badar Natural Foods — Business Management Portal

A full-stack management portal for **Badar Natural Foods**, a kiryana store
selling desi / daily kitchen staples (atta, chawal, ghee, oil, masaley, honey)
across **two sales models on one shared inventory**:

- **Retail** — walk-in customers buying loose quantities (1 pao / adha kilo /
  1 kilo), high frequency, mostly cash. Optimized for fast daily entry.
- **Wholesale** — buying bulk stock from suppliers at a purchase rate and
  selling bulk to other shopkeepers at a wholesale rate, with cash **and
  credit** in both directions.

There is **no customer-facing ordering system** — just a public showcase page
with WhatsApp as the single conversion path. All real operations live in a
single-admin backend portal.

**Owner:** Jahangeer Badar · **Phone:** +92 312 3546488 · **Web:** https://badarnatural.com/

## What it does

- **Unified stock** — one `Item` table, stock tracked internally in grams/ml so
  retail (pao/kilo) and wholesale (kg/bags) both convert to a single source of
  truth. Prices held per kg (retail, wholesale, last purchase) with margin
  visibility and low-stock flags.
- **Purchases (wholesale in)** — multi-item entry in kg or bags, cash/credit
  toggle with credit days → due date. On save: stock increases, supplier
  payable ledger updates.
- **Wholesale sales** — multi-item entry at wholesale rate (editable per line),
  cash/credit, stock decrement, customer receivable ledger.
- **Retail sales** — fast one-screen cart with **1 Pao / Adha Kilo / 1 Kilo**
  presets plus free-text kg, cash-default, one-tap complete.
- **Ledgers** — supplier payables and customer receivables, each with drill-down
  history and overdue flagging; record payments against any credit purchase/sale.
- **Invoices** — branded, bilingual (English + Urdu RTL) invoice per sale,
  print-optimized, with WhatsApp share.
- **Dashboard** — today's retail & wholesale totals, total payable/receivable
  with overdue counts, and low-stock list.

Every stock- and money-affecting action writes its ledger entries inside the
same database transaction, so cached balances (`totalPayable` /
`totalReceivable`) and stock can never drift.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Prisma ORM 6** + **PostgreSQL (Neon)**
- **Auth.js v5** — single-admin; the first login is bootstrapped from env into
  an `AdminUser` row, after which the password is changed from `/admin/settings`
- **Tailwind CSS v4** + **next-themes**

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file:
   ```
   DATABASE_URL=your-neon-postgres-connection-string
   AUTH_SECRET=a-long-random-string
   ADMIN_EMAIL=owner@example.com
   # Bootstrap password (first login only; change later at /admin/settings).
   ADMIN_PASSWORD=choose-a-strong-password
   ```
   Generate an auth secret with `npx auth secret` (or any random 32+ char string).
3. Apply the schema to your database (no seed data — tables start empty):
   ```bash
   ./node_modules/.bin/prisma migrate deploy
   ```
   > Prisma is pinned to v6 — always run the local binary, not `npx prisma`
   > (v7 rejects `url` in the datasource block).
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000). The admin portal is at
   `/admin` (sign in at `/login`).

## Architecture notes

- **Brand theme** lives entirely in `app/globals.css`. The Badar palette (warm
  cream `#F0E4C8`, espresso `#2B1A10`, mustard-gold pill CTAs `#E8D48A`) is
  applied by remapping Tailwind's color scales, so components stay warm without
  per-component hex.
- **Ledger helpers** in `lib/ledger.ts` (`appendSupplierLedger` /
  `appendCustomerLedger` / `nextInvoiceNumber`) are always called inside a
  `prisma.$transaction`. Unit conversions live in `lib/units.ts`.
- Invoice number prefixes: `PUR-` (purchase), `RTL-` (retail sale),
  `WHS-` (wholesale sale).
