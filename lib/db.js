import { createClient } from '@libsql/client';

let client;

export function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDb() {
  const db = getDb();
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
  try {
    await db.execute("ALTER TABLE kegiatan ADD COLUMN kategori TEXT DEFAULT 'Bulanan'");
  } catch (_) {}
}

export async function query(sql, args = {}) {
  const db = getDb();
  const result = await db.execute({ sql, args });
  return result.rows;
}

export async function queryOne(sql, args = {}) {
  const rows = await query(sql, args);
  return rows[0] || null;
}

export async function execute(sql, args = {}) {
  const db = getDb();
  return await db.execute({ sql, args });
}
