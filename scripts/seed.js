/**
 * Seed script - Run locally to populate Turso database from CSV
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/seed.js
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Create table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kegiatan (
      id TEXT PRIMARY KEY,
      tanggal_update TEXT,
      tahun TEXT,
      bulan TEXT,
      area_zi TEXT,
      kegiatan TEXT,
      sub_kegiatan TEXT,
      status TEXT DEFAULT 'Belum Mulai',
      capaian TEXT,
      evidence TEXT,
      kendala TEXT,
      tindak_lanjut TEXT,
      catatan TEXT,
      kategori TEXT DEFAULT 'Bulanan',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);
  try { await db.execute("ALTER TABLE kegiatan ADD COLUMN kategori TEXT DEFAULT 'Bulanan'"); } catch (_) {}

  // Check if data exists
  const existing = await db.execute("SELECT COUNT(*) as c FROM kegiatan");
  if (Number(existing.rows[0].c) > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  // Find CSV file
  const csvPath = join(__dirname, '..', '..', 'Rekap ZI - Catatan_Progress.csv');
  if (!existsSync(csvPath)) {
    console.log('CSV file not found at:', csvPath);
    console.log('Please place "Rekap ZI - Catatan_Progress.csv" in the parent directory of monev-app/');
    return;
  }

  const content = readFileSync(csvPath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });

  // Detect periodisitas
  const map = {};
  for (const r of records) {
    const key = (r['Kegiatan / Rencana Aksi'] || '').trim();
    const bulan = (r['Bulan'] || '').toUpperCase().trim();
    if (!key) continue;
    if (!map[key]) map[key] = new Set();
    if (bulan) map[key].add(bulan);
  }
  const PERIODIK_MAP = { 1: 'Sekali', 2: 'Dua Bulanan', 3: 'Pertiga Bulanan', 6: 'Per Semester', 12: 'Tahunan' };
  const periodMap = {};
  for (const [keg, bulanSet] of Object.entries(map)) {
    const cnt = bulanSet.size;
    periodMap[keg] = PERIODIK_MAP[cnt] || (cnt === 0 ? 'Sekali' : 'Bulanan');
  }

  // Insert records in batches
  let idCounter = 1;
  const stmts = [];
  for (const row of records) {
    const keg = row['Kegiatan / Rencana Aksi'] || '';
    const id = 'PRG-' + String(idCounter++).padStart(4, '0');
    stmts.push({
      sql: `INSERT INTO kegiatan (id, tanggal_update, tahun, bulan, area_zi, kegiatan, sub_kegiatan, status, capaian, evidence, kendala, tindak_lanjut, catatan, kategori)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        row['Tanggal Update'] || '',
        row['Tahun'] || '',
        (row['Bulan'] || '').toUpperCase(),
        row['Area ZI'] || '',
        keg,
        row['Sub Kegiatan / Detail'] || '',
        row['Status'] || 'Belum Mulai',
        row['Capaian / Realisasi'] || '',
        row['Evidence / Link Bukti'] || '',
        row['Kendala'] || '',
        row['Tindak Lanjut'] || '',
        row['Catatan'] || '',
        periodMap[keg.trim()] || 'Bulanan',
      ],
    });
  }

  // Execute in batches of 50
  for (let i = 0; i < stmts.length; i += 50) {
    const batch = stmts.slice(i, i + 50);
    await db.batch(batch);
    console.log(`Seeded ${Math.min(i + 50, stmts.length)}/${stmts.length} records...`);
  }

  console.log(`Successfully seeded ${records.length} records!`);
}

main().catch(console.error);
