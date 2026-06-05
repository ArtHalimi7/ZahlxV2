// ============================================================
// Zahlx — Database Seed Script
// Populates the database with sample data for demonstration.
// Run: node seed.js
// ============================================================
import pool from './db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seed() {
  const client = await pool.connect();

  try {
    // Run the schema first
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schema);
    console.log('✓ Schema created');

    // Insert a demo business user
    await client.query(`
      INSERT INTO users (emri_biznesit, email, password_hash)
      VALUES ('Dyqani Demo', 'demo@zahlx.com', 'placeholder_hash')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✓ Demo user created');

    // Insert sample products
    const products = [
      ['Coca-Cola 0.5L',       'BAR-001', 0.60,  1.20, 48, 'Pije'],
      ['Ujë Rugove 1.5L',      'BAR-002', 0.15,  0.40, 120, 'Pije'],
      ['Kafe Turke 200g',      'BAR-003', 1.80,  3.50, 35, 'Ushqim'],
      ['Çokollatë Milka 100g', 'BAR-004', 0.90,  1.80, 60, 'Ushqim'],
      ['Bukë e bardhë',        'BAR-005', 0.30,  0.60, 25, 'Ushqim'],
      ['Qumësht 1L',           'BAR-006', 0.50,  0.95, 40, 'Qumështore'],
      ['Djathë i bardhë 1kg',  'BAR-007', 3.50,  6.00, 15, 'Qumështore'],
      ['Vezë (10 copë)',       'BAR-008', 1.20,  2.20, 30, 'Ushqim'],
      ['Vaj Ulliri 1L',        'BAR-009', 4.00,  7.50, 18, 'Ushqim'],
      ['Birrë Peja 0.5L',      'BAR-010', 0.45,  1.10, 72, 'Pije'],
    ];

    for (const [emri, kodi, blerje, shitje, stoku, kat] of products) {
      await client.query(
        `INSERT INTO products (user_id, emri, kodi_bar, cmimi_blerjes, cmimi_shitjes, stoku_aktual, kategoria)
         VALUES (1, $1, $2, $3, $4, $5, $6)
         ON CONFLICT (kodi_bar) DO NOTHING`,
        [emri, kodi, blerje, shitje, stoku, kat]
      );
    }
    console.log('✓ 10 sample products inserted');

    // Insert a few sample invoices with ledger entries
    const sampleSales = [
      { klienti: 'Arben Krasniqi', items: [{ idx: 0, qty: 3 }, { idx: 3, qty: 2 }] },
      { klienti: 'Drita Berisha',  items: [{ idx: 1, qty: 5 }, { idx: 5, qty: 2 }] },
      { klienti: 'Klient i përgjithshëm', items: [{ idx: 2, qty: 1 }, { idx: 7, qty: 1 }] },
    ];

    for (let i = 0; i < sampleSales.length; i++) {
      const sale = sampleSales[i];
      let totali = 0;
      const lineItems = [];

      for (const si of sale.items) {
        const p = products[si.idx];
        const lineTotal = p[3] * si.qty; // cmimi_shitjes * qty
        totali += lineTotal;
        lineItems.push({ emri: p[0], kodi: p[1], qty: si.qty, price: p[3], lineTotal });
      }

      const numri = `FAT-20260605-${String(i + 1).padStart(4, '0')}`;

      const invResult = await client.query(
        `INSERT INTO invoices (user_id, numri_fatures, klienti, totali, statusi)
         VALUES (1, $1, $2, $3, 'paguar')
         RETURNING id`,
        [numri, sale.klienti, totali]
      );
      const invId = invResult.rows[0].id;

      for (const li of lineItems) {
        const prodResult = await client.query(`SELECT id FROM products WHERE kodi_bar = $1`, [li.kodi]);
        const prodId = prodResult.rows[0].id;

        await client.query(
          `INSERT INTO invoice_items (invoice_id, product_id, sasia, cmimi_per_njesi)
           VALUES ($1, $2, $3, $4)`,
          [invId, prodId, li.qty, li.price]
        );
      }

      // Ledger entries
      await client.query(
        `INSERT INTO financial_ledger (user_id, invoice_id, pershkrimi, llogaria, debit, kredit)
         VALUES
           (1, $1, $2, 'Arka', $3, 0),
           (1, $1, $2, 'Të hyrat nga shitjet', 0, $3)`,
        [invId, `Shitje: ${numri}`, totali]
      );
    }
    console.log('✓ 3 sample invoices with ledger entries created');

    console.log('\n✓ Seed complete!');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
