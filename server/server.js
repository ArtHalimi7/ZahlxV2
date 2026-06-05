// ============================================================
// Zahlx — Express API Server
//
// Core endpoints for the accounting/inventory system.
// Every sale runs inside a SQL transaction to guarantee
// atomicity: invoice + line items + stock update + ledger.
// ============================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ────────────────────────────────────────────
// GET /api/products
// Returns all products with current stock
// ────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria
       FROM products
       ORDER BY emri ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/products error:', err.message);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// ────────────────────────────────────────────
// GET /api/dashboard
// Aggregated metrics for the dashboard cards
// ────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  try {
    // Total revenue — sum of all paid invoices
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(totali), 0) AS fitimi_total
       FROM invoices
       WHERE statusi = 'paguar'`
    );

    // Today's sales count and total
    const todayResult = await pool.query(
      `SELECT COUNT(*) AS shitjet_sot_nr,
              COALESCE(SUM(totali), 0) AS shitjet_sot_vlera
       FROM invoices
       WHERE statusi = 'paguar'
         AND data_krijimit::date = CURRENT_DATE`
    );

    // Total distinct products in stock
    const productResult = await pool.query(
      `SELECT COUNT(*) AS total_produkte,
              COALESCE(SUM(stoku_aktual), 0) AS stoku_total
       FROM products`
    );

    // Low stock alerts (5 or fewer remaining)
    const lowStockResult = await pool.query(
      `SELECT COUNT(*) AS stoku_ulet
       FROM products
       WHERE stoku_aktual <= 5 AND stoku_aktual > 0`
    );

    res.json({
      fitimi_total:       parseFloat(revenueResult.rows[0].fitimi_total),
      shitjet_sot_nr:     parseInt(todayResult.rows[0].shitjet_sot_nr),
      shitjet_sot_vlera:  parseFloat(todayResult.rows[0].shitjet_sot_vlera),
      total_produkte:     parseInt(productResult.rows[0].total_produkte),
      stoku_total:        parseInt(productResult.rows[0].stoku_total),
      stoku_ulet:         parseInt(lowStockResult.rows[0].stoku_ulet),
    });
  } catch (err) {
    console.error('GET /api/dashboard error:', err.message);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// ────────────────────────────────────────────
// GET /api/transactions
// Recent invoices for the dashboard table
// ────────────────────────────────────────────
app.get('/api/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { rows } = await pool.query(
      `SELECT id, numri_fatures, klienti, data_krijimit, totali, statusi
       FROM invoices
       ORDER BY data_krijimit DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/transactions error:', err.message);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// ────────────────────────────────────────────
// POST /api/sales
// Creates a full sale in a single SQL transaction:
//   1. Generate invoice number
//   2. Insert invoice header
//   3. Insert line items
//   4. Decrement product stock
//   5. Write double-entry ledger entries
//   6. COMMIT or ROLLBACK on any failure
//
// Expected body:
// {
//   klienti: "Emri",           // optional
//   items: [
//     { product_id: 1, sasia: 2 },
//     { product_id: 5, sasia: 1 }
//   ]
// }
// ────────────────────────────────────────────
app.post('/api/sales', async (req, res) => {
  const client = await pool.connect();

  try {
    const { klienti, items } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Duhet të shtoni së paku një produkt' });
    }

    await client.query('BEGIN');

    // 1) Generate a unique invoice number: FAT-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countResult = await client.query(
      `SELECT COUNT(*) AS c FROM invoices WHERE data_krijimit::date = CURRENT_DATE`
    );
    const seqNum = String(parseInt(countResult.rows[0].c) + 1).padStart(4, '0');
    const numriFatures = `FAT-${dateStr}-${seqNum}`;

    // 2) Calculate totals and validate stock for each item
    let totali = 0;
    const resolvedItems = [];

    for (const item of items) {
      const productResult = await client.query(
        `SELECT id, emri, cmimi_shitjes, stoku_aktual
         FROM products
         WHERE id = $1
         FOR UPDATE`,  // Lock the row to prevent race conditions
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Produkti me ID ${item.product_id} nuk ekziston` });
      }

      const product = productResult.rows[0];

      if (product.stoku_aktual < item.sasia) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stoku i pamjaftueshëm për "${product.emri}". Në stok: ${product.stoku_aktual}`
        });
      }

      const lineTotal = parseFloat(product.cmimi_shitjes) * item.sasia;
      totali += lineTotal;

      resolvedItems.push({
        product_id: product.id,
        emri: product.emri,
        sasia: item.sasia,
        cmimi_per_njesi: parseFloat(product.cmimi_shitjes),
        line_total: lineTotal,
      });
    }

    // 3) Insert the invoice header
    const invoiceResult = await client.query(
      `INSERT INTO invoices (user_id, numri_fatures, klienti, totali, statusi)
       VALUES (1, $1, $2, $3, 'paguar')
       RETURNING id`,
      [numriFatures, klienti || 'Klient i përgjithshëm', totali]
    );
    const invoiceId = invoiceResult.rows[0].id;

    // 4) Insert line items + update stock
    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, sasia, cmimi_per_njesi)
         VALUES ($1, $2, $3, $4)`,
        [invoiceId, item.product_id, item.sasia, item.cmimi_per_njesi]
      );

      await client.query(
        `UPDATE products SET stoku_aktual = stoku_aktual - $1, updated_at = NOW()
         WHERE id = $2`,
        [item.sasia, item.product_id]
      );
    }

    // 5) Double-entry ledger:
    //    DEBIT  "Arka" (Cash)                   — money coming in
    //    CREDIT "Të hyrat nga shitjet" (Revenue) — revenue recognized
    await client.query(
      `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
       VALUES
         (1, $1, $2, 'Arka', $3, 0),
         (1, $1, $2, 'Të hyrat nga shitjet', 0, $3)`,
      [invoiceId, `Shitje: ${numriFatures}`, totali]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Shitja u regjistrua me sukses',
      invoice: {
        id: invoiceId,
        numri_fatures: numriFatures,
        totali,
        items: resolvedItems,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/sales error:', err.message);
    res.status(500).json({ error: 'Gabim gjatë regjistrimit të shitjes' });
  } finally {
    client.release();
  }
});

// ────────────────────────────────────────────
// Start server
// ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Zahlx API running on http://localhost:${PORT}`);
});
