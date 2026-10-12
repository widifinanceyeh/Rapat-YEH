import React from 'react';
import { useApp } from '../konteks';
import Ikon from './Ikon';
import { Pilih } from './Pilih';
import { BAWAAN, JENIS_BERKAS, jenisBerkas, opsi, urlAman, salinTeks } from '../utils/data';

const OPSI_BERKAS = JENIS_BERKAS.map((j) => ({ value: j.label, label: j.label })).concat([{ value: 'OTOMATIS', label: 'Deteksi otomatis', meta: 'baca ulang dari alamat / Drive' }]);

/** Label jenis berkas (DOC, PDF, …). Bila onPilih diisi, label dapat diklik untuk memilih jenis secara manual. */
export function LencanaBerkas({ t, onPilih }) {
  const j = jenisBerkas(t);
  const judul = j.tak ? 'Jenis berkas belum terdeteksi' + (onPilih ? ' — klik untuk memilih' : '') : j.label + (onPilih ? ' — klik untuk mengganti' : '');
  const badge = <span className={'jb jb-' + j.kelas + (onPilih ? ' bisa' : '')} title={judul}>{j.tak ? 'DRIVE?' : j.kode}</span>;
  if (!onPilih) return badge;
  return <Pilih pemicu={badge} value={t.jenisBerkas || ''} onChange={(v) => { if (v) onPilih(v); }} opsi={OPSI_BERKAS} cari={false} lebar={230} />;
}

/** Tombol salin tautan tanpa membuka dokumennya. */
export function SalinTautan({ url }) {
  const { toast } = useApp();
  const u = urlAman(url);
  if (!u) return null;
  return (
    <button type="button" className="tombol-ikon" title="Salin tautan" aria-label="Salin tautan"
      onClick={(e) => { e.stopPropagation(); salinTeks(u).then(() => toast('Tautan disalin.', 'sukses'), () => toast('Tautan tidak dapat disalin.', 'galat')); }}>
      <Ikon n="salin" s={14} />
    </button>
  );
}

/**
 * Daftar dokumen di panel rincian. Dikelompokkan per kelompok (Referensi, Output, …);
 * kelompok dan jenis berkas dapat diganti langsung tanpa membuka form.
 */
export function DaftarTautan({ list, kosong = 'Belum ada dokumen.' }) {
  const { data, tulis } = useApp();
  const ada = (list || []).filter((l) => urlAman(l.url));
  if (!ada.length) return <div className="samar kecil">{kosong}</div>;
  const urutan = opsi(data, 'JENIS_DOKUMEN').map((o) => (typeof o === 'string' ? o : o.value));
  const daftarKelompok = urutan.length ? urutan : BAWAAN.JENIS_DOKUMEN;
  const grup = {};
  ada.forEach((l) => { const k = l.jenisDokumen || 'Referensi'; (grup[k] = grup[k] || []).push(l); });
  const kunci = Object.keys(grup).sort((a, b) => {
    const ia = daftarKelompok.indexOf(a); const ib = daftarKelompok.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
  const bisaUbah = (l) => !!(l.id && !/^BARU/.test(String(l.id)));
  const baris = (l, i) => {
    const u = urlAman(l.url);
    const ubah = bisaUbah(l);
    return (
      <li key={(l.id || l.url) + i} className="dok-baris">
        <LencanaBerkas t={l} onPilih={ubah ? (v) => tulis('ubahTautan', { id: l.id, jenisBerkas: v }, { sukses: 'Jenis berkas diperbarui.' }) : null} />
        <a className="dok-judul" href={u} target="_blank" rel="noopener noreferrer" title={l.judul || u} onClick={(e) => e.stopPropagation()}>{l.judul || 'Dokumen'}</a>
        {ubah ? (
          <Pilih pemicu={<span className="dok-kelompok bisa" title="Ganti kelompok">{l.jenisDokumen || 'Referensi'}<Ikon n="bawah" s={12} /></span>}
            value={l.jenisDokumen || 'Referensi'} opsi={daftarKelompok} cari={false} bebas lebar={200}
            onChange={(v) => { if (v && v !== l.jenisDokumen) tulis('ubahTautan', { id: l.id, jenisDokumen: v }, { sukses: 'Kelompok dokumen diperbarui.' }); }} />
        ) : <span className="dok-kelompok">{l.jenisDokumen || 'Referensi'}</span>}
        <SalinTautan url={u} />
        <a className="tombol-ikon" href={u} target="_blank" rel="noopener noreferrer" title="Buka" aria-label="Buka dokumen" onClick={(e) => e.stopPropagation()}><Ikon n="tautan" s={14} /></a>
      </li>
    );
  };
  if (kunci.length < 2) return <ul className="daftar-dok">{ada.map(baris)}</ul>;
  return (
    <div className="daftar-dok-grup">
      {kunci.map((k) => (
        <div key={k}>
          <h5 className="dok-grup-judul">{k}<small>{grup[k].length}</small></h5>
          <ul className="daftar-dok">{grup[k].map(baris)}</ul>
        </div>
      ))}
    </div>
  );
}
