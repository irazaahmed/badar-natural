# Badar Natural Foods — Business Management Portal
## CLAUDE.md — Execution Spec for Claude Code

---

## 0. Context (read first)

This project **replaces** the existing codebase currently sitting in this folder (previously built for "Hafeez Communication" — a mobile accessories shop system). Reuse the boilerplate, folder structure, and architectural patterns from that build (Next.js 15 app router, Prisma ORM, cash/credit ledger logic, invoice generation), but:

- **Database is new.** Do not reuse Hafeez Communication's Neon Postgres instance. A fresh `.env` with a new `DATABASE_URL` will be provided separately. Do not hardcode or assume the old connection string.
- **Business domain is completely different.** Hafeez Communication sold mobile accessories (single-unit retail). Badar Natural Foods sells kiryana / daily kitchen items (loose-weight retail + bulk wholesale). Do not carry over any mobile-accessories-specific logic (IMEI tracking, warranty fields, etc.) — strip those out.
- **Theme is completely different.** Do not reuse Hafeez Communication's navy/cyan/gold palette. Theme is locked below (Section 1.1), derived from the live badarnatural.com marketing site.

---

## 1. Business Overview

**Client:** Badar Natural Foods
**Owner:** Jahangeer Badar
**Business type:** Kiryana store — desi/kitchen staples (atta, chawal, ghee, oil, masaley, honey, etc.)

The business runs **two parallel sales models on one shared inventory**:

1. **Retail Module** — walk-in customers buy in small loose quantities: 1 pao (250g), adha kilo (500g), 1 kilo, etc. High frequency, low value, mostly cash, needs fast daily entry.
2. **Wholesale Module** — Badar Natural Foods buys bulk stock from wholesalers (suppliers) at a purchase rate, and separately sells bulk quantities to other wholesalers/shopkeepers at a wholesale rate (higher than purchase, lower than retail). This side involves cash **and credit** transactions in both directions (buying on credit from suppliers, selling on credit to wholesale customers).

Both modules pull from and push to **the same stock table** — there is one source of truth for inventory, not two separate systems.

---

## 1.1 Brand & Theme (locked — derived from badarnatural.com)

**Website:** https://badarnatural.com/

**Visual identity** (match the live marketing site's kiryana/organic warmth, not a generic SaaS dashboard look):

- **Background:** warm cream/sandy beige (`#F0E4C8` range) — never pure white, keep it warm throughout the portal
- **Header / Footer / Dark surfaces:** deep espresso brown (`#2B1A10` – `#3A2418` range)
- **Primary accent / buttons:** mustard-gold pill-shaped buttons (`#E8D48A` – `#F0DFA0` range), dark brown text on top, fully rounded (pill) corners — this is the site's signature CTA style, replicate it for portal action buttons ("Save", "Add Purchase", "Complete Sale")
- **Body/heading text:** dark brown (`#3D2817` range), not pure black
- **Typography feel:** headings use an italic serif look on the marketing site ("Badar Natural" logotype, section headers like "Find Your Products") — for the portal (a working data tool, not a marketing page) don't force italics on every heading, but use a serif or serif-adjacent display font for page titles/logo lockup to keep brand continuity; body/table text should stay a clean sans-serif for readability at data-entry speed
- **Cards/sections:** soft rounded corners, gentle warm-brown borders, avoid harsh cool grays or blue-tinted neutrals anywhere
- **Bilingual note:** marketing site mixes English and Urdu (RTL) content. Portal itself (internal tool, used by owner/staff) should default to English/Roman for data-entry speed, but the **customer-facing invoice** should follow the same bilingual convention as the site (Urdu tagline/labels alongside English) — see Section 4.4.

**Logo:** wordmark-based — "Badar" in dark brown, "Natural" styled distinctly (underlined in the site header). No separate icon/logomark currently in use; if a standalone logo file is supplied later, swap it in, but build the portal header/sidebar using the wordmark styling in the meantime.

**Do not carry over:** the beige/brown palette should NOT bleed into functional UI states — keep standard semantic colors for alerts (red for overdue/negative stock, green for paid/in-stock, amber for pending) layered on top of the warm neutral base, rather than trying to force brand-brown onto error/success states.

---

## 2. Tech Stack

- Next.js 15 (App Router, Server Actions where appropriate)
- TypeScript
- Prisma ORM
- Postgres (Neon) — new instance, connection via fresh `.env`
- Tailwind CSS
- Auth.js — single admin login to start (owner). Design the `User` model so a `staff` role can be added later without migration pain, but only build `admin` role now.
- PDF/print invoice generation (reuse whatever approach was used in Hafeez Communication / Huzaifa Traders for invoice PDFs — likely `@react-pdf/renderer` or print-optimized HTML+CSS route — check prior project for the pattern already in place and stay consistent)

---

## 3. Core Data Model

Design principle: **one Item table, one Stock ledger, two transaction flows (Purchase, Sale) each with a `channel` distinguishing retail vs wholesale where relevant, and two ledger types (Supplier ledger = payable, Customer ledger = receivable).**

### 3.1 Item
```
Item {
  id
  name
  category            // e.g. Atta, Chawal, Ghee, Oil, Masala, Honey
  baseUnit             // "gram" | "ml" — the atomic unit stock is tracked in
  currentStock          // stored in baseUnit (grams/ml) — single source of truth
  retailPricePerKg      // price per kg/litre for retail sales
  wholesalePricePerKg    // price per kg/litre for wholesale sales
  lastPurchasePricePerKg // most recent wholesaler purchase rate, for margin visibility
  lowStockThreshold      // for dashboard alerts
  isActive
  createdAt / updatedAt
}
```
Rationale: track everything in grams/ml internally so retail (pao/adha-kilo/kilo) and wholesale (bulk kg/bags) both convert cleanly to one unit. Never store stock in mixed units.

**Unit conversion helper (build as a shared util, not duplicated logic):**
- 1 pao = 250g
- 1 adha kilo = 500g
- 1 kilo = 1000g
- Wholesale entries can be in kg or bags (bag weight configurable per item, e.g. atta bag = 20kg/40kg) — store bag-to-kg conversion on the Item or on the Purchase line itself if it varies by supplier.

### 3.2 Supplier (wholesaler Badar buys from)
```
Supplier {
  id
  name
  phone
  address
  totalPayable        // running balance owed to this supplier (derived/cached, recalculated from ledger)
  createdAt
}

SupplierLedgerEntry {
  id
  supplierId
  purchaseId           // nullable — link to originating purchase
  type                 // "purchase" | "payment"
  amount
  balanceAfter          // running balance snapshot at this entry
  note
  createdAt
}
```

### 3.3 Customer (wholesale buyers — retail walk-ins do NOT need a Customer record unless you want optional named tracking for regulars)
```
Customer {
  id
  name
  phone
  address
  type                 // "wholesale" | "retail_regular" (optional, for known repeat retail customers)
  totalReceivable        // running balance owed BY this customer (derived/cached)
  createdAt
}

CustomerLedgerEntry {
  id
  customerId
  saleId                // nullable — link to originating sale
  type                  // "sale" | "payment"
  amount
  balanceAfter
  note
  createdAt
}
```

### 3.4 Purchase (Badar buying from a supplier/wholesaler)
```
Purchase {
  id
  supplierId
  invoiceNumber          // auto-generated, e.g. PUR-0001
  paymentType             // "cash" | "credit"
  creditDays              // nullable, only if credit — e.g. 15, 30
  dueDate                 // nullable, computed = createdAt + creditDays
  status                  // "unpaid" | "partially_paid" | "paid" — only relevant if credit
  totalAmount              // sum of line items
  paidAmount                // running total paid so far (for credit purchases)
  createdAt
}

PurchaseItem {
  id
  purchaseId
  itemId
  quantityKg              // quantity purchased, in kg (or bags × bagWeight, stored normalized to kg)
  ratePerKg                // purchase rate for this transaction
  lineTotal                // quantityKg × ratePerKg
}
```
On Purchase creation:
1. Increment `Item.currentStock` by `quantityKg × 1000` (grams) for each line.
2. Update `Item.lastPurchasePricePerKg`.
3. Create a `SupplierLedgerEntry` (type "purchase") and update `Supplier.totalPayable` if `paymentType = "credit"`. If cash, still log the ledger entry for history but net effect on payable is zero (record as purchase + immediate payment, or just skip payable increment — decide one convention and apply consistently, recommend: always log the purchase entry, and if cash, log a matching payment entry same timestamp so ledger reads clean).

### 3.5 Sale (both retail and wholesale flow through this table, differentiated by `channel`)
```
Sale {
  id
  channel                // "retail" | "wholesale"
  customerId              // nullable for retail walk-in without a saved customer
  invoiceNumber            // auto-generated, e.g. INV-0001 (single sequence, or separate sequences per channel — decide: recommend separate prefixes, RTL-0001 / WHS-0001, for easy visual distinction on printed invoices)
  paymentType               // "cash" | "credit"
  creditDays                // nullable — wholesale credit sales only in practice, but don't hard-block retail from having it
  dueDate
  status                     // "unpaid" | "partially_paid" | "paid"
  totalAmount
  paidAmount
  createdAt
}

SaleItem {
  id
  saleId
  itemId
  quantityGrams            // normalized — retail entries convert pao/adha-kilo/kilo to grams here
  quantityLabel              // human-readable original entry, e.g. "1 pao", "2.5 kg" — store for display even though quantityGrams is source of truth
  ratePerKg                  // rate actually used for this line (retail or wholesale rate, may be manually overridden)
  lineTotal
}
```
On Sale creation:
1. Decrement `Item.currentStock` by total `quantityGrams` per line. Block/warn if resulting stock would go negative (configurable — probably warn but allow override, since real shops oversell and true-up later).
2. If `customerId` present and `paymentType = "credit"`, create `CustomerLedgerEntry` (type "sale") and update `Customer.totalReceivable`.

### 3.6 Payment (settling credit — works for both supplier payables and customer receivables)
```
Payment {
  id
  direction               // "payable" (we pay supplier) | "receivable" (customer pays us)
  supplierId               // nullable
  customerId                // nullable
  purchaseId                 // nullable — optional link if payment is against a specific purchase
  saleId                      // nullable — optional link if payment is against a specific sale
  amount
  method                       // "cash" | "bank_transfer" | "easypaisa" | "jazzcash"
  note
  createdAt
}
```
On Payment creation: update the relevant `Purchase.paidAmount`/`status` or `Sale.paidAmount`/`status`, and append a ledger entry to `SupplierLedgerEntry` or `CustomerLedgerEntry`, recalculating `totalPayable`/`totalReceivable`.

---

## 4. Modules — UI/Flow Requirements

### 4.1 Retail Module
- **Fast daily-entry screen** — this is used many times a day, optimize for speed over completeness.
- Item picker (search/select), quantity entry with quick-tap presets: **1 Pao / Adha Kilo / 1 Kilo** buttons plus a free-text kg field for anything else.
- Default `paymentType = cash`. Allow switching to credit only if a known retail customer is selected (optional feature — most retail is cash, don't over-engineer this).
- One-tap "Complete Sale" → deducts stock, generates a lightweight receipt (not necessarily the full branded invoice — a simple thermal-print-style receipt is fine for retail, but should still be available in full invoice format on demand).
- Daily retail summary view: total sales today, item-wise breakdown, cash collected.

### 4.2 Wholesale Module
**Purchase side (buying from suppliers):**
- Select/create supplier.
- Multi-item purchase entry (like Huzaifa Traders' multi-item invoice pattern) — add multiple items with quantity (kg or bags) and rate per line.
- Cash or credit toggle. If credit, enter credit days → auto-calculate due date.
- On save: stock increases, supplier ledger updates if credit.
- Supplier ledger view: list of suppliers with outstanding payable, drill into individual supplier to see purchase history + payments, with overdue purchases visually flagged (past due date, unpaid).

**Sale side (selling to wholesale customers):**
- Select/create customer.
- Multi-item sale entry at wholesale rate (editable per line if a special rate was negotiated).
- Cash or credit toggle with credit days → due date.
- On save: stock decreases, customer ledger updates if credit.
- Customer ledger view: same pattern as supplier ledger — outstanding receivable per customer, overdue flags.

### 4.3 Unified Stock View
- Single inventory table: Item, current stock (displayed in kg, converted from grams), retail price, wholesale price, last purchase price, margin indicator (retail vs purchase, wholesale vs purchase), low-stock flag.
- Stock movement history per item (audit trail: every purchase and sale line that touched this item, chronological).

### 4.4 Invoice Generation
Applies to wholesale purchases (as a purchase record/GRN, optional to print) and to **all sales** (retail full-invoice-on-demand + all wholesale sales).

Invoice must include:
- Badar Natural Foods branding (wordmark styling per Section 1.1 — swap in logo file if/when supplied)
- **Owner name: Jahangeer Badar**
- **Business phone: +92 312 3546488**
- **Website: https://badarnatural.com/**
- Invoice number, date
- Customer name (if applicable) / "Walk-in" for anonymous retail
- Line items: item name, quantity (human label + kg), rate, line total
- Subtotal, total
- Payment status: Cash (paid in full) / Credit — due date, amount paid, amount outstanding
- Print-optimized layout (A4 and thermal-receipt-width variant if feasible — check what Huzaifa Traders' invoice component already supports and extend rather than rebuild)

---

## 5. Dashboard (home screen after login)

- Today's retail sales total + transaction count
- Today's wholesale sales total + transaction count
- Total payable (all suppliers combined) with count of overdue supplier balances
- Total receivable (all customers combined) with count of overdue customer balances
- Low stock items list (below threshold)
- Quick-action buttons: New Retail Sale / New Wholesale Purchase / New Wholesale Sale / Record Payment

---

## 6. Build Phases (execute in this order)

1. **Scaffold & strip.** Copy existing Hafeez Communication codebase into new folder. Remove all mobile-accessories-specific models/routes/components (IMEI, warranty, wallet module specifics if not reusable). Set up fresh `.env` with new `DATABASE_URL`.
2. **Prisma schema.** Implement all models from Section 3. Run migration against the new database.
3. **Core CRUD.** Item management, Supplier management, Customer management.
4. **Purchase flow.** Multi-item purchase entry, stock increment, supplier ledger logic, payment recording against purchases.
5. **Sale flow — wholesale.** Multi-item sale entry, stock decrement, customer ledger logic, payment recording against sales.
6. **Sale flow — retail.** Fast-entry screen with pao/adha-kilo/kilo presets, cash-default flow, lightweight receipt.
7. **Invoice component.** Unified invoice template (branded, owner info, print-ready) used by both retail (on-demand) and wholesale sales.
8. **Ledger views.** Supplier payable list + drill-down, customer receivable list + drill-down, overdue flagging.
9. **Dashboard.** Aggregate queries for today's numbers, low stock, payable/receivable summaries.
10. **Theme pass.** Apply final Badar Natural Foods branding once logo/colors are confirmed (placeholder palette until then).
11. **Auth.** Single admin login, protect all routes.

---

## 7. Phase 2 — Client-Requested Additions

The client (Jahangeer Badar) reviewed the working portal and requested the following additions. Grouped by area, with notes on what's net-new vs. extending existing models.

### 7.1 Billing additions
- **Barcode field on Item** (`barcode` string, nullable, unique) + scan-to-search: USB/Bluetooth barcode scanners act as HID keyboard input, so this is just an input field that captures the scanned string and auto-triggers item lookup on Enter — no external SDK needed. If a camera-based mobile scan option is wanted later, use `html5-qrcode` (in-house, no paid service).
- **Bilingual invoice** — make the Urdu/English dual-language layout from Section 1.1 explicit and mandatory on the invoice template, not just a stylistic note: item names, totals, and footer labels rendered in both English and Urdu (RTL block), matching the marketing site's convention.
- **Thank-you message** — add a configurable `thankYouMessage` field (settings table or hardcoded constant to start) printed at the bottom of every invoice.
- **Reprint invoice** — any past Sale record must have a "Reprint" action that re-renders the exact same invoice (same invoice number, same line items/totals as originally generated — do not regenerate from live item prices, snapshot the original values).
- **Cancel / Refund** — new `Sale.status` value `"cancelled"` and a refund flow:
  - Cancelling a sale reverses stock (`Item.currentStock` incremented back) and reverses any `CustomerLedgerEntry` created for that sale.
  - Log a `SaleCancellation` or reuse `CustomerLedgerEntry` (type `"refund"`) for audit trail — never hard-delete a Sale record, always soft-cancel so the invoice number and history stay intact.
  - Decide with client: full-sale cancel only, or line-item-level partial refund? Recommend starting with full-sale cancel (simpler, covers most real cases), add partial refund later if needed.

### 7.2 Customer management additions
- **Per-customer rate list**: new `CustomerItemRate { customerId, itemId, ratePerKg }` table. When building a wholesale Sale for a customer, check this table first for an override rate before falling back to `Item.wholesalePricePerKg`.
- **Standing discount**: add `discountPercent` (nullable) to `Customer`. Applied automatically at sale-line calculation if no item-specific override rate exists.
- **Credit limit**: add `creditLimit` (nullable, null = unlimited) to `Customer`. On credit sale creation, if `Customer.totalReceivable + newSaleAmount > creditLimit`, block or warn (decide with client which — recommend warn-with-override for a solo-owner-run shop, hard-block only if they explicitly want it enforced).

### 7.3 Reporting additions
New reports section (separate from the Dashboard's today-snapshot):
- **Monthly sales report** — retail + wholesale, filterable by date range, channel.
- **Profit report** — for a given period: revenue (sum of Sale totals) minus cost of goods sold (sum of `quantitySold × lastPurchasePricePerKg` at time of sale — this means `SaleItem` should also snapshot a `costPerKgAtSale` field at creation time so profit calc stays accurate even if purchase price changes later).
- **Best-selling / least-selling items** — ranked by quantity sold or revenue, filterable by period.
- **Cash report** — all `paymentType = "cash"` transactions (purchases and sales) in a period, net cash position.
- **Credit report** — consolidated view of all outstanding payables (suppliers) and receivables (customers), overdue-first sorting, exportable (CSV at minimum, PDF if time allows).

### 7.4 Bill sharing — Download & Share-as-PDF (no API, no automation)

Dropped: full WhatsApp Business Cloud API integration (Meta verification, message templates, scheduled reminders/offers) — not needed for now.

**Important platform constraint:** a `wa.me` link can only pre-fill *text* into a WhatsApp chat — it cannot attach a file. There is no way to make a plain link open WhatsApp with a PDF already attached; that capability only exists via the Meta Business Cloud API (explicitly out of scope here). So "share the actual invoice PDF" requires a different mechanism:

- Every completed Sale auto-generates its invoice immediately (no manual "generate" step) using the bilingual template from Section 7.1.
- Invoice view/print page gets two buttons:
  - **Download** — exports the invoice as PDF (reuse whatever PDF approach is already in the codebase from Huzaifa Traders/Hafeez Communication).
  - **Share** — implemented with the **Web Share API Level 2** (`navigator.share({ files: [pdfFile], text, title })`):
    - **On mobile (Android/iOS browsers):** this opens the device's native share sheet with the actual PDF file attached. WhatsApp appears as one of the share targets — tapping it opens that chat with the PDF already attached, owner just picks the contact and hits send. This is the primary flow and should be the one the owner mainly uses, since a kiryana shop owner is realistically doing this from a phone.
    - **On desktop browsers:** `navigator.share` with files has inconsistent/no support. Fallback: trigger the PDF download AND open a `wa.me/<number>` chat (pre-filled with a short text like "Invoice INV-0001 attached, please check your downloads") in a new tab. Owner manually drags/attaches the just-downloaded PDF into the WhatsApp Web chat. Note in the UI near the Share button on desktop that the PDF was downloaded and needs to be attached manually.
    - Feature-detect `navigator.canShare({ files: [...] })` before showing the "native share" path vs. the desktop fallback path — don't assume by device type, check actual browser capability.
- This is a **manual send either way** — no message is transmitted without the owner explicitly tapping/clicking send inside WhatsApp itself. No Meta Business API, no template approval, no per-message cost, no cron job.
- Phone number source: for wholesale, use `Customer.phone`. For retail (walk-in, no saved customer), require a phone number entry field on the sale screen if Share is going to be used — otherwise Share button should be disabled/hidden when no number is available.

---

## 8. Additional Client Requirements — Round 2 (post-demo)

Client reviewed the working demo (screens confirmed: login, dashboard, stock, purchases, suppliers, wholesale/retail sale, invoice, customer ledger, customer portal, settings — all matching spec). Two additions requested.

### 8.1 Mandatory Urdu Nastaleeq tagline on every invoice

Add a fixed line, in Urdu Nastaleeq script, below the existing footer/thank-you area on **every invoice** (retail and wholesale both):

> گندم کا تازہ آٹا، جؤ کا آٹا، چاول کا آٹا، ملٹی گرین آٹا، بہترین چاول، دالیں، خالص مصالحہ جات اور گروسری کا مکمل سامان دستیاب ہے

**Font requirement:** must render in a true Nastaleeq style, not a generic Naskh/sans Arabic font. Use **Noto Nastaliq Urdu** (Google Fonts, free, `@font-family: 'Noto Nastaliq Urdu'`) — load via `next/font/google` or a self-hosted `@font-face` with the woff2 file bundled in `/public/fonts`, don't rely on a CDN link that might not load at PDF-generation time.

**Critical rendering check before implementing:** determine what actually produces the invoice PDF in the existing codebase (carried over from Huzaifa Traders/Hafeez Communication):
- If it's **browser-native print-to-PDF** (`window.print()` / `@media print` CSS, or a headless-browser screenshot like Puppeteer) — Nastaleeq will render correctly because the browser's own text shaping engine handles Arabic/Urdu ligatures properly. This is the safe path.
- If it's a **canvas/vector PDF library** (e.g. `@react-pdf/renderer`, `pdf-lib` manual text placement) — these do NOT do complex script shaping (no ligature joining), and Urdu Nastaleeq text will render as disconnected, visually broken letters. If this is the current approach, it needs to switch to a Puppeteer-based (or similar browser-rendering) PDF pipeline for this feature to actually work — flag this to the client as a possible implementation change, don't silently ship broken Urdu text.

**Placement:** centered, RTL direction (`dir="rtl"`), below the "Shukriya" line, above the invoice footer/branding strip. Font size should be readable but clearly secondary to the main invoice content (recommend ~11-13px equivalent print size).

### 8.2 Item names inside boxed cells

On the invoice line-items table, item names (and ideally each column — item, qty, rate, amount) should be visually boxed — i.e. bordered table cells, not just underline/whitespace-separated rows. Add `border: 1px solid` (in the brand's dark-brown tone from Section 1.1, not pure black) to each `<td>`/`<th>` in the invoice items table, consistent with a traditional printed-invoice look.

### 8.3 Barcode scanner — full stock-in and sale integration

Extends the barcode field already scoped in Section 7.1 (which only covered search) into full workflow support. USB/Bluetooth barcode scanners behave as HID keyboard-emulation devices — no SDK or special driver integration needed, just a text input that captures rapid keystrokes ending in `Enter` and triggers a lookup. Build one shared `BarcodeInput` component and reuse it in every entry flow below, rather than duplicating scan-handling logic per page.

**Item model addition:**
```
Item {
  ...
  barcode              String? @unique   // already scoped in 7.1
  defaultPackWeightGrams  Int?           // optional — for pre-packaged items with a fixed size (e.g. 1kg honey jar), lets a scan auto-fill quantity. Null for loose bulk items (atta/rice sold by variable weight) where quantity must still be entered manually even after a barcode match.
}
```

**Stock-in (Purchase entry):**
- Add a barcode-scan input at the top of the purchase-line form. On scan match, auto-select that item in the item dropdown for the current line (owner still enters quantity/rate as normal — purchase quantities are bulk/bag-based and won't auto-fill from `defaultPackWeightGrams`, that field is retail-sale-specific).
- If the scanned barcode doesn't match any existing item, prompt: "No item found for this barcode — add as new item?" and pre-fill the barcode field on the New Item form, dropping the owner straight into item creation with barcode already captured.

**Sale entry (both Retail and Wholesale):**
- Barcode-scan input at the top of the sale screen, always visible alongside the manual item-search dropdown (not a replacement — both paths coexist, per the client's explicit ask that manual entry is a fallback for items without a barcode).
- On scan match:
  - If `defaultPackWeightGrams` is set on that item, add it to the cart/line immediately with that quantity pre-filled (owner can still edit before completing sale).
  - If `defaultPackWeightGrams` is null (loose bulk item), add it to the cart but leave quantity empty/focused for immediate manual entry (weight is decided at the counter, barcode only identifies the item).
- If no match found, show an inline message ("Barcode not recognized — search manually below") and keep focus on the manual item-search field — don't block or error out the sale flow.
- After every successful scan-add, the barcode input should auto-clear and stay focused, so the owner can keep scanning the next item back-to-back without touching the mouse — this is the actual speed benefit of barcode support, don't make them re-click into the field each time.

**Manual fallback (already true by default):** the existing item-search dropdown from Sections 4.1/4.2 remains fully functional for any item without a barcode — barcode is purely additive, never a required path.

---

## 9. Open Items (confirm before/while building)

- Standalone logo file (icon/logomark) — not currently in use on the marketing site (wordmark-only). Build portal header with wordmark styling for now; swap in a logomark later if supplied.
- Bag-weight conventions per item for wholesale purchases (does bag size vary by supplier or is it fixed per item?) — confirm with Ahmed/client before building the bag-to-kg conversion UI.
- Whether retail sales should ever support credit for known regulars, or strictly cash-only — spec above allows it optionally; confirm if this is actually needed or should be removed to simplify.
- Cancel/refund: full-sale-only or line-item partial refund (Section 7.1)?
- Credit limit breach: hard-block the sale or warn-and-allow-override (Section 7.2)?
- Share button pre-filled text (mobile native-share path includes this alongside the attached PDF; desktop fallback uses it as the wa.me message before manual attach): confirm exact wording client wants, e.g. "Assalam-o-Alaikum, aap ka invoice attached hai. Shukriya — Badar Natural Foods" (Section 7.4).
- **Critical, check before building 8.1**: what does the current invoice PDF generation actually use (browser print vs. a canvas-based PDF library)? This determines whether the Nastaleeq tagline will render correctly or needs a pipeline change (Section 8.1).
- Which items are pre-packaged with a fixed size (get `defaultPackWeightGrams`) vs. sold loose by variable weight (barcode identifies item only, quantity stays manual) — needs a pass through the item list with the client (Section 8.3).
