import React, { useState } from 'react';
import Ikon from '../components/Ikon';

const sama = (a, b) => JSON.stringify(a === undefined || a === null ? '' : a) === JSON.stringify(b === undefined || b === null ? '' : b);

/** Hanya isian yang berubah yang dikirim. */
export function selisih(awal, kini) {
  const out = {};
  Object.keys(kini).forEach((k) => { if (!sama(awal[k], kini[k])) out[k] = kini[k]; });
  return out;
}

export function useIsian(awal, draf) {
  const [v, setV] = useState(() => Object.assign({}, awal, draf || {}));
  const set = (k, x) => setV((s) => Object.assign({}, s, { [k]: x }));
  return [v, set, setV];
}

export function GalatForm({ pesan }) {
  if (!pesan) return null;
  return <div className="galat-form"><Ikon n="peringatan" s={16} /><span><b>Belum tersimpan.</b> {pesan} Isian Anda masih utuh.</span></div>;
}

export function Kaki({ onBatal, label = 'Simpan', form, nonaktif, sibuk }) {
  return (
    <>
      <button type="button" className="tombol" onClick={onBatal}>Batal</button>
      <button type="submit" form={form} className="tombol utama" disabled={nonaktif || sibuk}>{sibuk ? 'Menyimpan…' : label}</button>
    </>
  );
}
