import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import * as api from '../api';
import Ikon from '../components/Ikon';
import { APP_VERSION } from '../config';
import logo from '../logo.png';

/** Formulir masuk. ulang = sesi berakhir di tengah pekerjaan (tampil di atas aplikasi). */
export default function Masuk({ onMasuk, ulang, idAwal }) {
  const [id, setId] = useState(idAwal || '');
  const [sandi, setSandi] = useState('');
  const [lihat, setLihat] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  async function kirim(e) {
    e.preventDefault();
    if (!id.trim() || !sandi || sibuk) return;
    setSibuk(true); setGalat('');
    try {
      const hasil = await api.masuk(id.trim(), sandi);
      onMasuk(hasil);
    } catch (err) {
      setGalat(err.message);
      setSibuk(false);
    }
  }

  const kartu = (
    <form className="kartu-masuk" onSubmit={kirim}>
      <div className="masuk-merek">
        <img src={logo} alt="Logo Yayasan Eka Harap" />
        <div><strong>Rapat &amp; Tindak Lanjut</strong><small>Yayasan Eka Harap · UNEKA</small></div>
      </div>
      {ulang ? <div className="masuk-info"><Ikon n="kunci" s={15} /><span>Sesi Anda berakhir. Masuk kembali untuk melanjutkan; isian yang sedang dikerjakan tidak hilang.</span></div> : null}
      <label className="field">
        <span className="field-label">ID masuk</span>
        <input autoFocus={!idAwal} value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} />
      </label>
      <label className="field">
        <span className="field-label">Sandi</span>
        <span className="sandi-wadah">
          <input autoFocus={!!idAwal} type={lihat ? 'text' : 'password'} value={sandi} onChange={(e) => setSandi(e.target.value)} autoComplete="current-password" />
          <button type="button" className="tombol-ikon" onClick={() => setLihat((x) => !x)} aria-label={lihat ? 'Sembunyikan sandi' : 'Tampilkan sandi'}><Ikon n="mata" s={16} /></button>
        </span>
      </label>
      {galat ? <div className="galat-form"><Ikon n="peringatan" s={15} /><span>{galat}</span></div> : null}
      <button type="submit" className="tombol utama penuh" disabled={sibuk || !id.trim() || !sandi}>{sibuk ? 'Memeriksa…' : 'Masuk'}</button>
      <small className="masuk-kaki">Lupa sandi? Hubungi Admin. · {APP_VERSION}</small>
    </form>
  );

  if (ulang) return createPortal(<div className="lapis lapis-atas">{kartu}</div>, document.body);
  return <div className="layar-masuk">{kartu}</div>;
}
