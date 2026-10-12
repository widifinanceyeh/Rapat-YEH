import React, { useMemo, useState } from 'react';
import Ikon from './Ikon';
import { kelompokUnit } from '../utils/data';

const SEMUA = '*';
const TERPILIH = '+';

/** Kotak centang yang bisa berstatus setengah (sebagian anggota unit dipilih). */
function CentangGrup({ status, onChange, label }) {
  return (
    <input type="checkbox" aria-label={label} checked={status === 'semua'}
      ref={(el) => { if (el) el.indeterminate = status === 'sebagian'; }}
      onChange={onChange} />
  );
}

/**
 * Pemilih peserta: daftar centang langsung di dalam form, dikelompokkan per unit,
 * dengan pencarian dan saring unit. value = array ID_ORANG.
 * opsi: hasil opsiOrangId (memuat label, jabatan, unit, no, cari).
 */
export default function PilihPeserta({ value, onChange, opsi, catatanLama }) {
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState(SEMUA);
  const sel = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const terpilih = useMemo(() => { const m = {}; sel.forEach((v) => { m[v] = 1; }); return m; }, [sel]);

  // Nilai tersimpan yang tidak ada di daftar (orang nonaktif / terhapus) tetap ditampilkan agar bisa dilepas.
  const semua = useMemo(() => {
    const ada = {};
    const list = (opsi || []).map((o) => { ada[o.value] = 1; return o; });
    sel.forEach((v) => { if (!ada[v]) list.push({ value: v, label: v, jabatan: 'tidak ada di DaftarOrang aktif', unit: '', no: Infinity, cari: v }); });
    return list;
  }, [opsi, sel]);
  const grupSemua = useMemo(() => kelompokUnit(semua), [semua]);

  const s = q.trim().toLowerCase();
  const cocok = (o) => !s || [o.label, o.jabatan, o.unit, o.cari].some((x) => String(x || '').toLowerCase().indexOf(s) !== -1);
  const grupTampil = grupSemua
    .filter((g) => unit === SEMUA || unit === TERPILIH || g.kunci === unit)
    .map((g) => Object.assign({}, g, { items: g.items.filter((o) => cocok(o) && (unit !== TERPILIH || terpilih[o.value])) }))
    .filter((g) => g.items.length);
  const tampil = grupTampil.reduce((n, g) => n + g.items.length, 0);

  const ubah = (ids, pilih) => {
    if (pilih) onChange(sel.concat(ids.filter((v) => !terpilih[v])));
    else { const buang = {}; ids.forEach((v) => { buang[v] = 1; }); onChange(sel.filter((v) => !buang[v])); }
  };
  const statusGrup = (items) => {
    const n = items.filter((o) => terpilih[o.value]).length;
    return n === 0 ? 'tidak' : n === items.length ? 'semua' : 'sebagian';
  };
  const ringkasan = grupSemua.map((g) => ({ label: g.label, n: g.items.filter((o) => terpilih[o.value]).length })).filter((x) => x.n);

  return (
    <div className="peserta-pilih">
      <div className="peserta-alat">
        <div className="kotak-cari">
          <Ikon n="cari" s={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, jabatan, atau unit…"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault(); // jangan kirim form
              if (tampil === 1) { const o = grupTampil[0].items[0]; ubah([o.value], !terpilih[o.value]); setQ(''); }
            }} />
          {q ? <button type="button" className="tombol-ikon" aria-label="Hapus pencarian" onClick={() => setQ('')}><Ikon n="tutup" s={13} /></button> : null}
        </div>
        <div className="segmen kecil" role="tablist">
          <button type="button" className={unit === SEMUA ? 'aktif' : ''} onClick={() => setUnit(SEMUA)}>Semua <span>{semua.length}</span></button>
          {grupSemua.map((g) => (
            <button type="button" key={g.kunci} className={unit === g.kunci ? 'aktif' : ''} onClick={() => setUnit(g.kunci)}>{g.label} <span>{g.items.length}</span></button>
          ))}
          <button type="button" className={unit === TERPILIH ? 'aktif' : ''} onClick={() => setUnit(TERPILIH)}>Terpilih <span>{sel.length}</span></button>
        </div>
      </div>

      <div className="peserta-daftar">
        {grupTampil.map((g) => {
          const st = statusGrup(g.items);
          return (
            <div className="peserta-grup" key={g.kunci}>
              <label className="peserta-grup-kepala">
                <CentangGrup status={st} label={'Pilih semua ' + g.label} onChange={() => ubah(g.items.map((o) => o.value), st !== 'semua')} />
                <strong>{g.label}</strong>
                <small>{g.items.filter((o) => terpilih[o.value]).length}/{g.items.length}{s ? ' cocok' : ''}</small>
              </label>
              <div className="peserta-grid">
                {g.items.map((o) => {
                  const aktif = !!terpilih[o.value];
                  return (
                    <label key={String(o.value)} className={'peserta-opsi' + (aktif ? ' aktif' : '')} title={o.cari || o.label}>
                      <input type="checkbox" checked={aktif} onChange={() => ubah([o.value], !aktif)} />
                      <span><b>{o.label}</b>{o.jabatan ? <small>{o.jabatan}</small> : null}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!tampil ? <div className="pop-kosong">{unit === TERPILIH && !s ? 'Belum ada peserta dipilih.' : 'Tidak ada yang cocok.'}</div> : null}
      </div>

      <div className="peserta-kaki">
        <span>
          {sel.length ? <><b>{sel.length} dipilih</b>{ringkasan.map((x) => <span key={x.label} className="samar"> · {x.label} {x.n}</span>)}</>
            : <span className="samar">{catatanLama ? 'Data lama: ' + catatanLama : 'Belum ada peserta dipilih.'}</span>}
        </span>
        {sel.length ? <button type="button" className="tautan-tombol" onClick={() => onChange([])}>Kosongkan</button> : null}
      </div>
    </div>
  );
}
