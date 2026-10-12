import React from 'react';
import Ikon from './Ikon';
import { inisial, namaPendek } from '../utils/format';

export function Lencana({ nada = 'abu', children, kecil }) {
  return <span className={'lencana nada-' + nada + (kecil ? ' kecil' : '')}>{children}</span>;
}

export function Field({ label, wajib, petunjuk, children, lebar }) {
  return (
    <div className={'field' + (lebar ? ' lebar-' + lebar : '')}>
      <span className="field-label">{label}{wajib ? <b className="wajib">*</b> : null}</span>
      {children}
      {petunjuk ? <small className="field-petunjuk">{petunjuk}</small> : null}
    </div>
  );
}

/** Kelompok isian yang dapat dilipat agar form tetap ringkas. */
export function Lipat({ judul, ringkas, terbuka, children }) {
  return (
    <details className="lipat" open={terbuka}>
      <summary><Ikon n="kanan" s={14} /><span>{judul}</span>{ringkas ? <small>{ringkas}</small> : null}</summary>
      <div className="lipat-isi">{children}</div>
    </details>
  );
}

export function Bagian({ judul, jumlah, aksi, children }) {
  return (
    <section className="bagian">
      <div className="bagian-kepala"><h3>{judul}{jumlah !== undefined ? <span className="jumlah">{jumlah}</span> : null}</h3>{aksi}</div>
      {children}
    </section>
  );
}

export function Kosong({ children, ikon = 'daftar' }) {
  return <div className="kosong"><Ikon n={ikon} s={20} /><span>{children}</span></div>;
}

export { DaftarTautan } from './Dokumen';

export function Orang({ nama, kosong = '—' }) {
  if (!nama) return <span className="samar">{kosong}</span>;
  return <span className="orang" title={nama}><span className="avatar">{inisial(nama)}</span><span>{namaPendek(nama)}</span></span>;
}

export function Info({ label, children }) {
  return <div className="info"><span>{label}</span><div>{children}</div></div>;
}
