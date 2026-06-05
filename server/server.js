import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let ownerIdPromise;

const getOwnerId = async () => {
  if (!ownerIdPromise) {
    ownerIdPromise = (async () => {
      const [users] = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');

      if (users.length > 0) {
        return users[0].id;
      }

      const businessName = process.env.DEFAULT_BUSINESS_NAME || 'Zahlx Business';
      const businessEmail = process.env.DEFAULT_BUSINESS_EMAIL || 'owner@zahlx.local';

      const [result] = await pool.query(
        `INSERT INTO users (emri_biznesit, email, password_hash)
         VALUES (?, ?, ?)`,
        [businessName, businessEmail, 'bootstrap']
      );

      return result.insertId;
    })();
  }

  return ownerIdPromise;
};

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria
       FROM products
       ORDER BY emri ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/products error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria
       FROM products
       WHERE id = ?`,
      [req.params.id]
    );

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
    const ownerId = await getOwnerId();
    const {
      emri,
      kodi_bar,
      cmimi_blerjes = 0,
      cmimi_shitjes = 0,
      stoku_aktual = 0,
      kategoria = null,
    } = req.body;

    if (!emri || !kodi_bar) {
      return res.status(400).json({ error: 'Emri dhe barkodi janë të detyrueshëm' });
    }

    const [result] = await pool.query(
      `INSERT INTO products (user_id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria]
    );

    const [rows] = await pool.query(
      `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, created_at, updated_at
       FROM products
       WHERE id = ?`,
      [result.insertId]
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
    const {
      emri,
      kodi_bar,
      cmimi_blerjes = 0,
      cmimi_shitjes = 0,
      stoku_aktual = 0,
      kategoria = null,
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
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produkti nuk u gjet' });
    }

    const [rows] = await pool.query(
      `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria, created_at, updated_at
       FROM products
       WHERE id = ?`,
      [req.params.id]
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
    const [result] = await pool.query(
      `DELETE FROM products WHERE id = ?`,
      [req.params.id]
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
    const [revenueRows] = await pool.query(
      `SELECT COALESCE(SUM(totali), 0) AS fitimi_total
       FROM invoices
       WHERE statusi = 'paguar'`
    );

    const [todayRows] = await pool.query(
      `SELECT COUNT(*) AS shitjet_sot_nr,
              COALESCE(SUM(totali), 0) AS shitjet_sot_vlera
       FROM invoices
       WHERE statusi = 'paguar'
         AND DATE(data_krijimit) = CURDATE()`
    );

    const [productRows] = await pool.query(
      `SELECT COUNT(*) AS total_produkte,
              COALESCE(SUM(stoku_aktual), 0) AS stoku_total
       FROM products`
    );

    const [lowStockRows] = await pool.query(
      `SELECT COUNT(*) AS stoku_ulet
       FROM products
       WHERE stoku_aktual <= 5 AND stoku_aktual > 0`
    );

    res.json({
      fitimi_total: Number(revenueRows[0].fitimi_total || 0),
      shitjet_sot_nr: Number(todayRows[0].shitjet_sot_nr || 0),
      shitjet_sot_vlera: Number(todayRows[0].shitjet_sot_vlera || 0),
      total_produkte: Number(productRows[0].total_produkte || 0),
      stoku_total: Number(productRows[0].stoku_total || 0),
      stoku_ulet: Number(lowStockRows[0].stoku_ulet || 0),
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const [rows] = await pool.query(
      `SELECT id, numri_fatures, klienti, data_krijimit, totali, statusi
       FROM invoices
       ORDER BY data_krijimit DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/transactions error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.post('/api/sales', async (req, res) => {
  const client = await pool.getConnection();

  try {
    const ownerId = await getOwnerId();
    const { klienti, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Duhet të shtoni së paku një produkt' });
    }

    await client.beginTransaction();

    const [countRows] = await client.query(
      `SELECT COUNT(*) AS c
       FROM invoices
       WHERE DATE(data_krijimit) = CURDATE()`
    );
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqNum = String(Number(countRows[0].c) + 1).padStart(4, '0');
    const numriFatures = `FAT-${dateStr}-${seqNum}`;

    let totali = 0;
    const resolvedItems = [];

    for (const item of items) {
      const [productRows] = await client.query(
        `SELECT id, emri, cmimi_shitjes, stoku_aktual
         FROM products
         WHERE id = ?
         FOR UPDATE`,
        [item.product_id]
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

      const lineTotal = Number(product.cmimi_shitjes) * Number(item.sasia);
      totali += lineTotal;

      resolvedItems.push({
        product_id: product.id,
        emri: product.emri,
        sasia: Number(item.sasia),
        cmimi_per_njesi: Number(product.cmimi_shitjes),
        line_total: lineTotal,
      });
    }

    const [invoiceResult] = await client.query(
      `INSERT INTO invoices (user_id, numri_fatures, klienti, totali, statusi)
       VALUES (?, ?, ?, ?, 'paguar')`,
      [ownerId, numriFatures, klienti || 'Klient i përgjithshëm', totali]
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
         WHERE id = ?`,
        [item.sasia, item.product_id]
      );
    }

    await client.query(
      `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
       VALUES
         (?, ?, ?, 'Arka', ?, 0),
         (?, ?, ?, 'Të hyrat nga shitjet', 0, ?)` ,
      [ownerId, invoiceId, `Shitje: ${numriFatures}`, totali, ownerId, invoiceId, `Shitje: ${numriFatures}`, totali]
    );

    await client.commit();

    res.status(201).json({
      message: 'Shitja u regjistrua me sukses',
      invoice: {
        id: invoiceId,
        numri_fatures: numriFatures,
        totali,
        items: resolvedItems,
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
    const [invoiceRows] = await pool.query(
      `SELECT id, numri_fatures, klienti, data_krijimit, totali, statusi
       FROM invoices
       WHERE id = ?`,
      [req.params.id]
    );

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Fatura nuk u gjet' });
    }

    const [itemRows] = await pool.query(
      `SELECT ii.id, ii.product_id, ii.sasia, ii.cmimi_per_njesi, p.emri, p.kodi_bar
       FROM invoice_items ii
       JOIN products p ON p.id = ii.product_id
       WHERE ii.invoice_id = ?
       ORDER BY ii.id ASC`,
      [req.params.id]
    );

    res.json({
      ...invoiceRows[0],
      items: itemRows,
    });
  } catch (error) {
    console.error('GET /api/invoices/:id error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Zahlx API running on http://localhost:${PORT}`);
});
