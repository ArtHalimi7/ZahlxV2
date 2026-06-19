import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    emri_biznesit VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'worker') NOT NULL DEFAULT 'owner',
    parent_user_id INT UNSIGNED DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_parent FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    emri VARCHAR(200) NOT NULL,
    kodi_bar VARCHAR(100) NOT NULL UNIQUE,
    cmimi_blerjes DECIMAL(12,2) NOT NULL DEFAULT 0,
    cmimi_shitjes DECIMAL(12,2) NOT NULL DEFAULT 0,
    stoku_aktual INT NOT NULL DEFAULT 0,
    kategoria VARCHAR(100) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE INDEX idx_products_user ON products(user_id)`,
  `CREATE INDEX idx_products_barcode ON products(kodi_bar)`,
  `CREATE TABLE IF NOT EXISTS invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    numri_fatures VARCHAR(50) NOT NULL UNIQUE,
    klienti VARCHAR(200) NOT NULL DEFAULT 'Klient i përgjithshëm',
    klient_email VARCHAR(200) DEFAULT NULL,
    klient_telefoni VARCHAR(100) DEFAULT NULL,
    klient_adresa TEXT DEFAULT NULL,
    data_krijimit DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    totali DECIMAL(12,2) NOT NULL DEFAULT 0,
    statusi ENUM('paguar', 'ne_pritje', 'anuluar') NOT NULL DEFAULT 'paguar',
    CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE INDEX idx_invoices_user ON invoices(user_id)`,
  `CREATE INDEX idx_invoices_date ON invoices(data_krijimit)`,
  `CREATE INDEX idx_invoices_status ON invoices(statusi)`,
  `CREATE TABLE IF NOT EXISTS invoice_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    sasia INT NOT NULL DEFAULT 1,
    cmimi_per_njesi DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id)`,
  `CREATE INDEX idx_invoice_items_product ON invoice_items(product_id)`,
  `CREATE TABLE IF NOT EXISTS financial_ledger (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    invoice_id INT UNSIGNED DEFAULT NULL,
    purchase_id INT UNSIGNED DEFAULT NULL,
    data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pershkrimi TEXT,
    llogaria VARCHAR(100) NOT NULL,
    debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    kredit DECIMAL(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ledger_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    CONSTRAINT fk_ledger_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE INDEX idx_ledger_user ON financial_ledger(user_id)`,
  `CREATE INDEX idx_ledger_date ON financial_ledger(data)`,
  `CREATE INDEX idx_ledger_account ON financial_ledger(llogaria)`,
  `CREATE INDEX idx_ledger_invoice ON financial_ledger(invoice_id)`,
  `CREATE TABLE IF NOT EXISTS offers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    numri_ofertes VARCHAR(50) NOT NULL UNIQUE,
    klienti VARCHAR(200) NOT NULL DEFAULT 'Klient i përgjithshëm',
    email_klientit VARCHAR(200) DEFAULT NULL,
    data_krijimit DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_skadimit DATETIME DEFAULT NULL,
    totali DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    statusi ENUM('draft', 'derguar', 'pranuar', 'refuzuar', 'skaduar') NOT NULL DEFAULT 'draft',
    shenime TEXT DEFAULT NULL,
    CONSTRAINT fk_offers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE INDEX idx_offers_user ON offers(user_id)`,
  `CREATE INDEX idx_offers_date ON offers(data_krijimit)`,
  `CREATE INDEX idx_offers_status ON offers(statusi)`,
  `CREATE TABLE IF NOT EXISTS offer_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    offer_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    sasia INT NOT NULL DEFAULT 1,
    cmimi_per_njesi DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_offer_items_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE INDEX idx_offer_items_offer ON offer_items(offer_id)`,
  `CREATE INDEX idx_offer_items_product ON offer_items(product_id)`,
  `CREATE TABLE IF NOT EXISTS counters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    counter INT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE INDEX idx_counters_key (user_id, prefix, date),
    CONSTRAINT fk_counters_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    numri_blerjes VARCHAR(50) NOT NULL,
    furnitori VARCHAR(200) NOT NULL,
    data_blerjes DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    totali DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    statusi ENUM('paguar', 'ne_pritje', 'anuluar') NOT NULL DEFAULT 'paguar',
    source_invoice_secure_code VARCHAR(64) DEFAULT NULL,
    source_invoice_numri VARCHAR(50) DEFAULT NULL,
    shenime TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX uq_purchase_per_user (user_id, numri_blerjes),
    CONSTRAINT fk_purchases_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS purchase_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT UNSIGNED NOT NULL,
    emri VARCHAR(200) NOT NULL,
    kodi_bar VARCHAR(100) DEFAULT NULL,
    sasia DECIMAL(12,2) NOT NULL DEFAULT 1.00,
    cmimi_per_njesi DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_purchase_items_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

const ensureOwner = async () => {
  const [users] = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');

  if (users.length > 0) {
    return users[0].id;
  }

  const businessName = process.env.DEFAULT_BUSINESS_NAME || 'Zahlx Business';
  const businessEmail = process.env.DEFAULT_BUSINESS_EMAIL || 'owner@zahlx.local';
  const hashedDefault = await bcrypt.hash('bootstrap', 10);

  const [result] = await pool.query(
    `INSERT INTO users (emri_biznesit, email, password_hash, role)
     VALUES (?, ?, ?, 'owner')`,
    [businessName, businessEmail, hashedDefault]
  );

  return result.insertId;
};

export const initDatabase = async ({ closePool = true } = {}) => {
  try {
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (error) {
        if (
          error?.code === 'ER_DUP_KEYNAME' ||
          (error?.message && error.message.includes('already exists'))
        ) {
          continue;
        }

        throw error;
      }
    }

    // Run schema migrations for new invoice columns
    const columnsToMigrate = [
      { name: 'tax_rate', type: 'DECIMAL(5,2) DEFAULT 0' },
      { name: 'tax_amount', type: 'DECIMAL(12,2) DEFAULT 0' },
      { name: 'due_date', type: 'DATETIME DEFAULT NULL' },
      { name: 'seller_id', type: 'INT UNSIGNED DEFAULT NULL' },
      { name: 'secure_code', type: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'klient_email', type: 'VARCHAR(200) DEFAULT NULL' },
      { name: 'klient_telefoni', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'klient_adresa', type: 'TEXT DEFAULT NULL' }
    ];

    // Backfill secure_code for existing invoices that don't have one
    try {
      await pool.query(`UPDATE invoices SET secure_code = UUID() WHERE secure_code IS NULL`);
      console.log('✓ Backfilled secure_code for existing invoices');
    } catch (err) {
      console.warn('Migration warning backfilling secure_code:', err.message || err);
    }

    for (const col of columnsToMigrate) {
      try {
        await pool.query(`ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✓ Added column ${col.name} to invoices table`);
      } catch (err) {
        if (
          err.code === 'ER_DUP_FIELDNAME' ||
          err.errno === 1060 ||
          (err.message && err.message.includes('duplicate column')) ||
          (err.message && err.message.includes('already exists'))
        ) {
          // Column already exists
        } else {
          console.warn(`Migration notice for column ${col.name}:`, err.message || err);
        }
      }
    }

    try {
      await pool.query(`
        ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_seller
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key constraint fk_invoices_seller to invoices table');
    } catch (err) {
      // Ignore if constraint already exists
    }

    const ledgerColumnsToMigrate = [
      { name: 'purchase_id', type: 'INT UNSIGNED DEFAULT NULL' }
    ];

    for (const col of ledgerColumnsToMigrate) {
      try {
        await pool.query(`ALTER TABLE financial_ledger ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✓ Added column ${col.name} to financial_ledger table`);
      } catch (err) {
        if (
          err.code === 'ER_DUP_FIELDNAME' ||
          err.errno === 1060 ||
          (err.message && err.message.includes('duplicate column')) ||
          (err.message && err.message.includes('already exists'))
        ) {
          // Column already exists
        } else {
          console.warn(`Migration notice for financial_ledger column ${col.name}:`, err.message || err);
        }
      }
    }

    try {
      await pool.query(`
        ALTER TABLE financial_ledger
        ADD CONSTRAINT fk_ledger_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key constraint fk_ledger_purchase to financial_ledger table');
    } catch (err) {
      // Ignore if constraint already exists
    }

    // Backfill due_date with data_krijimit for existing invoices
    try {
      await pool.query(`UPDATE invoices SET due_date = data_krijimit WHERE due_date IS NULL`);
    } catch (err) {
      console.warn('Migration warning backfilling due_date:', err.message || err);
    }

    // Run schema migrations for new users columns
    const userColumnsToMigrate = [
      { name: 'role', type: "ENUM('owner', 'worker') NOT NULL DEFAULT 'owner'" },
      { name: 'parent_user_id', type: 'INT UNSIGNED DEFAULT NULL' }
    ];

    for (const col of userColumnsToMigrate) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✓ Added column ${col.name} to users table`);
      } catch (err) {
        if (
          err.code === 'ER_DUP_FIELDNAME' ||
          err.errno === 1060 ||
          (err.message && err.message.includes('duplicate column')) ||
          (err.message && err.message.includes('already exists'))
        ) {
          // Column already exists
        } else {
          console.warn(`Migration notice for users column ${col.name}:`, err.message || err);
        }
      }
    }

    try {
      await pool.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_users_parent
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('✓ Added foreign key constraint fk_users_parent to users table');
    } catch (err) {
      // Ignore if constraint already exists
    }

    // Migrate: drop global UNIQUE on invoices.numri_fatures, add per-tenant UNIQUE
    try {
      await pool.query(`ALTER TABLE invoices DROP INDEX numri_fatures`);
      console.log('✓ Dropped global UNIQUE on invoices.numri_fatures');
    } catch (err) {
      if (!err.message?.includes('check that column/key exists') && !err.message?.includes("can't drop")) {
        console.warn('Migration notice dropping invoices index:', err.message || err);
      }
    }
    try {
      await pool.query(`ALTER TABLE invoices ADD UNIQUE INDEX uq_invoice_per_user (user_id, numri_fatures)`);
      console.log('✓ Added per-tenant UNIQUE (user_id, numri_fatures) on invoices');
    } catch (err) {
      if (!err.message?.includes('duplicate key') && !err.message?.includes('already exists')) {
        console.warn('Migration notice adding invoices unique:', err.message || err);
      }
    }
    try {
      await pool.query(`CREATE INDEX idx_invoices_secure_code ON invoices(secure_code)`);
      console.log('✓ Added index on invoices.secure_code');
    } catch (err) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate key name')) {
        console.warn('Migration notice adding secure_code index:', err.message || err);
      }
    }

    // Migrate: drop global UNIQUE on offers.numri_ofertes, add per-tenant UNIQUE
    try {
      await pool.query(`ALTER TABLE offers DROP INDEX numri_ofertes`);
      console.log('✓ Dropped global UNIQUE on offers.numri_ofertes');
    } catch (err) {
      if (!err.message?.includes('check that column/key exists') && !err.message?.includes("can't drop")) {
        console.warn('Migration notice dropping offers index:', err.message || err);
      }
    }
    try {
      await pool.query(`ALTER TABLE offers ADD UNIQUE INDEX uq_offer_per_user (user_id, numri_ofertes)`);
      console.log('✓ Added per-tenant UNIQUE (user_id, numri_ofertes) on offers');
    } catch (err) {
      if (!err.message?.includes('duplicate key') && !err.message?.includes('already exists')) {
        console.warn('Migration notice adding offers unique:', err.message || err);
      }
    }

    // Seed counters with existing data so new sequence numbers don't collide
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
    try {
      await pool.query(`
        INSERT INTO counters (user_id, prefix, date, counter)
        SELECT user_id, 'BLR', DATE(data_blerjes), COUNT(*)
        FROM purchases
        GROUP BY user_id, DATE(data_blerjes)
        ON DUPLICATE KEY UPDATE counter = VALUES(counter)
      `);
      console.log('✓ Seeded BLR counters from existing purchases');
    } catch (err) {
      console.warn('Migration warning seeding BLR counters:', err.message || err);
    }

    const ownerId = await ensureOwner();
    const hashedDefault = await bcrypt.hash('bootstrap', 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE password_hash = 'bootstrap'", [hashedDefault]);

    console.log('✓ Database schema is ready');
    console.log(`✓ Owner user available with id ${ownerId}`);
  } catch (error) {
    console.error('Database initialization failed:', error?.stack || error?.message || error);
    process.exitCode = 1;
    throw error;
  } finally {
    if (closePool) {
      await pool.end();
    }
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await initDatabase();
}
