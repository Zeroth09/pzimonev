'use client';
import React, { useState, useEffect, useCallback } from 'react';
const BULAN_ORDER = ['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
const BULAN_SHORT = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGS','SEP','OKT','NOV','DES'];
const AREA_LIST = ['MANAJEMEN SDM','PENGUATAN PENGAWASAN','PENGUATAN AKUNTABILITAS','PENATAAN TATA LAKSANA','PELAYANAN PUBLIK','MANAJEMEN PERUBAHAN'];
const AREA_ICONS = { 'MANAJEMEN SDM': 'U+1F465', 'PENGUATAN PENGAWASAN': 'U+1F50D', 'PENGUATAN AKUNTABILITAS': 'U+1F4CA', 'PENATAAN TATA LAKSANA': 'U+2699', 'PELAYANAN PUBLIK': 'U+1F3DB', 'MANAJEMEN PERUBAHAN': 'U+1F504' };
const AREA_COLORS = { 'MANAJEMEN SDM': '#6366f1', 'PENGUATAN PENGAWASAN': '#ec4899', 'PENGUATAN AKUNTABILITAS': '#14b8a6', 'PENATAAN TATA LAKSANA': '#f59e0b', 'PELAYANAN PUBLIK': '#8b5cf6', 'MANAJEMEN PERUBAHAN': '#06b6d4' };
const STATUS_LIST = ['Belum Mulai', 'Dalam Proses', 'Selesai', 'Tertunda'];
const STATUS_COLORS = { 'Belum Mulai': '#d97706', 'Dalam Proses': '#2563eb', 'Selesai': '#16a34a', 'Tertunda': '#6b7280' };

function AreaIcon({ code }) {
  const icons = { 'U+1F465': '\u{1F465}', 'U+1F50D': '\u{1F50D}', 'U+1F4CA': '\u{1F4CA}', 'U+2699': '\u2699', 'U+1F3DB': '\u{1F3DB}', 'U+1F504': '\u{1F504}' };
  return <span>{icons[code] || '?'}</span>;
}

export default function Home() {
  const [allData, setAllData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedArea, setSelectedArea] = useState(null);
  const [view, setView] = useState('board');
  const [panel, setPanel] = useState(null);
  const [panelSaving, setPanelSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, resStats] = await Promise.all([fetch('/api/kegiatan'), fetch('/api/stats')]);
      const data = await resData.json();
      const st = await resStats.json();
      setAllData(Array.isArray(data) ? data : []);
      setStats(st && typeof st === 'object' && !st.error ? st : null);
    } catch (e) { console.error(e); setAllData([]); setStats(null); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  const currentBulan = BULAN_ORDER[selectedMonth];

  const filtered = allData.filter(d => {
    if (d.bulan !== currentBulan) return false;
    if (selectedArea && d.area_zi !== selectedArea) return false;
    if (selectedStatus && d.status !== selectedStatus) return false;
    if (search) {
      const hay = [d.id, d.kegiatan, d.sub_kegiatan, d.capaian, d.kendala].join(' ').toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const grouped = {};
  if (selectedArea) {
    grouped[selectedArea] = filtered;
  } else {
    AREA_LIST.forEach(area => {
      const items = filtered.filter(d => d.area_zi === area);
      if (items.length) grouped[area] = items;
    });
  }

  const monthStats = {
    total: filtered.length,
    selesai: filtered.filter(d => d.status === 'Selesai').length,
    proses: filtered.filter(d => d.status === 'Dalam Proses').length,
    belum: filtered.filter(d => d.status === 'Belum Mulai').length,
    tertunda: filtered.filter(d => d.status === 'Tertunda').length,
  };
  const monthPct = monthStats.total ? Math.round((monthStats.selesai / monthStats.total) * 100) : 0;

  async function quickUpdate(id, fields) {
    setPanelSaving(true);
    try {
      const res = await fetch('/api/kegiatan/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      if (res.ok) {
        const updated = await res.json();
        setAllData(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
        setPanel(prev => prev ? { ...prev, data: { ...prev.data, ...updated } } : null);
        showToast('Berhasil diupdate');
      }
    } catch { showToast('Gagal update'); }
    setPanelSaving(false);
  }

  async function handleDelete(id) {
    const res = await fetch('/api/kegiatan/' + id, { method: 'DELETE' });
    if (res.ok) {
      setAllData(prev => prev.filter(d => d.id !== id));
      setPanel(null);
      showToast('Dihapus');
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">ZI</div>
          <div><div className="brand-title">Monev ZI</div><div className="brand-sub">RSJ Mutiara Sukma</div></div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Area ZI</div>
          <button className={'sidebar-btn' + (selectedArea === null ? ' active' : '')} onClick={() => setSelectedArea(null)}>
            <span className="sidebar-btn-icon">+</span><span>Semua Area</span>
            <span className="sidebar-count">{filtered.length}</span>
          </button>
          {AREA_LIST.map(function(area) {
            var count = filtered.filter(function(d) { return d.area_zi === area; }).length;
            return (
              <button key={area} className={'sidebar-btn' + (selectedArea === area ? ' active' : '')} onClick={() => setSelectedArea(area)}>
                <span className="sidebar-btn-icon"><AreaIcon code={AREA_ICONS[area]} /></span>
                <span className="sidebar-btn-text">{area}</span>
                <span className="sidebar-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">View</div>
          <div className="view-toggle">
            <button className={'view-btn' + (view === 'board' ? ' active' : '')} onClick={() => setView('board')}>Board</button>
            <button className={'view-btn' + (view === 'list' ? ' active' : '')} onClick={() => setView('list')}>List</button>
          </div>
        </div>

        {stats && (
          <div className="sidebar-section sidebar-stats">
            <div className="sidebar-label">Progress Keseluruhan</div>
            <div className="progress-ring-container">
              <ProgressRing value={stats.total ? Math.round(stats.selesai / stats.total * 100) : 0} size={80} />
              <div className="progress-ring-label">
                <span className="big">{stats.selesai}</span>
                <span className="small">/ {stats.total} selesai</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="main-area">
        <div className="topbar">
          <div className="month-nav">
            <button className="month-arrow" onClick={() => setSelectedMonth(function(m) { return m === 0 ? 11 : m - 1; })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="month-display">
              <span className="month-name">{currentBulan}</span>
              <span className="month-year">2026</span>
            </div>
            <button className="month-arrow" onClick={() => setSelectedMonth(function(m) { return m === 11 ? 0 : m + 1; })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="month-tabs">
            {BULAN_SHORT.map(function(b, i) {
              return (
                <button key={b} className={'month-tab' + (i === selectedMonth ? ' active current' : '')} onClick={() => setSelectedMonth(i)}>
                  {b}
                </button>
              );
            })}
锄
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Cari..." value={search} onChange={function(e) { setSearch(e.target.value); }} />
            </div>
          </div>
        </div>

        <div className="month-summary">
          <div className={'summary-pill clickable' + (selectedStatus === null ? ' active' : '')} onClick={() => setSelectedStatus(null)}><span className="pill-num">{monthStats.total}</span><span className="pill-label">Total</span></div>
          <div className={'summary-pill pill-selesai clickable' + (selectedStatus === 'Selesai' ? ' active' : '')} onClick={() => setSelectedStatus(selectedStatus === 'Selesai' ? null : 'Selesai')}><span className="pill-num">{monthStats.selesai}</span><span className="pill-label">Selesai</span></div>
          <div className={'summary-pill pill-proses clickable' + (selectedStatus === 'Dalam Proses' ? ' active' : '')} onClick={() => setSelectedStatus(selectedStatus === 'Dalam Proses' ? null : 'Dalam Proses')}><span className="pill-num">{monthStats.proses}</span><span className="pill-label">Proses</span></div>
          <div className={'summary-pill pill-belum clickable' + (selectedStatus === 'Belum Mulai' ? ' active' : '')} onClick={() => setSelectedStatus(selectedStatus === 'Belum Mulai' ? null : 'Belum Mulai')}><span className="pill-num">{monthStats.belum}</span><span className="pill-label">Belum</span></div>
          <div className={'summary-pill pill-tertunda clickable' + (selectedStatus === 'Tertunda' ? ' active' : '')} onClick={() => setSelectedStatus(selectedStatus === 'Tertunda' ? null : 'Tertunda')}><span className="pill-num">{monthStats.tertunda}</span><span className="pill-label">Tertunda</span></div>
          <div className="month-progress-bar">
            <div className="month-progress-fill" style={{width: monthPct + '%'}} />
            <span className="month-progress-text">{monthPct}% selesai</span>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" />Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">X</div>
            <h3>Belum ada kegiatan</h3>
            <p>Tidak ada untuk {currentBulan}{selectedArea ? ' di ' + selectedArea : ''}.</p>
          </div>
        ) : view === 'board' ? (
          <BoardView grouped={grouped} onCardClick={function(d) { setPanel({mode: 'detail', data: d}); }} />
        ) : (
          <ListView data={filtered} onRowClick={function(d) { setPanel({mode: 'detail', data: d}); }} />
        )}
      </main>

      {panel && (
        <>
          <div className="panel-backdrop" onClick={() => setPanel(null)} />
          <div className="slide-panel">
            <div className="panel-header">
              <div className="panel-header-left">
                <span className="panel-id">{panel.data.id}</span>
                <StatusPill status={panel.data.status} />
              </div>
              <button className="panel-close" onClick={() => setPanel(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="panel-body">
              <h2 className="panel-title">{panel.data.kegiatan}</h2>
              {panel.data.sub_kegiatan && <p className="panel-subtitle">{panel.data.sub_kegiatan}</p>}
              <div className="panel-meta">
                <span className="meta-tag" style={{background: AREA_COLORS[panel.data.area_zi] + '20', color: AREA_COLORS[panel.data.area_zi]}}>
                  {panel.data.area_zi}
                </span>
                <span className="meta-tag">{panel.data.bulan} {panel.data.tahun}</span>
              </div>

              <div className="panel-section">
                <label className="panel-label">Status</label>
                <div className="status-chips">
                  {STATUS_LIST.map(function(s) {
                    return (
                      <button key={s} className={'status-chip' + (panel.data.status === s ? ' active' : '')} style={{'--chip-color': STATUS_COLORS[s]}}
                        onClick={() => quickUpdate(panel.data.id, {status: s})} disabled={panelSaving}>
                        <span className="chip-dot" />{s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="panel-section"><label className="panel-label">Capaian</label>
                <EditableArea value={panel.data.capaian} placeholder="Klik untuk isi capaian..." onSave={function(val) { quickUpdate(panel.data.id, {capaian: val}); }} disabled={panelSaving} />
              </div>
              <div className="panel-section"><label className="panel-label">Kendala</label>
                <EditableArea value={panel.data.kendala} placeholder="Klik untuk isi kendala..." onSave={function(val) { quickUpdate(panel.data.id, {kendala: val}); }} disabled={panelSaving} />
              </div>
              <div className="panel-section"><label className="panel-label">Tindak Lanjut</label>
                <EditableArea value={panel.data.tindak_lanjut} placeholder="Klik untuk isi..." onSave={function(val) { quickUpdate(panel.data.id, {tindak_lanjut: val}); }} disabled={panelSaving} />
              </div>
              <div className="panel-section"><label className="panel-label">Evidence</label>
                <EditableArea value={panel.data.evidence} placeholder="Klik untuk isi link..." onSave={function(val) { quickUpdate(panel.data.id, {evidence: val}); }} disabled={panelSaving} isLink />
              </div>
            </div>
            <div className="panel-footer">
              <button className="btn btn-danger btn-sm" onClick={function() { if (confirm('Yakin hapus?')) handleDelete(panel.data.id); }}>Hapus</button>
              <button className="btn btn-secondary btn-sm" onClick={function() { fetchData(); }}>Refresh</button>
            </div>
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function EditableArea({value, placeholder, onSave, disabled, isLink}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  function startEdit() { setDraft(value || ''); setEditing(true); }
  function save() { onSave(draft); setEditing(false); }
  function cancel() { setDraft(value || ''); setEditing(false); }
  if (editing) {
    return (
      <div className="editable-editing">
        <textarea className="editable-textarea" value={draft} onChange={function(e) { setDraft(e.target.value); }} rows={3} autoFocus
          onKeyDown={function(e) { if (e.key === 'Enter' && e.ctrlKey) save(); if (e.key === 'Escape') cancel(); }} />
        <div className="editable-actions">
          <button className="btn btn-success btn-sm" onClick={save} disabled={disabled}>Simpan</button>
          <button className="btn btn-secondary btn-sm" onClick={cancel}>Batal</button>
          <span className="editable-hint">Ctrl+Enter</span>
        </div>
      </div>
    );
  }
  return (
    <div className="editable-display" onClick={startEdit}>
      {value ? (isLink ? <a href={value} target="_blank" rel="noreferrer" className="editable-link" onClick={function(e) { e.stopPropagation(); }}>{value}</a> : <span className="editable-value">{value}</span>) : <span className="editable-placeholder">{placeholder}</span>}
      <svg className="editable-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </div>
  );
}

function BoardView({grouped, onCardClick}) {
  return (
    <div className="board">
      {Object.entries(grouped).map(function(entry) {
        var area = entry[0];
        var items = entry[1];
        return (
          <div key={area} className="board-column">
            <div className="column-header" style={{borderTopColor: AREA_COLORS[area]}}>
              <span className="column-icon"><AreaIcon code={AREA_ICONS[area]} /></span>
              <span className="column-title">{area.replace('MANAJEMEN ','').replace('PENGUATAN ','')}</span>
              <span className="column-count">{items.length}</span>
            </div>
            <div className="column-body">
              {items.map(function(d) {
                return (
                  <div key={d.id} className="kanban-card" onClick={() => onCardClick(d)}>
                    <div className="card-top">
                      <span className="card-id">{d.id}</span>
                      <StatusPill status={d.status} small />
                    </div>
                    <p className="card-title">{d.kegiatan}</p>
                    {d.sub_kegiatan && <p className="card-desc">{d.sub_kegiatan.length > 80 ? d.sub_kegiatan.substring(0,80) + '...' : d.sub_kegiatan}</p>}
                    <div className="card-footer">
                      {d.capaian ? <span className="card-tag tag-filled">v Capaian</span> : <span className="card-tag tag-empty">x Belum ada capaian</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({data, onRowClick}) {
  return (
    <div className="list-view">
      <div className="list-header">
        <span className="lh-id">ID</span><span className="lh-area">Area</span><span className="lh-kegiatan">Kegiatan</span>
        <span className="lh-status">Status</span><span className="lh-cap">Capaian</span><span className="lh-kendala">Kendala</span>
      </div>
      {data.map(function(d) {
        return (
          <div key={d.id} className="list-row" onClick={() => onRowClick(d)}>
            <span className="lr-id">{d.id}</span>
            <span className="lr-area"><span className="area-dot" style={{background: AREA_COLORS[d.area_zi]}} />{d.area_zi && d.area_zi.length > 15 ? d.area_zi.substring(0,15) + '...' : d.area_zi}</span>
            <span className="lr-kegiatan">{d.kegiatan && d.kegiatan.length > 60 ? d.kegiatan.substring(0,60) + '...' : d.kegiatan}</span>
            <span className="lr-status"><StatusPill status={d.status} small /></span>
            <span className="lr-cap">{d.capaian ? <span className="cap-filled">v</span> : <span className="cap-empty">-</span>}</span>
            <span className="lr-kendala">{d.kendala ? <span className="cap-kendala">x</span> : <span className="cap-empty">-</span>}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({status, small}) {
  var color = STATUS_COLORS[status] || '#6b7280';
  return <span className={'status-pill' + (small ? ' small' : '')} style={{background: color + '18', color: color, borderColor: color + '40'}}>{status}</span>;
}

function ProgressRing({value, size}) {
  if (size === undefined) size = 60;
  var r = (size - 8) / 2;
  var c = 2 * Math.PI * r;
  var offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#16a34a" strokeWidth="6"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={'rotate(-90 ' + (size/2) + ' ' + (size/2) + ')'} style={{transition: 'stroke-dashoffset .6s ease'}} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.22} fontWeight="700" fill="#1a1a2e">{value}%</text>
    </svg>
  );
}
