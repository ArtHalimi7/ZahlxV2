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

    const [profitRows] = await pool.query(
      `SELECT
         COALESCE(SUM(ii.sasia * ii.cmimi_per_njesi), 0) AS revenue_excl_tax,
         COALESCE(SUM(ii.sasia * p.cmimi_blerjes), 0) AS total_cost
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar'`
    );

    const [taxRows] = await pool.query(
      `SELECT COALESCE(SUM(tax_amount), 0) AS tax_liability
       FROM invoices
       WHERE statusi = 'paguar'`
    );

    const revenue_excl_tax = Number(profitRows[0].revenue_excl_tax || 0);
    const total_cost = Number(profitRows[0].total_cost || 0);
    const tax_liability = Number(taxRows[0].tax_liability || 0);
    const net_profit = revenue_excl_tax - total_cost - (revenue_excl_tax - total_cost > 0 ? (revenue_excl_tax - total_cost) * 0.10 : 0); // 10% income tax estimate on net income
    const profit_margin = revenue_excl_tax > 0 ? (net_profit / revenue_excl_tax) * 100 : 0;

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
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const [rows] = await pool.query(
      `SELECT id, numri_fatures, klienti, data_krijimit, totali, statusi, tax_rate, tax_amount, due_date
       FROM invoices
       ORDER BY data_krijimit DESC
       LIMIT ?`,
      [limit]
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
    const ownerId = await getOwnerId();
    const { klienti, items, tax_rate = 0, payment_terms = 'immediate', statusi = 'paguar' } = req.body;

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

    let subtotal = 0;
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
      subtotal += lineTotal;

      resolvedItems.push({
        product_id: product.id,
        emri: product.emri,
        sasia: Number(item.sasia),
        cmimi_per_njesi: Number(product.cmimi_shitjes),
        line_total: lineTotal,
      });
    }

    const taxRate = Number(tax_rate || 0);
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    let daysToAdd = 0;
    if (payment_terms === 'net_15') daysToAdd = 15;
    else if (payment_terms === 'net_30') daysToAdd = 30;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);

    const [invoiceResult] = await client.query(
      `INSERT INTO invoices (user_id, numri_fatures, klienti, totali, statusi, tax_rate, tax_amount, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, numriFatures, klienti || 'Klient i përgjithshëm', grandTotal, statusi, taxRate, taxAmount, dueDate]
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

    // Ledger accounting rules
    const debitAccount = statusi === 'paguar' ? 'Arka' : 'Llogari të arkëtueshme';

    // 1. Debit Cash/AR
    await client.query(
      `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [ownerId, invoiceId, `Shitje: ${numriFatures}`, debitAccount, grandTotal]
    );

    // 2. Credit Sales Revenue (Subtotal)
    await client.query(
      `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
       VALUES (?, ?, ?, 'Të hyrat nga shitjet', 0, ?)`,
      [ownerId, invoiceId, `Shitje: ${numriFatures}`, subtotal]
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
        totali: grandTotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        due_date: dueDate,
        statusi,
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
      `SELECT id, numri_fatures, klienti, data_krijimit, totali, statusi, tax_rate, tax_amount, due_date
       FROM invoices
       WHERE id = ?`,
      [req.params.id]
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
      `SELECT ii.id, ii.product_id, ii.sasia, ii.cmimi_per_njesi, p.emri, p.kodi_bar
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

app.put('/api/invoices/:id/status', async (req, res) => {
  try {
    const { statusi } = req.body;
    if (!['paguar', 'ne_pritje', 'anuluar'].includes(statusi)) {
      return res.status(400).json({ error: 'Status i panjohur' });
    }

    const [invoiceRows] = await pool.query(
      `SELECT id, user_id, numri_fatures, totali, statusi FROM invoices WHERE id = ?`,
      [req.params.id]
    );

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Fatura nuk u gjet' });
    }

    const invoice = invoiceRows[0];

    const [result] = await pool.query(
      `UPDATE invoices SET statusi = ? WHERE id = ?`,
      [statusi, req.params.id]
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
    const [balanceRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS total_in, COALESCE(SUM(kredit), 0) AS total_out
       FROM financial_ledger
       WHERE llogaria = 'Arka'`
    );

    const [todayRows] = await pool.query(
      `SELECT COALESCE(SUM(debit), 0) AS today_in, COALESCE(SUM(kredit), 0) AS today_out
       FROM financial_ledger
       WHERE llogaria = 'Arka' AND DATE(data) = CURDATE()`
    );

    const [entries] = await pool.query(
      `SELECT fl.id, fl.data, fl.pershkrimi, fl.debit, fl.kredit, fl.invoice_id,
              i.numri_fatures
       FROM financial_ledger fl
       LEFT JOIN invoices i ON i.id = fl.invoice_id
       WHERE fl.llogaria = 'Arka'
       ORDER BY fl.data DESC
       LIMIT 200`
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
        numri_fatures: e.numri_fatures,
      })),
    });
  } catch (error) {
    console.error('GET /api/arka error:', error?.stack || error);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
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
           GROUP BY ii.invoice_id
         ) AS invoice_costs ON i.id = invoice_costs.invoice_id
         WHERE i.statusi = 'paguar' AND i.data_krijimit >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(i.data_krijimit, '%Y-%m')
         ORDER BY date ASC`
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
           GROUP BY ii.invoice_id
         ) AS invoice_costs ON i.id = invoice_costs.invoice_id
         WHERE i.statusi = 'paguar' AND i.data_krijimit >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
         GROUP BY DATE_FORMAT(i.data_krijimit, '%Y-W%u')
         ORDER BY date ASC`
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
           GROUP BY ii.invoice_id
         ) AS invoice_costs ON i.id = invoice_costs.invoice_id
         WHERE i.statusi = 'paguar' AND i.data_krijimit >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY DATE(i.data_krijimit)
         ORDER BY date ASC`
      );
      chartDataRows = rows;
    }

    const [topProductsRows] = await pool.query(
      `SELECT p.id, p.emri, SUM(ii.sasia) as total_sold, SUM(ii.sasia * ii.cmimi_per_njesi) as revenue
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar'
       GROUP BY p.id, p.emri
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    const [profitRows] = await pool.query(
      `SELECT
         COALESCE(SUM(ii.sasia * ii.cmimi_per_njesi), 0) AS total_revenue,
         COALESCE(SUM(ii.sasia * p.cmimi_blerjes), 0) AS total_cost
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       JOIN products p ON p.id = ii.product_id
       WHERE i.statusi = 'paguar'`
    );

    const [thisMonthRows] = await pool.query(
      `SELECT COALESCE(SUM(totali), 0) AS revenue
       FROM invoices
       WHERE statusi = 'paguar'
         AND YEAR(data_krijimit) = YEAR(CURDATE())
         AND MONTH(data_krijimit) = MONTH(CURDATE())`
    );

    const [lastMonthRows] = await pool.query(
      `SELECT COALESCE(SUM(totali), 0) AS revenue
       FROM invoices
       WHERE statusi = 'paguar'
         AND YEAR(data_krijimit) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
         AND MONTH(data_krijimit) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
    );

    const [inventoryRows] = await pool.query(
      `SELECT COALESCE(SUM(stoku_aktual * cmimi_shitjes), 0) AS inventory_value,
              COALESCE(SUM(stoku_aktual * cmimi_blerjes), 0) AS inventory_cost
       FROM products`
    );

    const [taxRows] = await pool.query(
      `SELECT COALESCE(SUM(tax_amount), 0) AS tax_liability
       FROM invoices
       WHERE statusi = 'paguar'`
    );

    const totalRevenue = Number(profitRows[0].total_revenue);
    const totalCost = Number(profitRows[0].total_cost);
    const thisMonth = Number(thisMonthRows[0].revenue);
    const lastMonth = Number(lastMonthRows[0].revenue);
    const taxLiability = Number(taxRows[0].tax_liability || 0);

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

app.listen(PORT, () => {
  console.log(`✓ Zahlx API running on http://localhost:${PORT}`);
});
