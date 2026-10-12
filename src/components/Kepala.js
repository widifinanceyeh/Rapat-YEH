import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../konteks';
import { MenuTitik } from './Pilih';
import Popover from './Popover';
import Ikon from './Ikon';
import { riwayat, mundur, maju } from '../navigasi';
import { inisial, namaPendek } from '../utils/format';

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

/** Tombol ← → seperti peramban: berpindah antar halaman/panel yang pernah dibuka. */
export function NavRiwayat() {
  const r = riwayat();
  return (
    <div className="nav-riwayat">
      <button type="button" className="tombol-ikon" onClick={mundur} disabled={!r.mundur} aria-label="Kembali" title="Kembali"><Ikon n="kiri" s={18} /></button>
      <button type="button" className="tombol-ikon" onClick={maju} disabled={!r.maju} aria-label="Maju" title="Maju"><Ikon n="kanan" s={18} /></button>
    </div>
  );
}

/** Akun yang sedang masuk: inisial + nama; menu berisi pengaturan akun, ganti sandi, dan keluar. */
function MenuAkun() {
  const { pengguna, buka, keluar } = useApp();
  const jangkar = useRef(null);
  const [terbuka, setTerbuka] = useState(false);
  const tutup = useCallback(() => setTerbuka(false), []);
  if (!pengguna) return null;
  const pilih = (fn) => () => { tutup(); fn(); };
  return (
    <>
      <button type="button" ref={jangkar} className={'akun-tombol' + (terbuka ? ' buka' : '')} onClick={() => setTerbuka((x) => !x)} title={pengguna.nama + ' · ' + pengguna.peran} aria-label="Akun">
        <span className="avatar akun-avatar">{inisial(pengguna.nama)}</span>
        <span className="akun-nama">{namaPendek(pengguna.nama)}</span>
        <Ikon n="bawah" s={13} />
      </button>
      <Popover jangkar={jangkar} buka={terbuka} onTutup={tutup} lebar={240} rata="kanan" className="menu-titik">
        <div className="akun-info"><strong>{pengguna.nama}</strong><small>ID: {pengguna.username} · {pengguna.peran}</small></div>
        <div className="pop-daftar">
          <button type="button" className="pop-opsi" onClick={pilih(() => buka('pengaturan'))}><span>Pengaturan akun</span></button>
          <button type="button" className="pop-opsi" onClick={pilih(() => buka('pengaturan', '', { aksi: 'sandi' }))}><span>Ganti sandi</span></button>
          <div className="pop-garis" />
          <button type="button" className="pop-opsi bahaya" onClick={pilih(keluar)}><span>Keluar</span></button>
        </div>
      </Popover>
    </>
  );
}

/** Kepala halaman yang menempel: ← →, judul, keterangan, tombol utama, menu ⋯ global, akun. */
export default function Kepala({ judul, sub, aksi }) {
  const { menuGlobal } = useApp();
  return (
    <header className="kepala">
      <NavRiwayat />
      <div className="kepala-judul"><h1>{judul}</h1>{sub ? <p>{sub}</p> : null}</div>
      <div className="kepala-aksi">
        <IndikatorSimpan />
        {aksi}
        <MenuTitik items={menuGlobal} label="Menu lainnya" />
        <MenuAkun />
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
