import React, { useEffect, useState } from 'react';
import { useApp } from '../konteks';
import { MenuTitik } from './Pilih';
import Ikon from './Ikon';

export function IndikatorSimpan() {
  const { sinkron } = useApp();
  const [tampil, setTampil] = useState(true);
  useEffect(() => {
    setTampil(true);
    if (sinkron.status === 'tersimpan') {
      const t = window.setTimeout(() => setTampil(false), 4000);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [sinkron]);
  if (sinkron.status === 'diam' || !tampil) return null;
  if (sinkron.status === 'menyimpan') return <span className="indikator menyimpan"><span className="titik-denyut" />Menyimpan…</span>;
  if (sinkron.status === 'tersimpan') return <span className="indikator tersimpan"><Ikon n="centang" s={14} />Tersimpan di sheet</span>;
  return (
    <span className="indikator gagal" title={sinkron.pesan}><Ikon n="peringatan" s={14} />Gagal menyimpan
      {sinkron.ulang ? <button type="button" className="tautan-tombol" onClick={sinkron.ulang}>Simpan ulang</button> : null}
    </span>
  );
}

/** Kepala halaman yang menempel: judul, keterangan, tombol utama, menu ⋯ global. */
export default function Kepala({ judul, sub, aksi }) {
  const { menuGlobal } = useApp();
  return (
    <header className="kepala">
      <div className="kepala-judul"><h1>{judul}</h1>{sub ? <p>{sub}</p> : null}</div>
      <div className="kepala-aksi">
        <IndikatorSimpan />
        {aksi}
        <MenuTitik items={menuGlobal} label="Menu lainnya" />
      </div>
    </header>
  );
}

export function SaringBar({ children, jumlah, onReset, adaSaring }) {
  return (
    <div className="saring">
      {children}
      <div className="saring-kanan">
        {adaSaring ? <button type="button" className="tombol tipis kecil" onClick={onReset}>Reset</button> : null}
        {jumlah !== undefined ? <span className="jumlah-hasil">{jumlah}</span> : null}
      </div>
    </div>
  );
}

export function KotakCari({ value, onChange, placeholder }) {
  return (
    <label className="kotak-cari">
      <Ikon n="cari" s={15} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Cari…'} />
      {value ? <button type="button" className="tombol-ikon" onClick={() => onChange('')} aria-label="Hapus pencarian"><Ikon n="tutup" s={13} /></button> : null}
    </label>
  );
}

/** Pilihan saring berbentuk tombol pil (single). */
export function Segmen({ value, onChange, opsi }) {
  return (
    <div className="segmen" role="tablist">
      {opsi.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'aktif' : ''} onClick={() => onChange(o.value)}>
          {o.label}{o.jumlah !== undefined ? <span>{o.jumlah}</span> : null}
        </button>
      ))}
    </div>
  );
}
