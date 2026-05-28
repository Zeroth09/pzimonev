import { query, queryOne, execute, initDb } from '@/lib/db';
import { NextResponse } from 'next/server';

const KATEGORI_LIST = ['Sekali', 'Bulanan', 'Dua Bulanan', 'Pertiga Bulanan', 'Per Semester', 'Tahunan'];

let initialized = false;

export async function GET(request) {
  try {
    if (!initialized) { await initDb(); initialized = true; }
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const bulan = searchParams.get('bulan');
    const status = searchParams.get('status');
    const tahun = searchParams.get('tahun');
    const search = searchParams.get('search');
    const kategori = searchParams.get('kategori');
    const group = searchParams.get('group');

    if (group === 'kegiatan') {
      const rows = await query("SELECT kegiatan, area_zi, MAX(kategori) as kategori, COUNT(*) as instance_count, SUM(CASE WHEN status='Selesai' THEN 1 ELSE 0 END) as selesai_count, GROUP_CONCAT(bulan ORDER BY CASE bulan WHEN 'JANUARI' THEN 1 WHEN 'FEBRUARI' THEN 2 WHEN 'MARET' THEN 3 WHEN 'APRIL' THEN 4 WHEN 'MEI' THEN 5 WHEN 'JUNI' THEN 6 WHEN 'JULI' THEN 7 WHEN 'AGUSTUS' THEN 8 WHEN 'SEPTEMBER' THEN 9 WHEN 'OKTOBER' THEN 10 WHEN 'NOVEMBER' THEN 11 WHEN 'DESEMBER' THEN 12 END) as bulan_list, GROUP_CONCAT(status ORDER BY CASE bulan WHEN 'JANUARI' THEN 1 WHEN 'FEBRUARI' THEN 2 WHEN 'MARET' THEN 3 WHEN 'APRIL' THEN 4 WHEN 'MEI' THEN 5 WHEN 'JUNI' THEN 6 WHEN 'JULI' THEN 7 WHEN 'AGUSTUS' THEN 8 WHEN 'SEPTEMBER' THEN 9 WHEN 'OKTOBER' THEN 10 WHEN 'NOVEMBER' THEN 11 WHEN 'DESEMBER' THEN 12 END) as status_list FROM kegiatan GROUP BY kegiatan, area_zi ORDER BY kegiatan ASC");
      return NextResponse.json({ grouped: rows, kategoriList: KATEGORI_LIST });
    }

    let queryStr = 'SELECT * FROM kegiatan WHERE 1=1';
    const args = {};
    if (area) { queryStr += ' AND area_zi=$area'; args.area = area; }
    if (bulan) { queryStr += ' AND bulan=$bulan'; args.bulan = bulan; }
    if (status) { queryStr += ' AND status=$status'; args.status = status; }
    if (tahun) { queryStr += ' AND tahun=$tahun'; args.tahun = tahun; }
    if (kategori) { queryStr += ' AND kategori=$kategori'; args.kategori = kategori; }
    if (search) {
      queryStr += " AND (kegiatan LIKE $search OR sub_kegiatan LIKE $search OR id LIKE $search OR area_zi LIKE $search)";
      args.search = '%' + search + '%';
    }
    queryStr += ' ORDER BY id ASC';
    const rows = await query(queryStr, args);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!initialized) { await initDb(); initialized = true; }
    const body = await request.json();
    const maxRow = await queryOne("SELECT id FROM kegiatan ORDER BY id DESC LIMIT 1");
    let nextNum = 1;
    if (maxRow) { const n = parseInt(maxRow.id.replace('PRG-', ''), 10); if (!isNaN(n)) nextNum = n + 1; }
    const newId = 'PRG-' + String(nextNum).padStart(4, '0');
    await execute("INSERT INTO kegiatan (id, tanggal_update, tahun, bulan, area_zi, kegiatan, sub_kegiatan, status, capaian, evidence, kendala, tindak_lanjut, catatan, kategori) VALUES ($id, datetime('now','localtime'), $tahun, $bulan, $area_zi, $kegiatan, $sub_kegiatan, $status, $capaian, $evidence, $kendala, $tindak_lanjut, $catatan, $kategori)", {
      id: newId, tahun: body.tahun || '', bulan: (body.bulan || '').toUpperCase(), area_zi: body.area_zi || '',
      kegiatan: body.kegiatan || '', sub_kegiatan: body.sub_kegiatan || '', status: body.status || 'Belum Mulai',
      capaian: body.capaian || '', evidence: body.evidence || '', kendala: body.kendala || '',
      tindak_lanjut: body.tindak_lanjut || '', catatan: body.catatan || '', kategori: body.kategori || 'Bulanan',
    });
    const created = await queryOne('SELECT * FROM kegiatan WHERE id=$id', { id: newId });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
