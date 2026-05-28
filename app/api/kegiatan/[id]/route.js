import { query, queryOne, execute } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const row = await queryOne('SELECT * FROM kegiatan WHERE id=$id', { id });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await execute("UPDATE kegiatan SET tahun=$tahun, bulan=$bulan, area_zi=$area_zi, kegiatan=$kegiatan, sub_kegiatan=$sub_kegiatan, status=$status, capaian=$capaian, evidence=$evidence, kendala=$kendala, tindak_lanjut=$tindak_lanjut, catatan=$catatan, kategori=$kategori, updated_at=datetime('now','localtime') WHERE id=$id", {
      id, tahun: body.tahun || '', bulan: (body.bulan || '').toUpperCase(), area_zi: body.area_zi || '',
      kegiatan: body.kegiatan || '', sub_kegiatan: body.sub_kegiatan || '', status: body.status || 'Belum Mulai',
      capaian: body.capaian || '', evidence: body.evidence || '', kendala: body.kendala || '',
      tindak_lanjut: body.tindak_lanjut || '', catatan: body.catatan || '', kategori: body.kategori || 'Bulanan',
    });
    const updated = await queryOne('SELECT * FROM kegiatan WHERE id=$id', { id });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const fields = Object.keys(body).filter(function(k) { return k !== 'id'; });
    if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 });
    const sets = fields.map(function(f) { return f + '=$' + f; }).join(', ');
    const args = {};
    fields.forEach(function(f) { args[f] = body[f]; });
    args.id = id;
    await execute("UPDATE kegiatan SET " + sets + ", updated_at=datetime('now','localtime') WHERE id=$id", args);
    const updated = await queryOne('SELECT * FROM kegiatan WHERE id=$id', { id });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await execute('DELETE FROM kegiatan WHERE id=$id', { id });
    if (result.rowsAffected === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
