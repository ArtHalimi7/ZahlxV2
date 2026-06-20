import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import pool from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:5173',
      'http://localhost:4173',
    ];
    if (allowed.includes(origin)) return callback(null, true);
    if (/^https:\/\/[a-zA-Z0-9.-]+\.netlify\.app$/.test(origin)) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Static file serving for product images
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer configuration for product image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Vetëm imazhe janë të lejuara (jpg, png, gif, webp, svg)'));
    }
  },
});

// Ensure offers and offer_items tables exist at server start
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offer_items (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          offer_id INT UNSIGNED NOT NULL,
          product_id INT UNSIGNED NOT NULL,
          sasia INT NOT NULL DEFAULT 1,
          cmimi_per_njesi DECIMAL(12,2) NOT NULL,
          CONSTRAINT fk_offer_items_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
          CONSTRAINT fk_offer_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Offers tables verified/created');
  } catch (err) {
    console.error('Error creating offers tables:', err.message || err);
  }

  // Add image_url column to products if it doesn't exist
  try {
    await pool.query(`
      ALTER TABLE products ADD COLUMN image_url VARCHAR(500) DEFAULT NULL
    `);
    console.log('✓ Added image_url column to products');
  } catch (err) {
    // Column likely already exists — ignore
    if (!err.message?.includes('Duplicate column')) {
      // Only log if it's not the expected "column already exists" error
    }
  }

  // Ensure clients table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          emri VARCHAR(200) NOT NULL,
          email VARCHAR(200) DEFAULT NULL,
          telefoni VARCHAR(50) DEFAULT NULL,
          adresa VARCHAR(500) DEFAULT NULL,
          shenime TEXT DEFAULT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`CREATE INDEX idx_clients_user ON clients(user_id)`);
    console.log('✓ Clients table verified/created');
  } catch (err) {
    if (!err.message?.includes('Duplicate key name')) {
      // Only log if it's not the expected "index already exists" error
    }
  }
})();

const JWT_SECRET = process.env.JWT_SECRET || 'zahlx-super-secret-key-12345';

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Ju lutem identifikohuni' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      res.clearCookie('token');
      return res.status(403).json({ error: 'Sesion i skaduar ose i pavlefshëm' });
    }
    req.user = decodedUser;
    next();
  });
};

const getTenantId = (req) => {
  return req.user.role === 'worker' ? req.user.parent_user_id : req.user.id;
};

// ================================================================
// AUTHENTICATION & STAFF APIS
// ================================================================

// Signup Owner
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { emri_biznesit, email, password } = req.body;
    if (!emri_biznesit || !email || !password) {
      return res.status(400).json({ error: 'Plotësoni të gjitha fushat e detyrueshme' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Kjo adresë email është e regjistruar tashmë' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (emri_biznesit, email, password_hash, role)
       VALUES (?, ?, ?, 'owner')`,
      [emri_biznesit, email, passwordHash]
    );

    const user = { id: result.insertId, email, emri_biznesit, role: 'owner', parent_user_id: null };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Gabim serveri gjatë regjistrimit' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dhe fjalëkalimi janë të detyrueshme' });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.emri_biznesit, u.email, u.password_hash, u.role, u.parent_user_id, p.emri_biznesit AS parent_emri_biznesit
       FROM users u
       LEFT JOIN users p ON p.id = u.parent_user_id
       WHERE u.email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ose fjalëkalim i pasaktë' });
    }

    const dbUser = rows[0];
    const passwordMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ose fjalëkalim i pasaktë' });
    }

    const emriBiznesit = dbUser.role === 'worker' ? dbUser.parent_emri_biznesit : dbUser.emri_biznesit;
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      emri_biznesit: emriBiznesit,
      role: dbUser.role,
      parent_user_id: dbUser.parent_user_id
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json(user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Gabim serveri gjatë hyrjes' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Doli me sukses' });
});

// Get profile
app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Jo i kyçur' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Sesion i skaduar' });
    }
    res.json(decodedUser);
  });
});

// List cashiers (Owner only)
app.get('/api/auth/workers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Nuk keni autorizim' });
    }

    const [rows] = await pool.query(
      `SELECT id, emri_biznesit AS emri, email, created_at
       FROM users
       WHERE role = 'worker' AND parent_user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('List workers error:', error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// Create cashier (Owner only)
app.post('/api/auth/workers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Nuk keni autorizim për të krijuar punëtorë' });
    }

    const { emri_punetorit, email, password } = req.body;
    if (!emri_punetorit || !email || !password) {
      return res.status(400).json({ error: 'Plotësoni të gjitha fushat e detyrueshme' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Kjo adresë email është e regjistruar tashmë' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (emri_biznesit, email, password_hash, role, parent_user_id)
       VALUES (?, ?, ?, 'worker', ?)`,
      [emri_punetorit, email, passwordHash, req.user.id]
    );

    res.status(201).json({
      id: result.insertId,
      email,
      emri_biznesit: emri_punetorit,
      role: 'worker',
      parent_user_id: req.user.id
    });
  } catch (error) {
    console.error('Create worker error:', error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// Gate authentication middleware for all other API endpoints
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  authenticateToken(req, res, next);
});

// Product image upload endpoint
app.post('/api/upload-product-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Asnjë imazh nuk u ngarkua' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('POST /api/upload-product-image error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim gjatë ngarkimit të imazhit' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const ownerId = getTenantId(req);
    const isWorker = req.user.role === 'worker';
    const query = isWorker
      ? `SELECT id, emri, kodi_bar, 0 AS cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate
         FROM products
         WHERE user_id = ?
         ORDER BY emri ASC`
      : `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate
         FROM products
         WHERE user_id = ?
         ORDER BY emri ASC`;

    const [rows] = await pool.query(query, [ownerId]);
    res.json(rows);
  } catch (error) {
    console.error('GET /api/products error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const ownerId = getTenantId(req);
    const isWorker = req.user.role === 'worker';
    const query = isWorker
      ? `SELECT id, emri, kodi_bar, 0 AS cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate
         FROM products
         WHERE id = ? AND user_id = ?`
      : `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate
         FROM products
         WHERE id = ? AND user_id = ?`;

    const [rows] = await pool.query(query, [req.params.id, ownerId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produkti nuk u gjet' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('GET /api/products/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const ownerId = getTenantId(req);
    const {
      emri,
      kodi_bar,
      cmimi_blerjes = 0,
      cmimi_shitjes = 0,
      stoku_aktual = 0,
      kategoria = null,
      image_url = null,
      tax_rate = 0,
    } = req.body;

    if (!emri || !kodi_bar) {
      return res.status(400).json({ error: 'Emri dhe barkodi janë të detyrueshëm' });
    }

    const [result] = await pool.query(
      `INSERT INTO products (user_id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate]
    );

    const [rows] = await pool.query(
      `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate, created_at, updated_at
       FROM products
       WHERE id = ? AND user_id = ?`,
      [result.insertId, ownerId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ky barkod ekziston tashmë' });
    }

    console.error('POST /api/products error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const ownerId = getTenantId(req);
    const {
      emri,
      kodi_bar,
      cmimi_blerjes = 0,
      cmimi_shitjes = 0,
      stoku_aktual = 0,
      kategoria = null,
      image_url = null,
      tax_rate = 0,
    } = req.body;

    if (!emri || !kodi_bar) {
      return res.status(400).json({ error: 'Emri dhe barkodi janë të detyrueshëm' });
    }

    const [result] = await pool.query(
      `UPDATE products
       SET emri = ?,
           kodi_bar = ?,
           cmimi_blerjes = ?,
           cmimi_shitjes = ?,
           stoku_aktual = ?,
           kategoria = ?,
           image_url = ?,
           tax_rate = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate, req.params.id, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produkti nuk u gjet' });
    }

    const [rows] = await pool.query(
      `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, image_url, tax_rate, created_at, updated_at
       FROM products
       WHERE id = ? AND user_id = ?`,
      [req.params.id, ownerId]
    );

    res.json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ky barkod ekziston tashmë' });
    }

    console.error('PUT /api/products/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const ownerId = getTenantId(req);
    const [result] = await pool.query(
      `DELETE FROM products WHERE id = ? AND user_id = ?`,
      [req.params.id, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produkti nuk u gjet' });
    }

    res.status(204).send();
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({ error: 'Produkti ka fatura të lidhura dhe nuk mund të fshihet' });
    }

    console.error('DELETE /api/products/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const tenantId = getTenantId(req);

    const [revenueRows] = await pool.query(
      `SELECT COALESCE(SUM(totali), 0) AS fitimi_total
       FROM invoices
       WHERE statusi = 'paguar' AND user_id = ?`,
      [tenantId]
    );

    const [todayRows] = await pool.query(
      `SELECT COUNT(*) AS shitjet_sot_nr,
              COALESCE(SUM(totali), 0) AS shitjet_sot_vlera
       FROM invoices
       WHERE statusi = 'paguar'
         AND DATE(data_krijimit) = CURDATE()
         AND user_id = ?`,
      [tenantId]
    );

    const [productRows] = await pool.query(
      `SELECT COUNT(*) AS total_produkte,
              COALESCE(SUM(stoku_aktual), 0) AS stoku_total
       FROM products
       WHERE user_id = ?`,
      [tenantId]
    );

    const [lowStockRows] = await pool.query(
      `SELECT COUNT(*) AS stoku_ulet
       FROM products
       WHERE stoku_aktual <= 5 AND stoku_aktual > 0 AND user_id = ?`,
      [tenantId]
    );

    const [profitRows] = await pool.query(
      `SELECT
         COALESCE(SUM((ii.sasia * ii.cmimi_per_njesi / (1 + ii.tax_rate / 100)) * (1 - COALESCE(i.discount_rate, 0) / 100)), 0) AS revenue_excl_tax,
         COALESCE(SUM(ii.sasia * p.cmimi_blerjes), 0) AS total_cost
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar' AND i.user_id = ?`,
      [tenantId]
    );

    const [taxRows] = await pool.query(
      `SELECT COALESCE(SUM(tax_amount), 0) AS tax_liability
       FROM invoices
       WHERE statusi = 'paguar' AND user_id = ?`,
      [tenantId]
    );

    const [paidTaxRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS tax_paid
       FROM financial_ledger
       WHERE llogaria = 'Detyrimi për TVSH' AND user_id = ?`,
      [tenantId]
    );

    const revenue_excl_tax = Number(profitRows[0].revenue_excl_tax || 0);
    const total_cost = Number(profitRows[0].total_cost || 0);
    const gross_tax_collected = Number(taxRows[0].tax_liability || 0);
    const tax_paid = Number(paidTaxRows[0].tax_paid || 0);
    const tax_liability = Math.max(0, gross_tax_collected - tax_paid);
    const net_profit = revenue_excl_tax - total_cost - (revenue_excl_tax - total_cost > 0 ? (revenue_excl_tax - total_cost) * 0.10 : 0);
    const profit_margin = revenue_excl_tax > 0 ? (net_profit / revenue_excl_tax) * 100 : 0;

    if (req.user.role === 'worker') {
      return res.json({
        role: 'worker',
        shitjet_sot_nr: Number(todayRows[0].shitjet_sot_nr || 0),
        shitjet_sot_vlera: Number(todayRows[0].shitjet_sot_vlera || 0),
        total_produkte: Number(productRows[0].total_produkte || 0),
        stoku_total: Number(productRows[0].stoku_total || 0),
        stoku_ulet: Number(lowStockRows[0].stoku_ulet || 0),
        fitimi_total: null,
        revenue_excl_tax: null,
        total_cost: null,
        tax_liability: null,
        tax_paid: null,
        net_profit: null,
        profit_margin: null,
      });
    }

    res.json({
      fitimi_total: Number(revenueRows[0].fitimi_total || 0),
      shitjet_sot_nr: Number(todayRows[0].shitjet_sot_nr || 0),
      shitjet_sot_vlera: Number(todayRows[0].shitjet_sot_vlera || 0),
      total_produkte: Number(productRows[0].total_produkte || 0),
      stoku_total: Number(productRows[0].stoku_total || 0),
      stoku_ulet: Number(lowStockRows[0].stoku_ulet || 0),
      revenue_excl_tax,
      total_cost,
      tax_liability,
      tax_paid,
      net_profit,
      profit_margin,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const [rows] = await pool.query(
      `SELECT id, numri_fatures, klienti, data_krijimit, totali, statusi, tax_rate, tax_amount, due_date, secure_code, discount_rate, discount_amount
       FROM invoices
       WHERE user_id = ?
       ORDER BY data_krijimit DESC
       LIMIT ?`,
      [tenantId, limit]
    );

    const now = new Date();
    const processedRows = rows.map(row => {
      if (row.statusi === 'ne_pritje' && row.due_date && new Date(row.due_date) < now) {
        return { ...row, statusi: 'vonese' };
      }
      return row;
    });

    res.json(processedRows);
  } catch (error) {
    console.error('GET /api/transactions error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.post('/api/sales', async (req, res) => {
  const client = await pool.getConnection();

  try {
    const ownerId = getTenantId(req);
    const { klienti, klient_email = null, klient_telefoni = null, klient_adresa = null, items, tax_rate = 0, payment_terms = 'immediate', statusi = 'paguar', menyra_pageses = 'KESH', discount_rate = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Duhet të shtoni së paku një produkt' });
    }

    await client.beginTransaction();

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await client.query(
      `INSERT INTO counters (user_id, prefix, date, counter)
       VALUES (?, 'FAT', CURDATE(), LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)`,
      [ownerId]
    );
    const [seqRow] = await client.query(`SELECT LAST_INSERT_ID() AS seq`);
    const seqNum = String(seqRow[0].seq).padStart(4, '0');
    const numriFatures = `FAT-${dateStr}-${seqNum}`;

    let subtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      const [productRows] = await client.query(
        `SELECT id, emri, cmimi_shitjes, stoku_aktual, tax_rate
         FROM products
         WHERE id = ? AND user_id = ?
         FOR UPDATE`,
        [item.product_id, ownerId]
      );

      if (productRows.length === 0) {
        await client.rollback();
        return res.status(400).json({ error: `Produkti me ID ${item.product_id} nuk ekziston` });
      }

      const product = productRows[0];

      if (Number(product.stoku_aktual) < Number(item.sasia)) {
        await client.rollback();
        return res.status(400).json({
          error: `Stoku i pamjaftueshëm për "${product.emri}". Në stok: ${product.stoku_aktual}`,
        });
      }

      const itemTaxRate = Number(product.tax_rate || 0);
      const lineTotal = Number(product.cmimi_shitjes) * Number(item.sasia);
      subtotal += lineTotal;

      resolvedItems.push({
        product_id: product.id,
        emri: product.emri,
        sasia: Number(item.sasia),
        cmimi_per_njesi: Number(product.cmimi_shitjes),
        tax_rate: itemTaxRate,
        line_total: lineTotal,
      });
    }

    let totalTaxAmount = 0;
    for (const rItem of resolvedItems) {
      const itemTaxRate = rItem.tax_rate;
      const lineTax = itemTaxRate > 0 ? rItem.line_total * (itemTaxRate / (100 + itemTaxRate)) : 0;
      totalTaxAmount += lineTax;
    }

    const discountAmount = subtotal * (Number(discount_rate || 0) / 100);
    const grandTotal = subtotal - discountAmount;
    const taxRate = 0;
    const taxAmount = totalTaxAmount * (1 - Number(discount_rate || 0) / 100);

    let daysToAdd = 0;
    if (payment_terms === 'net_15') daysToAdd = 15;
    else if (payment_terms === 'net_30') daysToAdd = 30;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);

    const secureCode = crypto.randomUUID();
    const [invoiceResult] = await client.query(
      `INSERT INTO invoices (user_id, numri_fatures, klienti, klient_email, klient_telefoni, klient_adresa, totali, statusi, tax_rate, tax_amount, due_date, seller_id, secure_code, menyra_pageses, discount_rate, discount_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, numriFatures, klienti || 'Klient i përgjithshëm', klient_email, klient_telefoni, klient_adresa, grandTotal, statusi, taxRate, taxAmount, dueDate, req.user.id, secureCode, menyra_pageses, Number(discount_rate || 0), discountAmount]
    );

    const invoiceId = invoiceResult.insertId;

    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, sasia, cmimi_per_njesi, tax_rate)
         VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, item.product_id, item.sasia, item.cmimi_per_njesi, item.tax_rate]
      );

      await client.query(
        `UPDATE products
         SET stoku_aktual = stoku_aktual - ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [item.sasia, item.product_id, ownerId]
      );
    }

    // Ledger accounting rules
    const debitAccount = statusi === 'paguar' ? 'Arka' : 'Llogari të arkëtueshme';

    // 1. Debit Cash/AR
    await client.query(
      `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [ownerId, invoiceId, `Shitje: ${numriFatures}`, debitAccount, grandTotal]
    );

    // 2. Credit Sales Revenue (Subtotal - Discount - VAT)
    await client.query(
      `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
       VALUES (?, ?, ?, 'Të hyrat nga shitjet', 0, ?)`,
      [ownerId, invoiceId, `Shitje: ${numriFatures}`, subtotal - discountAmount - taxAmount]
    );

    // 3. Credit VAT Payable (if taxAmount > 0)
    if (taxAmount > 0) {
      await client.query(
        `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
         VALUES (?, ?, ?, 'Detyrimi për TVSH', 0, ?)`,
        [ownerId, invoiceId, `TVSH nga shitja: ${numriFatures}`, taxAmount]
      );
    }

    await client.commit();

    res.status(201).json({
      message: 'Shitja u regjistrua me sukses',
      invoice: {
        id: invoiceId,
        numri_fatures: numriFatures,
        secure_code: secureCode,
        totali: grandTotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        due_date: dueDate,
        statusi,
        items: resolvedItems,
        discount_rate: Number(discount_rate || 0),
        discount_amount: discountAmount,
      },
    });
  } catch (error) {
    await client.rollback();
    console.error('POST /api/sales error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim gjatë regjistrimit të shitjes' });
  } finally {
    client.release();
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const [invoiceRows] = await pool.query(
      `SELECT i.id, i.numri_fatures, i.klienti, i.klient_email, i.klient_telefoni, i.klient_adresa, i.data_krijimit, i.totali, i.statusi, i.tax_rate, i.tax_amount, i.due_date, i.seller_id, i.secure_code, i.menyra_pageses, i.discount_rate, i.discount_amount,
              owner.emri_biznesit AS emri_biznesit,
              owner.email AS email_biznesit,
              COALESCE(seller.emri_biznesit, owner.emri_biznesit) AS emri_shitesit
       FROM invoices i
       JOIN users owner ON owner.id = i.user_id
       LEFT JOIN users seller ON seller.id = i.seller_id
       WHERE i.id = ? AND i.user_id = ?`,
      [req.params.id, tenantId]
    );

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Fatura nuk u gjet' });
    }

    const invoice = invoiceRows[0];
    const now = new Date();
    if (invoice.statusi === 'ne_pritje' && invoice.due_date && new Date(invoice.due_date) < now) {
      invoice.statusi = 'vonese';
    }

    const [itemRows] = await pool.query(
      `SELECT ii.id, ii.product_id, ii.sasia, ii.cmimi_per_njesi, ii.tax_rate, p.emri, p.kodi_bar
       FROM invoice_items ii
       JOIN products p ON p.id = ii.product_id
       WHERE ii.invoice_id = ?
       ORDER BY ii.id ASC`,
      [req.params.id]
    );

    res.json({
      ...invoice,
      items: itemRows,
    });
  } catch (error) {
    console.error('GET /api/invoices/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/invoices/public/:secureCode', async (req, res) => {
  try {
    const [invoiceRows] = await pool.query(
      `SELECT i.id, i.numri_fatures, i.klienti, i.klient_email, i.klient_telefoni, i.klient_adresa, i.data_krijimit, i.totali, i.statusi, i.tax_rate, i.tax_amount, i.due_date, i.seller_id, i.secure_code, i.menyra_pageses, i.discount_rate, i.discount_amount,
              owner.emri_biznesit AS emri_biznesit,
              owner.email AS email_biznesit,
              COALESCE(seller.emri_biznesit, owner.emri_biznesit) AS emri_shitesit
       FROM invoices i
       JOIN users owner ON owner.id = i.user_id
       LEFT JOIN users seller ON seller.id = i.seller_id
       WHERE i.secure_code = ?`,
      [req.params.secureCode]
    );

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Fatura nuk u gjet' });
    }

    const invoice = invoiceRows[0];
    const now = new Date();
    if (invoice.statusi === 'ne_pritje' && invoice.due_date && new Date(invoice.due_date) < now) {
      invoice.statusi = 'vonese';
    }

    const [itemRows] = await pool.query(
      `SELECT ii.id, ii.product_id, ii.sasia, ii.cmimi_per_njesi, ii.tax_rate, p.emri, p.kodi_bar
       FROM invoice_items ii
       JOIN products p ON p.id = ii.product_id
       WHERE ii.invoice_id = ?
       ORDER BY ii.id ASC`,
      [invoice.id]
    );

    res.json({
      ...invoice,
      items: itemRows,
    });
  } catch (error) {
    console.error('GET /api/invoices/public/:secureCode error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.put('/api/invoices/:id/status', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { statusi } = req.body;
    if (!['paguar', 'ne_pritje', 'anuluar'].includes(statusi)) {
      return res.status(400).json({ error: 'Status i panjohur' });
    }

    const [invoiceRows] = await pool.query(
      `SELECT id, user_id, numri_fatures, totali, statusi FROM invoices WHERE id = ? AND user_id = ?`,
      [req.params.id, tenantId]
    );

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Fatura nuk u gjet' });
    }

    const invoice = invoiceRows[0];

    const [result] = await pool.query(
      `UPDATE invoices SET statusi = ? WHERE id = ? AND user_id = ?`,
      [statusi, req.params.id, tenantId]
    );

    if (invoice.statusi === 'ne_pritje' && statusi === 'paguar') {
      // Debit Cash (Arka), Credit Accounts Receivable (Llogari të arkëtueshme)
      await pool.query(
        `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
         VALUES
           (?, ?, ?, 'Arka', ?, 0),
           (?, ?, ?, 'Llogari të arkëtueshme', 0, ?)`,
        [invoice.user_id, invoice.id, `Pagesë fature: ${invoice.numri_fatures}`, invoice.totali, invoice.user_id, invoice.id, `Pagesë fature: ${invoice.numri_fatures}`, invoice.totali]
      );
    }

    res.json({ message: 'Statusi u përditësua' });
  } catch (error) {
    console.error('PUT /api/invoices/:id/status error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/arka', async (req, res) => {
  try {
    if (req.user.role === 'worker') {
      return res.status(403).json({ error: 'Nuk keni autorizim' });
    }
    const tenantId = getTenantId(req);

    const [balanceRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS total_in, COALESCE(SUM(kredit), 0) AS total_out
       FROM financial_ledger
       WHERE llogaria = 'Arka' AND user_id = ?`,
      [tenantId]
    );

    const [todayRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS today_in, COALESCE(SUM(kredit), 0) AS today_out
       FROM financial_ledger
       WHERE llogaria = 'Arka' AND DATE(data) = CURDATE() AND user_id = ?`,
      [tenantId]
    );

    const [entries] = await pool.query(
      `SELECT fl.id, fl.data, fl.pershkrimi, fl.debit, fl.kredit, fl.invoice_id, fl.purchase_id,
              COALESCE(i.numri_fatures, p.numri_blerjes) AS numri_fatures,
              i.secure_code AS invoice_secure_code
       FROM financial_ledger fl
       LEFT JOIN invoices i ON i.id = fl.invoice_id
       LEFT JOIN purchases p ON p.id = fl.purchase_id
       WHERE fl.llogaria = 'Arka' AND fl.user_id = ?
       ORDER BY fl.data DESC
       LIMIT 200`,
      [tenantId]
    );

    const totalIn = Number(balanceRows[0].total_in);
    const totalOut = Number(balanceRows[0].total_out);

    res.json({
      balance: totalIn - totalOut,
      totalIn,
      totalOut,
      todayIn: Number(todayRows[0].today_in),
      todayOut: Number(todayRows[0].today_out),
      entries: entries.map(e => ({
        id: e.id,
        data: e.data,
        pershkrimi: e.pershkrimi,
        debit: Number(e.debit),
        kredit: Number(e.kredit),
        invoice_id: e.invoice_id,
        purchase_id: e.purchase_id,
        numri_fatures: e.numri_fatures,
        invoice_secure_code: e.invoice_secure_code,
      })),
    });
  } catch (error) {
    console.error('GET /api/arka error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.post('/api/taxes/pay', async (req, res) => {
  try {
    if (req.user.role === 'worker') {
      return res.status(403).json({ error: 'Nuk keni autorizim' });
    }
    const tenantId = getTenantId(req);
    const { amount, pershkrimi } = req.body;

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Vlera e pagesës duhet të jetë një numër pozitiv' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const desc = pershkrimi || 'Pagesë e rezervës tatimore (TVSH/Fitim)';

      // 1. Debit Detyrimi për TVSH (reduce liability)
      await connection.query(
        `INSERT INTO financial_ledger (user_id, pershkrimi, llogaria, debit, kredit)
         VALUES (?, ?, 'Detyrimi për TVSH', ?, 0)`,
        [tenantId, desc, paymentAmount]
      );

      // 2. Credit Arka (reduce cash)
      await connection.query(
        `INSERT INTO financial_ledger (user_id, pershkrimi, llogaria, debit, kredit)
         VALUES (?, ?, 'Arka', 0, ?)`,
        [tenantId, desc, paymentAmount]
      );

      await connection.commit();
      res.json({ message: 'Pagesa e tatimit u regjistrua me sukses' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('POST /api/taxes/pay error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    if (req.user.role === 'worker') {
      return res.status(403).json({ error: 'Nuk keni autorizim' });
    }
    const tenantId = getTenantId(req);
    const interval = req.query.interval || 'daily';
    let chartDataRows = [];

    if (interval === 'monthly') {
      const [rows] = await pool.query(
        `SELECT DATE_FORMAT(i.data_krijimit, '%Y-%m') as date, 
                SUM(i.totali) as revenue,
                COALESCE(SUM(invoice_costs.cost), 0) as cost
         FROM invoices i
         LEFT JOIN (
           SELECT ii.invoice_id, SUM(ii.sasia * p.cmimi_blerjes) as cost
           FROM invoice_items ii
           JOIN products p ON p.id = ii.product_id
           WHERE p.user_id = ?
           GROUP BY ii.invoice_id
         ) AS invoice_costs ON i.id = invoice_costs.invoice_id
         WHERE i.statusi = 'paguar' AND i.user_id = ? AND i.data_krijimit >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(i.data_krijimit, '%Y-%m')
         ORDER BY date ASC`,
        [tenantId, tenantId]
      );
      chartDataRows = rows;
    } else if (interval === 'weekly') {
      const [rows] = await pool.query(
        `SELECT DATE_FORMAT(i.data_krijimit, '%Y-W%u') as date, 
                SUM(i.totali) as revenue,
                COALESCE(SUM(invoice_costs.cost), 0) as cost
         FROM invoices i
         LEFT JOIN (
           SELECT ii.invoice_id, SUM(ii.sasia * p.cmimi_blerjes) as cost
           FROM invoice_items ii
           JOIN products p ON p.id = ii.product_id
           WHERE p.user_id = ?
           GROUP BY ii.invoice_id
         ) AS invoice_costs ON i.id = invoice_costs.invoice_id
         WHERE i.statusi = 'paguar' AND i.user_id = ? AND i.data_krijimit >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
         GROUP BY DATE_FORMAT(i.data_krijimit, '%Y-W%u')
         ORDER BY date ASC`,
        [tenantId, tenantId]
      );
      chartDataRows = rows;
    } else {
      // Daily
      const [rows] = await pool.query(
        `SELECT DATE(i.data_krijimit) as date, 
                SUM(i.totali) as revenue,
                COALESCE(SUM(invoice_costs.cost), 0) as cost
         FROM invoices i
         LEFT JOIN (
           SELECT ii.invoice_id, SUM(ii.sasia * p.cmimi_blerjes) as cost
           FROM invoice_items ii
           JOIN products p ON p.id = ii.product_id
           WHERE p.user_id = ?
           GROUP BY ii.invoice_id
         ) AS invoice_costs ON i.id = invoice_costs.invoice_id
         WHERE i.statusi = 'paguar' AND i.user_id = ? AND i.data_krijimit >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY DATE(i.data_krijimit)
         ORDER BY date ASC`,
        [tenantId, tenantId]
      );
      chartDataRows = rows;
    }

    const [topProductsRows] = await pool.query(
      `SELECT p.id, p.emri, SUM(ii.sasia) as total_sold, SUM(ii.sasia * ii.cmimi_per_njesi) as revenue
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar' AND i.user_id = ? AND p.user_id = ?
       GROUP BY p.id, p.emri
       ORDER BY total_sold DESC
       LIMIT 5`,
      [tenantId, tenantId]
    );

    const [profitRows] = await pool.query(
      `SELECT
         COALESCE(SUM((ii.sasia * ii.cmimi_per_njesi / (1 + ii.tax_rate / 100)) * (1 - COALESCE(i.discount_rate, 0) / 100)), 0) AS total_revenue,
         COALESCE(SUM(ii.sasia * p.cmimi_blerjes), 0) AS total_cost
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar' AND i.user_id = ? AND p.user_id = ?`,
      [tenantId, tenantId]
    );

    const [thisMonthRows] = await pool.query(
      `SELECT COALESCE(SUM(totali), 0) AS revenue
       FROM invoices
       WHERE statusi = 'paguar'
         AND YEAR(data_krijimit) = YEAR(CURDATE())
         AND MONTH(data_krijimit) = MONTH(CURDATE())
         AND user_id = ?`,
      [tenantId]
    );

    const [lastMonthRows] = await pool.query(
      `SELECT COALESCE(SUM(totali), 0) AS revenue
       FROM invoices
       WHERE statusi = 'paguar'
         AND YEAR(data_krijimit) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
         AND MONTH(data_krijimit) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
         AND user_id = ?`,
      [tenantId]
    );

    const [inventoryRows] = await pool.query(
      `SELECT COALESCE(SUM(stoku_aktual * cmimi_shitjes), 0) AS inventory_value,
              COALESCE(SUM(stoku_aktual * cmimi_blerjes), 0) AS inventory_cost
       FROM products
       WHERE user_id = ?`,
      [tenantId]
    );

    const [taxRows] = await pool.query(
      `SELECT COALESCE(SUM(tax_amount), 0) AS tax_liability
       FROM invoices
       WHERE statusi = 'paguar'
         AND user_id = ?`,
      [tenantId]
    );

    const [paidTaxRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS tax_paid
       FROM financial_ledger
       WHERE llogaria = 'Detyrimi për TVSH' AND user_id = ?`,
      [tenantId]
    );

    const totalRevenue = Number(profitRows[0].total_revenue);
    const totalCost = Number(profitRows[0].total_cost);
    const thisMonth = Number(thisMonthRows[0].revenue);
    const lastMonth = Number(lastMonthRows[0].revenue);
    const gross_tax_collected = Number(taxRows[0].tax_liability || 0);
    const taxPaid = Number(paidTaxRows[0].tax_paid || 0);
    const taxLiability = Math.max(0, gross_tax_collected - taxPaid);

    const formattedChartData = chartDataRows.map(row => {
      let formattedDate = row.date;
      try {
        if (interval === 'monthly') {
          const [year, month] = row.date.split('-');
          const date = new Date(Number(year), Number(month) - 1, 1);
          formattedDate = date.toLocaleDateString('sq-AL', { year: 'numeric', month: 'short' });
        } else if (interval === 'weekly') {
          const parts = row.date.split('-W');
          if (parts.length === 2) {
            formattedDate = `Java ${parts[1]}, ${parts[0]}`;
          }
        } else {
          formattedDate = new Date(row.date).toLocaleDateString('sq-AL', { month: 'short', day: 'numeric' });
        }
      } catch {
        formattedDate = row.date;
      }
      return {
        date: formattedDate,
        revenue: Number(row.revenue),
        cost: Number(row.cost || 0),
      };
    });

    res.json({
      chartData: formattedChartData,
      topProducts: topProductsRows.map(row => ({
        id: row.id,
        emri: row.emri,
        total_sold: Number(row.total_sold),
        revenue: Number(row.revenue)
      })),
      profitMargin: {
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalRevenue - totalCost,
        taxLiability: taxLiability,
        taxPaid: taxPaid,
        taxCollected: gross_tax_collected,
        netProfit: totalRevenue - totalCost - taxLiability,
      },
      monthlyComparison: {
        thisMonth,
        lastMonth,
        changePercent: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0,
      },
      inventoryValue: {
        atSalePrice: Number(inventoryRows[0].inventory_value),
        atCostPrice: Number(inventoryRows[0].inventory_cost),
      },
    });
  } catch (error) {
    console.error('GET /api/reports error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    if (req.user.role === 'worker') {
      return res.status(403).json({ error: 'Nuk keni autorizim' });
    }
    const tenantId = getTenantId(req);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: 'api_key_required',
        message: 'Konfiguro çelësin e Gemini API (GEMINI_API_KEY) në skedarin .env.'
      });
    }

    const { history = [] } = req.body;

    // 1. Gather all database metrics
    const [revenueRows] = await pool.query(
      `SELECT COALESCE(SUM(totali), 0) AS fitimi_total
       FROM invoices
       WHERE statusi = 'paguar' AND user_id = ?`,
      [tenantId]
    );

    const [todayRows] = await pool.query(
      `SELECT COUNT(*) AS shitjet_sot_nr,
              COALESCE(SUM(totali), 0) AS shitjet_sot_vlera
       FROM invoices
       WHERE statusi = 'paguar'
         AND DATE(data_krijimit) = CURDATE()
         AND user_id = ?`,
      [tenantId]
    );

    const [productRows] = await pool.query(
      `SELECT COUNT(*) AS total_produkte,
              COALESCE(SUM(stoku_aktual), 0) AS stoku_total
       FROM products
       WHERE user_id = ?`,
      [tenantId]
    );

    const [lowStockRows] = await pool.query(
      `SELECT COUNT(*) AS stoku_ulet
       FROM products
       WHERE stoku_aktual <= 5 AND stoku_aktual > 0 AND user_id = ?`,
      [tenantId]
    );

    const [profitRows] = await pool.query(
      `SELECT
         COALESCE(SUM((ii.sasia * ii.cmimi_per_njesi / (1 + ii.tax_rate / 100)) * (1 - COALESCE(i.discount_rate, 0) / 100)), 0) AS revenue_excl_tax,
         COALESCE(SUM(ii.sasia * p.cmimi_blerjes), 0) AS total_cost
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar' AND i.user_id = ? AND p.user_id = ?`,
      [tenantId, tenantId]
    );

    const [taxRows] = await pool.query(
      `SELECT COALESCE(SUM(tax_amount), 0) AS tax_liability
       FROM invoices
       WHERE statusi = 'paguar' AND user_id = ?`,
      [tenantId]
    );

    const [paidTaxRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS tax_paid
       FROM financial_ledger
       WHERE llogaria = 'Detyrimi për TVSH' AND user_id = ?`,
      [tenantId]
    );

    const [arkaRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS total_in, COALESCE(SUM(kredit), 0) AS total_out
       FROM financial_ledger
       WHERE llogaria = 'Arka' AND user_id = ?`,
      [tenantId]
    );

    const [lowStockProducts] = await pool.query(
      `SELECT emri, stoku_aktual, cmimi_shitjes, kategoria
       FROM products
       WHERE stoku_aktual <= 5 AND stoku_aktual >= 0 AND user_id = ?
       ORDER BY stoku_aktual ASC
       LIMIT 10`,
      [tenantId]
    );

    const [recentInvoices] = await pool.query(
      `SELECT numri_fatures, klienti, totali, statusi, data_krijimit
       FROM invoices
       WHERE user_id = ?
       ORDER BY data_krijimit DESC
       LIMIT 5`,
      [tenantId]
    );

    const revenue_excl_tax = Number(profitRows[0].revenue_excl_tax || 0);
    const total_cost = Number(profitRows[0].total_cost || 0);
    const tax_paid = Number(paidTaxRows[0].tax_paid || 0);
    const tax_liability = Math.max(0, Number(taxRows[0].tax_liability || 0) - tax_paid);
    const net_profit = revenue_excl_tax - total_cost - (revenue_excl_tax - total_cost > 0 ? (revenue_excl_tax - total_cost) * 0.10 : 0);
    const profit_margin = revenue_excl_tax > 0 ? (net_profit / revenue_excl_tax) * 100 : 0;
    const arka_balance = Number(arkaRows[0].total_in || 0) - Number(arkaRows[0].total_out || 0);

    // Format lists for prompt context
    const lowStockListStr = lowStockProducts.length > 0
      ? lowStockProducts.map(p => `- ${p.emri} (Stoku: ${p.stoku_aktual}, Çmimi: ${p.cmimi_shitjes} EUR, Kategoria: ${p.kategoria || 'Pa kategori'})`).join('\n')
      : 'Nuk ka produkte me stok kritik.';

    const recentInvoicesStr = recentInvoices.length > 0
      ? recentInvoices.map(i => `- ${i.numri_fatures} (Klienti: ${i.klienti}, Totali: ${i.totali} EUR, Statusi: ${i.statusi}, Data: ${new Date(i.data_krijimit).toLocaleDateString('sq-AL')})`).join('\n')
      : 'Nuk ka transaksione të fundit.';

    const today = new Date();
    const todayStr = today.toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const systemPrompt = `Ju jeni Zahlx AI CFO Copilot, një asistent financiar dhe menaxhues inteligjent për platformën e menaxhimit të biznesit Zahlx.
Ju komunikoni në gjuhën shqipe (ose në gjuhën e përdoruesit nëse ju pyet në gjuhë tjetër), në mënyrë profesionale, miqësore, të qartë dhe të shkurtër.

Data aktuale: ${todayStr}.

Këtu janë të dhënat aktuale të biznesit në kohë reale nga baza e të dhënave:
- Bilanci në Arkë: ${arka_balance.toFixed(2)} EUR
- Totali i Produkteve: ${productRows[0].total_produkte} produkte aktive
- Produkte me Stok të Ulët (sasia <= 5): ${lowStockRows[0].stoku_ulet} produkte
- Lista e Produkteve me Stok të Ulët:
${lowStockListStr}
- Shitjet e Sotme: ${todayRows[0].shitjet_sot_nr} shitje me vlerë totali ${Number(todayRows[0].shitjet_sot_vlera).toFixed(2)} EUR
- Të hyrat Bruto (totale të paguara): ${Number(revenueRows[0].fitimi_total).toFixed(2)} EUR
- Fitimi Neto: ${net_profit.toFixed(2)} EUR
- Provizioni Tatimor (TVSH i mbetur për pagesë): ${tax_liability.toFixed(2)} EUR (TVSH e mbledhur: ${Number(taxRows[0].tax_liability || 0).toFixed(2)} EUR, TVSH e paguar: ${tax_paid.toFixed(2)} EUR)
- Margjina e Fitimit: ${profit_margin.toFixed(1)}%

Transaksionet e fundit:
${recentInvoicesStr}

Përdorni këto të dhëna për t'u përgjigjur saktësisht pyetjeve të përdoruesit. Mos shpikni shifra nëse ato nuk janë të pranishme këtu. Nëse përdoruesi kërkon detaje që nuk janë në dispozicion, thuani me mirësjellje që nuk keni qasje në ato të dhëna ose sugjeroni faqet përkatëse të aplikacionit.`;

    // Map frontend messages to Gemini format (filter out initial bot greeting id=1)
    const formattedHistory = history
      .filter(msg => msg.id !== 1)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

    if (formattedHistory.length === 0) {
      return res.status(400).json({ error: 'invalid_history', message: 'History is empty.' });
    }

    // Call Gemini API REST endpoint using native fetch
    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: formattedHistory
      })
    });

    if (!response.ok) {
      const errDetails = await response.text();
      console.error('Gemini API error response:', errDetails);
      return res.status(response.status).json({
        error: 'gemini_api_error',
        message: 'Gabim gjatë komunikimit me Gemini API. Sigurohuni që çelësi juaj i API është i saktë.'
      });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return res.status(502).json({
        error: 'empty_response',
        message: 'Mori një përgjigje bosh nga modeli i inteligjencës artificiale.'
      });
    }

    res.json({ reply: replyText });

  } catch (error) {
    console.error('POST /api/chat error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// ─── AI Daily Insight Endpoint (Dashboard autopilot) ───
app.get('/api/ai/daily-insight', async (req, res) => {
  try {
    if (req.user.role === 'worker') {
      return res.status(403).json({ error: 'Nuk keni autorizim' });
    }
    const tenantId = getTenantId(req);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key configured' });
    }

    // Gather business context
    const [todayRows] = await pool.query(
      `SELECT COUNT(*) AS shitjet_sot_nr,
              COALESCE(SUM(totali), 0) AS shitjet_sot_vlera
       FROM invoices
       WHERE statusi = 'paguar'
         AND DATE(data_krijimit) = CURDATE()
         AND user_id = ?`,
      [tenantId]
    );

    const [productRows] = await pool.query(
      `SELECT COUNT(*) AS total_produkte FROM products WHERE user_id = ?`,
      [tenantId]
    );

    const [lowStockRows] = await pool.query(
      `SELECT COUNT(*) AS stoku_ulet
       FROM products
       WHERE stoku_aktual <= 5 AND stoku_aktual > 0 AND user_id = ?`,
      [tenantId]
    );

    const [profitRows] = await pool.query(
      `SELECT
         COALESCE(SUM((ii.sasia * ii.cmimi_per_njesi / (1 + ii.tax_rate / 100)) * (1 - COALESCE(i.discount_rate, 0) / 100)), 0) AS revenue_excl_tax,
         COALESCE(SUM(ii.sasia * p.cmimi_blerjes), 0) AS total_cost
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar' AND i.user_id = ? AND p.user_id = ?`,
      [tenantId, tenantId]
    );

    const [arkaRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS total_in, COALESCE(SUM(kredit), 0) AS total_out
       FROM financial_ledger
       WHERE llogaria = 'Arka' AND user_id = ?`,
      [tenantId]
    );

    const revenue_excl_tax = Number(profitRows[0].revenue_excl_tax || 0);
    const total_cost = Number(profitRows[0].total_cost || 0);
    const net_profit = revenue_excl_tax - total_cost;
    const arka_balance = Number(arkaRows[0].total_in || 0) - Number(arkaRows[0].total_out || 0);

    const prompt = `Ti je Zahlx AI Autopiloti, asistent financiar CFO për një biznes të vogël. Bazuar në të dhënat e sotme:
- Shitjet e Sotme: ${todayRows[0].shitjet_sot_nr} shitje me vlerë ${Number(todayRows[0].shitjet_sot_vlera).toFixed(2)} EUR
- Produktet Totale: ${productRows[0].total_produkte}
- Artikuj me Stok të Ulët: ${lowStockRows[0].stoku_ulet}
- Fitimi Neto: ${net_profit.toFixed(2)} EUR
- Bilanci në Arkë: ${arka_balance.toFixed(2)} EUR

Jep një përmbledhje operative të ditës në 2-3 fjali. Bëhu profesional, konciz dhe në shqip. Mos përdor emoji. Fillo direkt me analizën pa thënë "Zahlx AI" ose "Autopiloti" në fillim.`;

    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
      })
    });

    if (!response.ok) {
      console.error('Gemini daily insight error:', await response.text());
      return res.status(502).json({ error: 'Gemini API error' });
    }

    const data = await response.json();
    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json({ insight: insight || '' });
  } catch (error) {
    console.error('GET /api/ai/daily-insight error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// ─── AI Tab Insight Endpoint (CFO Copilot tabs) ───
app.post('/api/ai/tab-insight', async (req, res) => {
  try {
    if (req.user.role === 'worker') {
      return res.status(403).json({ error: 'Nuk keni autorizim' });
    }
    const tenantId = getTenantId(req);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key configured' });
    }

    const { prompt: userPrompt, tab } = req.body;
    if (!userPrompt || !tab) {
      return res.status(400).json({ error: 'Missing prompt or tab' });
    }

    // Gather relevant data based on tab
    const [todayRows] = await pool.query(
      `SELECT COUNT(*) AS shitjet_sot_nr,
              COALESCE(SUM(totali), 0) AS shitjet_sot_vlera
       FROM invoices
       WHERE statusi = 'paguar'
         AND DATE(data_krijimit) = CURDATE()
         AND user_id = ?`,
      [tenantId]
    );

    const [productRows] = await pool.query(
      `SELECT COUNT(*) AS total_produkte,
              COALESCE(SUM(stoku_aktual), 0) AS stoku_total
       FROM products
       WHERE user_id = ?`,
      [tenantId]
    );

    const [lowStockProducts] = await pool.query(
      `SELECT emri, stoku_aktual, cmimi_shitjes, kategoria
       FROM products
       WHERE stoku_aktual <= 5 AND stoku_aktual >= 0 AND user_id = ?
       ORDER BY stoku_aktual ASC
       LIMIT 10`,
      [tenantId]
    );

    const [profitRows] = await pool.query(
      `SELECT
         COALESCE(SUM((ii.sasia * ii.cmimi_per_njesi / (1 + ii.tax_rate / 100)) * (1 - COALESCE(i.discount_rate, 0) / 100)), 0) AS revenue_excl_tax,
         COALESCE(SUM(ii.sasia * p.cmimi_blerjes), 0) AS total_cost
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar' AND i.user_id = ? AND p.user_id = ?`,
      [tenantId, tenantId]
    );

    const [taxRows] = await pool.query(
      `SELECT COALESCE(SUM(tax_amount), 0) AS tax_liability
       FROM invoices
       WHERE statusi = 'paguar' AND user_id = ?`,
      [tenantId]
    );

    const [paidTaxRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS tax_paid
       FROM financial_ledger
       WHERE llogaria = 'Detyrimi për TVSH' AND user_id = ?`,
      [tenantId]
    );

    const [arkaRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS total_in, COALESCE(SUM(kredit), 0) AS total_out
       FROM financial_ledger
       WHERE llogaria = 'Arka' AND user_id = ?`,
      [tenantId]
    );

    const revenue_excl_tax = Number(profitRows[0].revenue_excl_tax || 0);
    const total_cost = Number(profitRows[0].total_cost || 0);
    const net_profit = revenue_excl_tax - total_cost;
    const profit_margin = revenue_excl_tax > 0 ? (net_profit / revenue_excl_tax) * 100 : 0;
    const tax_paid = Number(paidTaxRows[0].tax_paid || 0);
    const tax_liability = Math.max(0, Number(taxRows[0].tax_liability || 0) - tax_paid);
    const arka_balance = Number(arkaRows[0].total_in || 0) - Number(arkaRows[0].total_out || 0);

    const lowStockListStr = lowStockProducts.length > 0
      ? lowStockProducts.map(p => `- ${p.emri} (Stoku: ${p.stoku_aktual}, Çmimi: ${p.cmimi_shitjes} EUR)`).join('\n')
      : 'Nuk ka produkte me stok kritik.';

    const systemContext = `Ti je Zahlx AI CFO Copilot. Të dhënat aktuale:
- Shitjet Sot: ${todayRows[0].shitjet_sot_nr} me vlerë ${Number(todayRows[0].shitjet_sot_vlera).toFixed(2)} EUR
- Produkte: ${productRows[0].total_produkte} (Stoku total: ${Number(productRows[0].stoku_total)})
- Stok i ulët: ${lowStockProducts.length} produkte
${lowStockListStr}
- Fitimi Neto: ${net_profit.toFixed(2)} EUR (Margjina: ${profit_margin.toFixed(1)}%)
- Taksat (TVSH e mbetur për pagesë): ${tax_liability.toFixed(2)} EUR (TVSH e mbledhur: ${Number(taxRows[0].tax_liability || 0).toFixed(2)} EUR, TVSH e paguar: ${tax_paid.toFixed(2)} EUR)
- Bilanci Arkës: ${arka_balance.toFixed(2)} EUR

Përgjigju në shqip, profesionalisht, në 3-4 fjali. Mos përdor emoji. Jep rekomandime konkrete dhe strategjike.

Pyetja: ${userPrompt}`;

    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: systemContext }] }],
        generationConfig: { maxOutputTokens: 250, temperature: 0.7 }
      })
    });

    if (!response.ok) {
      console.error('Gemini tab insight error:', await response.text());
      return res.status(502).json({ error: 'Gemini API error' });
    }

    const data = await response.json();
    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json({ insight: insight || '' });
  } catch (error) {
    console.error('POST /api/ai/tab-insight error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/offers', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const [rows] = await pool.query(
      `SELECT id, numri_ofertes, klienti, email_klientit, data_krijimit, data_skadimit, totali, statusi, tax_rate, tax_amount, shenime
       FROM offers
       WHERE user_id = ?
       ORDER BY data_krijimit DESC`,
      [tenantId]
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/offers error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/offers/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const [offerRows] = await pool.query(
      `SELECT id, numri_ofertes, klienti, email_klientit, data_krijimit, data_skadimit, totali, statusi, tax_rate, tax_amount, shenime
       FROM offers
       WHERE id = ? AND user_id = ?`,
      [req.params.id, tenantId]
    );

    if (offerRows.length === 0) {
      return res.status(404).json({ error: 'Oferta nuk u gjet' });
    }

    const [itemRows] = await pool.query(
      `SELECT oi.id, oi.product_id, oi.sasia, oi.cmimi_per_njesi, p.emri, p.kodi_bar
       FROM offer_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.offer_id = ?
       ORDER BY oi.id ASC`,
      [req.params.id]
    );

    res.json({
      ...offerRows[0],
      items: itemRows,
    });
  } catch (error) {
    console.error('GET /api/offers/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.post('/api/offers', async (req, res) => {
  const client = await pool.getConnection();
  try {
    const ownerId = getTenantId(req);
    const { klienti, email_klientit = null, items, tax_rate = 0, data_skadimit = null, shenime = null, statusi = 'draft' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Duhet të shtoni së paku një produkt' });
    }

    await client.beginTransaction();

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await client.query(
      `INSERT INTO counters (user_id, prefix, date, counter)
       VALUES (?, 'OFR', CURDATE(), LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)`,
      [ownerId]
    );
    const [seqRow] = await client.query(`SELECT LAST_INSERT_ID() AS seq`);
    const seqNum = String(seqRow[0].seq).padStart(4, '0');
    const numriOfertes = `OFR-${dateStr}-${seqNum}`;

    let subtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      const [productRows] = await client.query(
        `SELECT id, emri, cmimi_shitjes
         FROM products
         WHERE id = ? AND user_id = ?`,
        [item.product_id, ownerId]
      );

      if (productRows.length === 0) {
        await client.rollback();
        return res.status(400).json({ error: `Produkti me ID ${item.product_id} nuk ekziston` });
      }

      const product = productRows[0];
      const lineTotal = Number(product.cmimi_shitjes) * Number(item.sasia);
      subtotal += lineTotal;

      resolvedItems.push({
        product_id: product.id,
        emri: product.emri,
        sasia: Number(item.sasia),
        cmimi_per_njesi: Number(product.cmimi_shitjes),
      });
    }

    const taxRate = Number(tax_rate || 0);
    const taxAmount = taxRate > 0 ? subtotal * (taxRate / (100 + taxRate)) : 0;
    const grandTotal = subtotal;

    const [offerResult] = await client.query(
      `INSERT INTO offers (user_id, numri_ofertes, klienti, email_klientit, totali, tax_rate, tax_amount, data_skadimit, shenime, statusi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, numriOfertes, klienti || 'Klient i përgjithshëm', email_klientit, grandTotal, taxRate, taxAmount, data_skadimit, shenime, statusi]
    );

    const offerId = offerResult.insertId;

    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO offer_items (offer_id, product_id, sasia, cmimi_per_njesi)
         VALUES (?, ?, ?, ?)`,
        [offerId, item.product_id, item.sasia, item.cmimi_per_njesi]
      );
    }

    await client.commit();

    res.status(201).json({
      message: 'Oferta u krijua me sukses',
      id: offerId,
      numri_ofertes: numriOfertes,
      totali: grandTotal,
    });
  } catch (error) {
    await client.rollback();
    console.error('POST /api/offers error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim gjatë krijimit të ofertës' });
  } finally {
    client.release();
  }
});

app.put('/api/offers/:id/status', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { statusi } = req.body;
    if (!['draft', 'derguar', 'pranuar', 'refuzuar', 'skaduar'].includes(statusi)) {
      return res.status(400).json({ error: 'Status i panjohur' });
    }

    const [result] = await pool.query(
      `UPDATE offers SET statusi = ? WHERE id = ? AND user_id = ?`,
      [statusi, req.params.id, tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Oferta nuk u gjet' });
    }

    res.json({ message: 'Statusi i ofertës u përditësua' });
  } catch (error) {
    console.error('PUT /api/offers/:id/status error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.post('/api/offers/:id/convert', async (req, res) => {
  const client = await pool.getConnection();
  try {
    const ownerId = getTenantId(req);

    // 1. Fetch offer
    const [offerRows] = await client.query(
      `SELECT id, klienti, totali, tax_rate, tax_amount FROM offers WHERE id = ? AND user_id = ?`,
      [req.params.id, ownerId]
    );

    if (offerRows.length === 0) {
      return res.status(404).json({ error: 'Oferta nuk u gjet' });
    }

    const offer = offerRows[0];

    // 2. Fetch offer items
    const [itemRows] = await client.query(
      `SELECT product_id, sasia, cmimi_per_njesi FROM offer_items WHERE offer_id = ?`,
      [req.params.id]
    );

    if (itemRows.length === 0) {
      return res.status(400).json({ error: 'Oferta nuk ka artikuj' });
    }

    await client.beginTransaction();

    // 3. Generate Invoice Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await client.query(
      `INSERT INTO counters (user_id, prefix, date, counter)
       VALUES (?, 'FAT', CURDATE(), LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)`,
      [ownerId]
    );
    const [seqRow] = await client.query(`SELECT LAST_INSERT_ID() AS seq`);
    const seqNum = String(seqRow[0].seq).padStart(4, '0');
    const numriFatures = `FAT-${dateStr}-${seqNum}`;

    // 4. Verify stock and lock items
    const resolvedItems = [];
    let subtotal = 0;

    for (const item of itemRows) {
      const [productRows] = await client.query(
        `SELECT id, emri, cmimi_shitjes, stoku_aktual
         FROM products
         WHERE id = ? AND user_id = ?
         FOR UPDATE`,
        [item.product_id, ownerId]
      );

      if (productRows.length === 0) {
        await client.rollback();
        return res.status(400).json({ error: `Produkti me ID ${item.product_id} nuk ekziston` });
      }

      const product = productRows[0];

      if (Number(product.stoku_aktual) < Number(item.sasia)) {
        await client.rollback();
        return res.status(400).json({
          error: `Stoku i pamjaftueshëm për "${product.emri}". Në stok: ${product.stoku_aktual}`,
        });
      }

      const lineTotal = Number(item.cmimi_per_njesi) * Number(item.sasia);
      subtotal += lineTotal;

      resolvedItems.push({
        product_id: product.id,
        emri: product.emri,
        sasia: Number(item.sasia),
        cmimi_per_njesi: Number(item.cmimi_per_njesi),
      });
    }

    const taxRate = Number(offer.tax_rate || 0);
    const taxAmount = taxRate > 0 ? subtotal * (taxRate / (100 + taxRate)) : 0;
    const grandTotal = subtotal;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const secureCode = crypto.randomUUID();
    const [invoiceResult] = await client.query(
      `INSERT INTO invoices (user_id, numri_fatures, klienti, totali, statusi, tax_rate, tax_amount, due_date, secure_code)
       VALUES (?, ?, ?, ?, 'ne_pritje', ?, ?, ?, ?)`,
      [ownerId, numriFatures, offer.klienti, grandTotal, taxRate, taxAmount, dueDate, secureCode]
    );

    const invoiceId = invoiceResult.insertId;

    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, sasia, cmimi_per_njesi)
         VALUES (?, ?, ?, ?)`,
        [invoiceId, item.product_id, item.sasia, item.cmimi_per_njesi]
      );

      await client.query(
        `UPDATE products
         SET stoku_aktual = stoku_aktual - ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [item.sasia, item.product_id, ownerId]
      );
    }

    // Ledger Entries
    await client.query(
      `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
       VALUES (?, ?, ?, 'Llogari të arkëtueshme', ?, 0)`,
      [ownerId, invoiceId, `Shitje (nga Ofertë): ${numriFatures}`, grandTotal]
    );

    await client.query(
      `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
       VALUES (?, ?, ?, 'Të hyrat nga shitjet', 0, ?)`,
      [ownerId, invoiceId, `Shitje (nga Ofertë): ${numriFatures}`, subtotal - taxAmount]
    );

    if (taxAmount > 0) {
      await client.query(
        `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
         VALUES (?, ?, ?, 'Detyrimi për TVSH', 0, ?)`,
        [ownerId, invoiceId, `TVSH nga shitja: ${numriFatures}`, taxAmount]
      );
    }

    await client.query(
      `UPDATE offers SET statusi = 'pranuar' WHERE id = ? AND user_id = ?`,
      [req.params.id, ownerId]
    );

    await client.commit();

    res.json({
      message: 'Oferta u konvertua me sukses në faturë',
      invoiceId,
      numri_fatures: numriFatures,
    });
  } catch (error) {
    await client.rollback();
    console.error('POST /api/offers/:id/convert error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim gjatë konvertimit të ofertës në faturë' });
  } finally {
    client.release();
  }
});

app.delete('/api/offers/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const [result] = await pool.query(
      `DELETE FROM offers WHERE id = ? AND user_id = ?`,
      [req.params.id, tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Oferta nuk u gjet' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('DELETE /api/offers/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.post('/api/offers/:id/ai-pitch', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key configured' });
    }

    const [offerRows] = await pool.query(
      `SELECT numri_ofertes, klienti, totali, tax_rate, tax_amount, shenime FROM offers WHERE id = ? AND user_id = ?`,
      [req.params.id, tenantId]
    );

    if (offerRows.length === 0) {
      return res.status(404).json({ error: 'Oferta nuk u gjet' });
    }

    const offer = offerRows[0];

    const [itemRows] = await pool.query(
      `SELECT oi.sasia, oi.cmimi_per_njesi, p.emri
       FROM offer_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.offer_id = ? AND p.user_id = ?`,
      [req.params.id, tenantId]
    );

    const itemsList = itemRows.map(i => `- ${i.emri} (Sasia: ${i.sasia}, Çmimi: ${i.cmimi_per_njesi} EUR)`).join('\n');

    const prompt = `Ti je një agjent profesional i shitjeve për një biznes modern.
Shkruaj një email të shkurtër, bindës dhe shumë profesional në gjuhën shqipe për t'i dërguar këtë ofertë klientit.
Email-i duhet të jetë i strukturuar mirë (të ketë subjekt, përshëndetje, trupin e email-it me pikat kryesore të ofertës, dhe mbyllje).

Detajet e Ofertës:
- Numri i Ofertës: ${offer.numri_ofertes}
- Klienti: ${offer.klienti}
- Totali: ${Number(offer.totali).toFixed(2)} EUR
- Artikujt në ofertë:
${itemsList}

Nëse ka shënime shtesë nga biznesi, përfshiji me kujdes: "${offer.shenime || ''}".
Mos përdor emoji. Mbaje tonin miqësor por korporativ e formal.`;

    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
      })
    });

    if (!response.ok) {
      console.error('Gemini offer pitch error:', await response.text());
      return res.status(502).json({ error: 'Gemini API error' });
    }

    const data = await response.json();
    const pitch = data.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json({ pitch: pitch || '' });
  } catch (error) {
    console.error('POST /api/offers/:id/ai-pitch error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// ================================================================
// PURCHASES CRUD & LOOKUP
// ================================================================

// GET all purchases for the logged-in user with meta stats
app.get('/api/purchases', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const search = req.query.search || '';
    const statusi = req.query.statusi || '';

    let query = `
      SELECT id, numri_blerjes, furnitori, data_blerjes, totali, statusi, tax_rate, tax_amount, discount_rate, source_invoice_numri
      FROM purchases
      WHERE user_id = ?
    `;
    const params = [tenantId];

    if (search) {
      query += ` AND (furnitori LIKE ? OR numri_blerjes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (statusi) {
      query += ` AND statusi = ?`;
      params.push(statusi);
    }

    query += ` ORDER BY data_blerjes DESC`;

    const [rows] = await pool.query(query, params);

    // Calculate meta stats
    const [metaRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(totali), 0) AS totalSpend,
        COALESCE(SUM(tax_amount), 0) AS totalTax,
        COALESCE(SUM(CASE WHEN MONTH(data_blerjes) = MONTH(CURDATE()) AND YEAR(data_blerjes) = YEAR(CURDATE()) THEN totali ELSE 0 END), 0) AS thisMonthSpend
      FROM purchases
      WHERE user_id = ?
    `, [tenantId]);

    res.json({
      purchases: rows,
      meta: metaRows[0] || { total: 0, totalSpend: 0, totalTax: 0, thisMonthSpend: 0 }
    });
  } catch (error) {
    console.error('GET /api/purchases error:', error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// POST register a new purchase
app.post('/api/purchases', async (req, res) => {
  const client = await pool.getConnection();
  try {
    const tenantId = getTenantId(req);
    const {
      furnitori,
      source_invoice_secure_code = null,
      source_invoice_numri = null,
      items,
      tax_rate = 0,
      discount_rate = 0,
      statusi = 'paguar',
      shenime = null,
      update_stock = false
    } = req.body;

    if (!furnitori || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Plotësoni të gjitha fushat e detyrueshme' });
    }

    await client.beginTransaction();

    // Generate Purchase number BLR-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await client.query(
      `INSERT INTO counters (user_id, prefix, date, counter)
       VALUES (?, 'BLR', CURDATE(), LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)`,
      [tenantId]
    );
    const [seqRow] = await client.query(`SELECT LAST_INSERT_ID() AS seq`);
    const seqNum = String(seqRow[0].seq).padStart(4, '0');
    const numriBlerjes = `BLR-${dateStr}-${seqNum}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.sasia || 1) * Number(item.cmimi_per_njesi || 0);
    }
    const discount = subtotal * (Number(discount_rate || 0) / 100);
    const taxable = subtotal - discount;
    const taxAmount = taxable * (Number(tax_rate || 0) / 100);
    const totali = taxable + taxAmount;

    // Save purchase
    const [result] = await client.query(
      `INSERT INTO purchases (user_id, numri_blerjes, furnitori, totali, tax_rate, tax_amount, discount_rate, statusi, source_invoice_secure_code, source_invoice_numri, shenime)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, numriBlerjes, furnitori, totali, tax_rate, taxAmount, discount_rate, statusi, source_invoice_secure_code, source_invoice_numri, shenime]
    );

    const purchaseId = result.insertId;

    // Save items and update stock if requested
    for (const item of items) {
      await client.query(
        `INSERT INTO purchase_items (purchase_id, emri, kodi_bar, sasia, cmimi_per_njesi)
         VALUES (?, ?, ?, ?, ?)`,
        [purchaseId, item.emri, item.kodi_bar || null, item.sasia, item.cmimi_per_njesi]
      );

      if (update_stock && item.kodi_bar) {
        await client.query(
          `UPDATE products 
           SET stoku_aktual = stoku_aktual + ?, updated_at = CURRENT_TIMESTAMP
           WHERE kodi_bar = ? AND user_id = ?`,
          [item.sasia, item.kodi_bar, tenantId]
        );
      }
    }

    // Ledger entries:
    // Debit: Supplies/Expenses for taxable subtotal
    await client.query(
      `INSERT INTO financial_ledger (user_id, purchase_id, pershkrimi, llogaria, debit, kredit)
       VALUES (?, ?, ?, 'Furnizime / Shpenzime', ?, 0)`,
      [tenantId, purchaseId, `Blerje: ${numriBlerjes} nga ${furnitori}`, taxable]
    );

    // Debit: Deductible VAT if taxAmount > 0
    if (taxAmount > 0) {
      await client.query(
        `INSERT INTO financial_ledger (user_id, purchase_id, pershkrimi, llogaria, debit, kredit)
         VALUES (?, ?, ?, 'TVSH e zbritshme', ?, 0)`,
        [tenantId, purchaseId, `TVSH nga blerja: ${numriBlerjes}`, taxAmount]
      );
    }

    // Credit: Arka or Accounts Payable for grand total
    const creditAccount = statusi === 'paguar' ? 'Arka' : 'Llogari të pagueshme';
    await client.query(
      `INSERT INTO financial_ledger (user_id, purchase_id, pershkrimi, llogaria, debit, kredit)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [tenantId, purchaseId, `Pagesë blerje: ${numriBlerjes}`, creditAccount, totali]
    );

    await client.commit();
    res.status(201).json({ id: purchaseId, numri_blerjes: numriBlerjes, totali });
  } catch (error) {
    await client.rollback();
    console.error('POST /api/purchases error:', error);
    res.status(500).json({ error: 'Gabim serveri gjatë regjistrimit të blerjes' });
  } finally {
    client.release();
  }
});

// PUT update purchase status (change to paid)
app.put('/api/purchases/:id/status', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { statusi } = req.body;
    if (!['paguar', 'ne_pritje', 'anuluar'].includes(statusi)) {
      return res.status(400).json({ error: 'Status i panjohur' });
    }

    const [purchaseRows] = await pool.query(
      `SELECT id, user_id, numri_blerjes, totali, statusi FROM purchases WHERE id = ? AND user_id = ?`,
      [req.params.id, tenantId]
    );

    if (purchaseRows.length === 0) {
      return res.status(404).json({ error: 'Blerja nuk u gjet' });
    }

    const purchase = purchaseRows[0];

    await pool.query(
      `UPDATE purchases SET statusi = ? WHERE id = ? AND user_id = ?`,
      [statusi, req.params.id, tenantId]
    );

    if (purchase.statusi === 'ne_pritje' && statusi === 'paguar') {
      // Debit Llogari të pagueshme, Credit Arka
      await pool.query(
        `INSERT INTO financial_ledger (user_id, purchase_id, pershkrimi, llogaria, debit, kredit)
         VALUES 
           (?, ?, ?, 'Llogari të pagueshme', ?, 0),
           (?, ?, ?, 'Arka', 0, ?)`,
        [tenantId, purchase.id, `Pagesë blerje: ${purchase.numri_blerjes}`, purchase.totali, tenantId, purchase.id, `Pagesë blerje: ${purchase.numri_blerjes}`, purchase.totali]
      );
    }

    res.json({ message: 'Statusi u përditësua' });
  } catch (error) {
    console.error('PUT /api/purchases/:id/status error:', error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// DELETE a purchase
app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const [result] = await pool.query(
      `DELETE FROM purchases WHERE id = ? AND user_id = ?`,
      [req.params.id, tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Blerja nuk u gjet' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('DELETE /api/purchases/:id error:', error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// GET look up supplier invoice by secure code globally for prefill scan
app.get('/api/purchases/scan/:code', async (req, res) => {
  try {
    const [invoiceRows] = await pool.query(
      `SELECT i.id, i.numri_fatures, i.totali, i.tax_rate, i.tax_amount, i.secure_code,
              u.emri_biznesit AS furnitori
       FROM invoices i
       JOIN users u ON u.id = i.user_id
       WHERE i.secure_code = ?`,
      [req.params.code]
    );

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Fatura nuk u gjet' });
    }

    const invoice = invoiceRows[0];

    const [itemRows] = await pool.query(
      `SELECT ii.sasia, ii.cmimi_per_njesi, p.emri, p.kodi_bar
       FROM invoice_items ii
       JOIN products p ON p.id = ii.product_id
       WHERE ii.invoice_id = ?
       ORDER BY ii.id ASC`,
      [invoice.id]
    );

    res.json({
      furnitori: invoice.furnitori,
      numri_fatures: invoice.numri_fatures,
      tax_rate: invoice.tax_rate,
      discount_rate: 0,
      secure_code: invoice.secure_code,
      items: itemRows
    });
  } catch (error) {
    console.error('GET /api/purchases/scan/:code error:', error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// ================================================================
// CLIENTS CRUD
// ================================================================

// GET all clients with aggregated invoice/offer stats
app.get('/api/clients', async (req, res) => {
  try {
    const ownerId = getTenantId(req);

    const [clients] = await pool.query(
      `SELECT c.*,
              COALESCE(inv.invoice_count, 0) AS invoice_count,
              COALESCE(inv.invoice_total, 0) AS invoice_total,
              COALESCE(off.offer_count, 0) AS offer_count,
              COALESCE(off.offer_total, 0) AS offer_total,
              LEAST(
                COALESCE(inv.first_invoice, '9999-12-31'),
                COALESCE(off.first_offer, '9999-12-31')
              ) AS first_seen,
              GREATEST(
                COALESCE(inv.last_invoice, '1970-01-01'),
                COALESCE(off.last_offer, '1970-01-01')
              ) AS last_seen
       FROM clients c
       LEFT JOIN (
         SELECT klienti, 
                COUNT(*) AS invoice_count, 
                SUM(totali) AS invoice_total,
                MIN(data_krijimit) AS first_invoice,
                MAX(data_krijimit) AS last_invoice
         FROM invoices WHERE user_id = ? AND klienti != 'Klient i përgjithshëm'
         GROUP BY klienti
       ) inv ON LOWER(TRIM(c.emri)) = LOWER(TRIM(inv.klienti))
       LEFT JOIN (
         SELECT klienti,
                COUNT(*) AS offer_count,
                SUM(totali) AS offer_total,
                MIN(data_krijimit) AS first_offer,
                MAX(data_krijimit) AS last_offer
         FROM offers WHERE user_id = ? AND klienti != 'Klient i përgjithshëm'
         GROUP BY klienti
       ) off ON LOWER(TRIM(c.emri)) = LOWER(TRIM(off.klienti))
       WHERE c.user_id = ?
       ORDER BY c.emri ASC`,
      [ownerId, ownerId, ownerId]
    );

    res.json(clients);
  } catch (error) {
    console.error('GET /api/clients error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// GET client's transaction history (invoices and offers)
app.get('/api/clients/:id/transactions', async (req, res) => {
  try {
    const ownerId = getTenantId(req);

    // First get the client name
    const [clientRows] = await pool.query(
      `SELECT emri FROM clients WHERE id = ? AND user_id = ?`,
      [req.params.id, ownerId]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ error: 'Klienti nuk u gjet' });
    }

    const clientName = clientRows[0].emri;

    // Get invoices
    const [invoices] = await pool.query(
      `SELECT id, numri_fatures AS number, data_krijimit AS date, totali AS total, statusi AS status, 'Faturë' AS type
       FROM invoices
       WHERE user_id = ? AND LOWER(TRIM(klienti)) = LOWER(TRIM(?))
       ORDER BY data_krijimit DESC`,
      [ownerId, clientName]
    );

    // Get offers
    const [offers] = await pool.query(
      `SELECT id, numri_ofertes AS number, data_krijimit AS date, totali AS total, statusi AS status, 'Ofertë' AS type
       FROM offers
       WHERE user_id = ? AND LOWER(TRIM(klienti)) = LOWER(TRIM(?))
       ORDER BY data_krijimit DESC`,
      [ownerId, clientName]
    );

    // Combine and sort by date descending
    const transactions = [...invoices, ...offers].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(transactions);
  } catch (error) {
    console.error('GET /api/clients/:id/transactions error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// POST create a new client
app.post('/api/clients', async (req, res) => {
  try {
    const ownerId = getTenantId(req);
    const { emri, email = null, telefoni = null, adresa = null, shenime = null } = req.body;

    if (!emri || !emri.trim()) {
      return res.status(400).json({ error: 'Emri i klientit është i detyrueshëm' });
    }

    const [result] = await pool.query(
      `INSERT INTO clients (user_id, emri, email, telefoni, adresa, shenime)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ownerId, emri.trim(), email, telefoni, adresa, shenime]
    );

    const [rows] = await pool.query(
      `SELECT * FROM clients WHERE id = ? AND user_id = ?`,
      [result.insertId, ownerId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST /api/clients error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// PUT update a client
app.put('/api/clients/:id', async (req, res) => {
  try {
    const ownerId = getTenantId(req);
    const { emri, email = null, telefoni = null, adresa = null, shenime = null } = req.body;

    if (!emri || !emri.trim()) {
      return res.status(400).json({ error: 'Emri i klientit është i detyrueshëm' });
    }

    const [result] = await pool.query(
      `UPDATE clients SET emri = ?, email = ?, telefoni = ?, adresa = ?, shenime = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [emri.trim(), email, telefoni, adresa, shenime, req.params.id, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Klienti nuk u gjet' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM clients WHERE id = ? AND user_id = ?`,
      [req.params.id, ownerId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('PUT /api/clients/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// DELETE a client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const ownerId = getTenantId(req);
    const [result] = await pool.query(
      `DELETE FROM clients WHERE id = ? AND user_id = ?`,
      [req.params.id, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Klienti nuk u gjet' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('DELETE /api/clients/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// Health check endpoint for keep-alive pings
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`✓ Zahlx API running on http://localhost:${PORT}`);

  // Self-keepalive every 14 minutes to prevent Render spin-down
  const publicUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(async () => {
    try {
      const res = await fetch(`${publicUrl}/api/health`);
      if (res.ok) console.log('♥ Keepalive ping successful');
    } catch {
      // server might be starting up; ignore
    }
  }, 4 * 60 * 1000);
});
