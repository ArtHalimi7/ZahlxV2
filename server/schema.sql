-- ============================================================
-- ZAHLX — MySQL Database Schema
-- Idempotent DDL for the live inventory, sales, and ledger system.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    emri_biznesit VARCHAR(200) NOT NULL,
    email         VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    emri            VARCHAR(200) NOT NULL,
    kodi_bar        VARCHAR(100) NOT NULL UNIQUE,
    cmimi_blerjes   DECIMAL(12,2) NOT NULL DEFAULT 0,
    cmimi_shitjes   DECIMAL(12,2) NOT NULL DEFAULT 0,
    stoku_aktual    INT NOT NULL DEFAULT 0,
    kategoria       VARCHAR(100) DEFAULT NULL,
    image_url       VARCHAR(500) DEFAULT NULL,
    tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_products_barcode ON products(kodi_bar);

CREATE TABLE IF NOT EXISTS invoices (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED NOT NULL,
    numri_fatures  VARCHAR(50) NOT NULL UNIQUE,
    klienti        VARCHAR(200) NOT NULL DEFAULT 'Klient i përgjithshëm',
    data_krijimit  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    totali         DECIMAL(12,2) NOT NULL DEFAULT 0,
    statusi        ENUM('paguar', 'ne_pritje', 'anuluar') NOT NULL DEFAULT 'paguar',
    CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_date ON invoices(data_krijimit);
CREATE INDEX idx_invoices_status ON invoices(statusi);

CREATE TABLE IF NOT EXISTS invoice_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id      INT UNSIGNED NOT NULL,
    product_id      INT UNSIGNED NOT NULL,
    sasia           INT NOT NULL DEFAULT 1,
    cmimi_per_njesi DECIMAL(12,2) NOT NULL,
    tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

CREATE TABLE IF NOT EXISTS financial_ledger (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    invoice_id  INT UNSIGNED DEFAULT NULL,
    data        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pershkrimi  TEXT,
    llogaria    VARCHAR(100) NOT NULL,
    debit       DECIMAL(12,2) NOT NULL DEFAULT 0,
    kredit      DECIMAL(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ledger_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ledger_user ON financial_ledger(user_id);
CREATE INDEX idx_ledger_date ON financial_ledger(data);
CREATE INDEX idx_ledger_account ON financial_ledger(llogaria);
CREATE INDEX idx_ledger_invoice ON financial_ledger(invoice_id);

CREATE TABLE IF NOT EXISTS offers (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED NOT NULL,
    numri_ofertes  VARCHAR(50) NOT NULL UNIQUE,
    klienti        VARCHAR(200) NOT NULL DEFAULT 'Klient i përgjithshëm',
    email_klientit VARCHAR(200) DEFAULT NULL,
    data_krijimit  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_skadimit  DATETIME DEFAULT NULL,
    totali         DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate       DECIMAL(5,2) DEFAULT 0,
    tax_amount     DECIMAL(12,2) DEFAULT 0,
    statusi        ENUM('draft', 'derguar', 'pranuar', 'refuzuar', 'skaduar') NOT NULL DEFAULT 'draft',
    shenime        TEXT DEFAULT NULL,
    CONSTRAINT fk_offers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_offers_user ON offers(user_id);
CREATE INDEX idx_offers_date ON offers(data_krijimit);
CREATE INDEX idx_offers_status ON offers(statusi);

CREATE TABLE IF NOT EXISTS offer_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    offer_id        INT UNSIGNED NOT NULL,
    product_id      INT UNSIGNED NOT NULL,
    sasia           INT NOT NULL DEFAULT 1,
    cmimi_per_njesi DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_offer_items_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_offer_items_offer ON offer_items(offer_id);
CREATE INDEX idx_offer_items_product ON offer_items(product_id);
