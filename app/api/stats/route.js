import { query, queryOne } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const totalRow = await queryOne("SELECT COUNT(*) as c FROM kegiatan");
    const selRow = await queryOne("SELECT COUNT(*) as c FROM kegiatan WHERE status='Selesai'");
    const proRow = await queryOne("SELECT COUNT(*) as c FROM kegiatan WHERE status='Dalam Proses'");
    const belRow = await queryOne("SELECT COUNT(*) as c FROM kegiatan WHERE status='Belum Mulai'");
    const terRow = await queryOne("SELECT COUNT(*) as c FROM kegiatan WHERE status='Tertunda'");
    const total = totalRow ? Number(totalRow.c) : 0;
    const selesai = selRow ? Number(selRow.c) : 0;
    const proses = proRow ? Number(proRow.c) : 0;
    const belum = belRow ? Number(belRow.c) : 0;
    const tertunda = terRow ? Number(terRow.c) : 0;
    const byArea = await query("SELECT area_zi, COUNT(*) as total, SUM(CASE WHEN status='Selesai' THEN 1 ELSE 0 END) as selesai, SUM(CASE WHEN status='Dalam Proses' THEN 1 ELSE 0 END) as proses, SUM(CASE WHEN status='Belum Mulai' THEN 1 ELSE 0 END) as belum FROM kegiatan GROUP BY area_zi ORDER BY area_zi");
    const byBulan = await query("SELECT bulan, COUNT(*) as total, SUM(CASE WHEN status='Selesai' THEN 1 ELSE 0 END) as selesai, SUM(CASE WHEN status='Dalam Proses' THEN 1 ELSE 0 END) as proses, SUM(CASE WHEN status='Belum Mulai' THEN 1 ELSE 0 END) as belum FROM kegiatan GROUP BY bulan ORDER BY CASE bulan WHEN 'JANUARI' THEN 1 WHEN 'FEBRUARI' THEN 2 WHEN 'MARET' THEN 3 WHEN 'APRIL' THEN 4 WHEN 'MEI' THEN 5 WHEN 'JUNI' THEN 6 WHEN 'JULI' THEN 7 WHEN 'AGUSTUS' THEN 8 WHEN 'SEPTEMBER' THEN 9 WHEN 'OKTOBER' THEN 10 WHEN 'NOVEMBER' THEN 11 WHEN 'DESEMBER' THEN 12 END");
    const byStatus = await query("SELECT status, COUNT(*) as count FROM kegiatan GROUP BY status");
    let byKategori = [];
    try { byKategori = await query("SELECT COALESCE(kategori,'Bulanan') as kategori, COUNT(*) as total, SUM(CASE WHEN status='Selesai' THEN 1 ELSE 0 END) as selesai FROM kegiatan GROUP BY COALESCE(kategori,'Bulanan')"); } catch(e) {}
    return NextResponse.json({ total, selesai, proses, belum, tertunda, byArea, byBulan, byStatus, byKategori });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
