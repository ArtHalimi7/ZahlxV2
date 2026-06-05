-- ============================================================
-- ZAHLX — Database Schema (PostgreSQL)
-- Double-entry bookkeeping for small businesses in Kosovo
-- All monetary values use NUMERIC(12,2) for financial precision
-- ============================================================

-- ▸ Business accounts
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    emri_biznesit   VARCHAR(200)    NOT NULL,
    email           VARCHAR(200)    UNIQUE NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ▸ Product catalog
CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emri            VARCHAR(200)    NOT NULL,
    kodi_bar        VARCHAR(100)    UNIQUE,
    cmimi_blerjes   NUMERIC(12,2)  NOT NULL DEFAULT 0,    -- Purchase price
    cmimi_shitjes   NUMERIC(12,2)  NOT NULL DEFAULT 0,    -- Selling price
    stoku_aktual    INTEGER         NOT NULL DEFAULT 0,    -- Current stock quantity
    kategoria       VARCHAR(100),
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX idx_products_user    ON products(user_id);
CREATE INDEX idx_products_barcode ON products(kodi_bar);

-- ▸ Sales invoices
CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    numri_fatures   VARCHAR(50)     NOT NULL UNIQUE,       -- Invoice number (e.g. FAT-20260001)
    klienti         VARCHAR(200)    DEFAULT 'Klient i përgjithshëm',
    data_krijimit   TIMESTAMPTZ     DEFAULT NOW(),
    totali          NUMERIC(12,2)  NOT NULL DEFAULT 0,
    statusi         VARCHAR(20)     NOT NULL DEFAULT 'paguar'
                    CHECK (statusi IN ('paguar', 'ne_pritje', 'anuluar'))
);

CREATE INDEX idx_invoices_user   ON invoices(user_id);
CREATE INDEX idx_invoices_date   ON invoices(data_krijimit);
CREATE INDEX idx_invoices_status ON invoices(statusi);

-- ▸ Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
    id              SERIAL PRIMARY KEY,
    invoice_id      INTEGER         NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id      INTEGER         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    sasia           INTEGER         NOT NULL DEFAULT 1,    -- Quantity sold
    cmimi_per_njesi NUMERIC(12,2)  NOT NULL                -- Unit price at time of sale
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- ▸ Financial ledger (double-entry bookkeeping)
-- Every financial event creates TWO rows: one debit, one credit.
-- The sum of all debits must always equal the sum of all credits.
CREATE TABLE IF NOT EXISTS financial_ledger (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id      INTEGER         REFERENCES invoices(id) ON DELETE SET NULL,
    data            TIMESTAMPTZ     DEFAULT NOW(),
    pershkrimi      TEXT,                                   -- Description of entry
    llogaria        VARCHAR(100)    NOT NULL,               -- Account name (e.g. 'Arka', 'Të hyrat nga shitjet')
    debit           NUMERIC(12,2)  NOT NULL DEFAULT 0,
    kredit          NUMERIC(12,2)  NOT NULL DEFAULT 0
);

CREATE INDEX idx_ledger_user    ON financial_ledger(user_id);
CREATE INDEX idx_ledger_date    ON financial_ledger(data);
CREATE INDEX idx_ledger_account ON financial_ledger(llogaria);
CREATE INDEX idx_ledger_invoice ON financial_ledger(invoice_id);
