# Fix: Invoice/Offer Number Duplicate

## Problem

`numri_fatures` has a **global** `UNIQUE` constraint, but the sequence number is generated counting per-user (`WHERE user_id = ?`). Two different tenants on the same day both get the same count (e.g., 0) and generate the same invoice number like `FAT-20260619-0001`. The second insert hits the global UNIQUE violation.

Same bug exists for `numri_ofertes` in offers.

Three underlying issues:
1. **Cross-tenant collision** — UNIQUE is global instead of per-tenant
2. **Race condition** — `SELECT COUNT(*)` then `INSERT` is not atomic
3. **Same pattern in 3 places** — `/api/sales`, `/api/offers`, offer-to-invoice conversion

## Files to Modify

### 1. `server/init-db.js`

#### A. Add `counters` table to `statements` array (after line 103)

Insert this after `CREATE INDEX idx_offer_items_product`:

```js
`CREATE TABLE IF NOT EXISTS counters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  prefix VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  counter INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE INDEX idx_counters_key (user_id, prefix, date),
  CONSTRAINT fk_counters_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
```

#### B. Add schema migrations after existing ones (after line 220, before `const ownerId`)

```js
// Migrate: drop global UNIQUE on invoices.numri_fatures, add per-tenant UNIQUE
try {
  await pool.query(`ALTER TABLE invoices DROP INDEX numri_fatures`);
  console.log('✓ Dropped global UNIQUE on invoices.numri_fatures');
} catch (err) {
  if (!err.message?.includes('check that column/key exists') && !err.message?.includes('can\'t drop')) {
    console.warn('Migration notice dropping index:', err.message || err);
  }
}
try {
  await pool.query(`ALTER TABLE invoices ADD UNIQUE INDEX uq_invoice_per_user (user_id, numri_fatures)`);
  console.log('✓ Added per-tenant UNIQUE (user_id, numri_fatures) on invoices');
} catch (err) {
  if (!err.message?.includes('duplicate key') && !err.message?.includes('already exists')) {
    console.warn('Migration notice adding unique:', err.message || err);
  }
}

// Migrate: drop global UNIQUE on offers.numri_ofertes, add per-tenant UNIQUE
try {
  await pool.query(`ALTER TABLE offers DROP INDEX numri_ofertes`);
  console.log('✓ Dropped global UNIQUE on offers.numri_ofertes');
} catch (err) {
  if (!err.message?.includes('check that column/key exists') && !err.message?.includes('can\'t drop')) {
    console.warn('Migration notice dropping index:', err.message || err);
  }
}
try {
  await pool.query(`ALTER TABLE offers ADD UNIQUE INDEX uq_offer_per_user (user_id, numri_ofertes)`);
  console.log('✓ Added per-tenant UNIQUE (user_id, numri_ofertes) on offers');
} catch (err) {
  if (!err.message?.includes('duplicate key') && !err.message?.includes('already exists')) {
    console.warn('Migration notice adding unique:', err.message || err);
  }
}

// Seed counters with existing data
try {
  await pool.query(`
    INSERT INTO counters (user_id, prefix, date, counter)
    SELECT user_id, 'FAT', DATE(data_krijimit), COUNT(*)
    FROM invoices
    GROUP BY user_id, DATE(data_krijimit)
    ON DUPLICATE KEY UPDATE counter = VALUES(counter)
  `);
  console.log('✓ Seeded FAT counters from existing invoices');
} catch (err) {
  console.warn('Migration warning seeding FAT counters:', err.message || err);
}
try {
  await pool.query(`
    INSERT INTO counters (user_id, prefix, date, counter)
    SELECT user_id, 'OFR', DATE(data_krijimit), COUNT(*)
    FROM offers
    GROUP BY user_id, DATE(data_krijimit)
    ON DUPLICATE KEY UPDATE counter = VALUES(counter)
  `);
  console.log('✓ Seeded OFR counters from existing offers');
} catch (err) {
  console.warn('Migration warning seeding OFR counters:', err.message || err);
}
```

---

### 2. `server/server.js` — 3 locations

All 3 locations follow the same pattern. **Before** they use:

```js
const [countRows] = await client.query(
  `SELECT COUNT(*) AS c
   FROM invoices
   WHERE DATE(data_krijimit) = CURDATE() AND user_id = ?`,
  [ownerId]
);
const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const seqNum = String(Number(countRows[0].c) + 1).padStart(4, '0');
```

**After** all 3 locations should use the atomic counter:

```js
const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
await client.query(
  `INSERT INTO counters (user_id, prefix, date, counter)
   VALUES (?, 'FAT', CURDATE(), LAST_INSERT_ID(1))
   ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)`,
  [ownerId]
);
const [seqRow] = await client.query(`SELECT LAST_INSERT_ID() AS seq`);
const seqNum = String(seqRow[0].seq).padStart(4, '0');
```

#### Location 1: `POST /api/sales` — around line 668

Replace lines 668-676.

#### Location 2: `POST /api/offers` — around line 1592

Replace lines 1592-1600. Use prefix `'OFR'` instead of `'FAT'`.

#### Location 3: Offer-to-invoice — around line 1721

Replace lines 1721-1729. Use prefix `'FAT'` (converting an offer to an invoice still creates an invoice number).

---

## How to Apply

1. Make the 5 edits above (2 additions to `init-db.js`, 3 replacements in `server.js`)
2. Restart the backend server
3. The `initDatabase()` function will run on startup and apply the schema migrations + seed counters

## Verification

- Open the backend logs — look for:
  - `✓ Added per-tenant UNIQUE (user_id, numri_fatures) on invoices`
  - `✓ Seeded FAT counters from existing invoices`
- Try creating a sale — should no longer get `Duplicate entry` error
- Try creating multiple sales in rapid succession — each should get a unique sequential number
