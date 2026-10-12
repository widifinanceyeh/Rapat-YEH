import React, { useEffect, useRef, useState } from 'react';
import { Pilih } from './Pilih';
import { Lencana, Orang } from './Dasar';
import Ikon from './Ikon';
import { tgl, kunciTanggal } from '../utils/format';

/** Ubah di tempat: lencana yang dapat diklik untuk memilih nilai baru; tersimpan otomatis. */
export function EditPilihan({ value, opsi, onSimpan, nada, label, kosong = '—', disabled }) {
  if (disabled) return <Lencana nada={nada ? nada(value) : 'abu'}>{label ? label(value) : (value || kosong)}</Lencana>;
  return (
    <Pilih value={value} onChange={(v) => { if (v !== value) onSimpan(v); }} opsi={opsi} lebar={220}
      pemicu={<button type="button" className="edit-sel" title="Klik untuk mengubah">
        {value ? <Lencana nada={nada ? nada(value) : 'abu'}>{label ? label(value) : value}</Lencana> : <span className="samar">{kosong}</span>}
        <Ikon n="bawah" s={12} />
      </button>} />
  );
}

export function EditOrang({ value, opsi, onSimpan, kosong = 'Pilih PIC' }) {
  return (
    <Pilih value={value} onChange={(v) => { if (v !== value) onSimpan(v); }} opsi={opsi} bebas kosong="— kosongkan —" lebar={280}
      pemicu={<button type="button" className="edit-sel" title="Klik untuk mengubah">
        {value ? <Orang nama={value} /> : <span className="samar">{kosong}</span>}<Ikon n="bawah" s={12} />
      </button>} />
  );
}

export function EditTanggal({ value, onSimpan, nada }) {
  const [ubah, setUbah] = useState(false);
  const ref = useRef(null);
  const k = kunciTanggal(value);
  useEffect(() => { if (ubah && ref.current) { ref.current.focus(); try { ref.current.showPicker(); } catch (e) { /* tidak didukung */ } } }, [ubah]);
  if (ubah) {
    return (
      <input ref={ref} type="date" className="input-kecil" defaultValue={k}
        onBlur={(e) => { setUbah(false); if (e.target.value !== k) onSimpan(e.target.value); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setUbah(false); }} />
    );
  }
  return (
    <button type="button" className={'edit-sel tanggal' + (nada ? ' nada-teks-' + nada : '')} onClick={(e) => { e.stopPropagation(); setUbah(true); }} title="Klik untuk mengubah">
      {k ? tgl(k) : <span className="samar">Atur target</span>}
    </button>
  );
}

/** Teks panjang yang tersimpan otomatis setelah jeda mengetik. */
export function EditTeks({ value, onSimpan, placeholder, jeda = 800 }) {
  const [v, setV] = useState(value || '');
  const awal = useRef(value || '');
  const timer = useRef(null);
  const terakhir = useRef(value || '');
  const simpanRef = useRef(onSimpan);
  simpanRef.current = onSimpan;
  useEffect(() => { if ((value || '') !== awal.current) { awal.current = value || ''; terakhir.current = value || ''; setV(value || ''); } }, [value]);
  function kirim(nilai) {
    window.clearTimeout(timer.current);
    if (nilai === awal.current) return;
    awal.current = nilai;
    simpanRef.current(nilai);
  }
  // Panel ditutup sebelum jeda habis → ketikan tetap dikirim.
  useEffect(() => () => {
    window.clearTimeout(timer.current);
    if (terakhir.current !== awal.current) simpanRef.current(terakhir.current);
  }, []);
  return (
    <textarea className="edit-teks" value={v} placeholder={placeholder} rows={3}
      onChange={(e) => { const n = e.target.value; setV(n); terakhir.current = n; window.clearTimeout(timer.current); timer.current = window.setTimeout(() => kirim(n), jeda); }}
      onBlur={() => kirim(v)} />
  );
}
