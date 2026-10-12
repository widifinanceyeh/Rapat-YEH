import React, { useMemo, useState } from 'react';
import { useApp } from '../konteks';
import { Pilih } from './Pilih';
import { opsiOrang, opsiOrangId } from '../utils/data';

/** Tambah orang baru ke DaftarOrang tanpa meninggalkan form. */
export function OrangBaru({ onSelesai, namaAwal = '' }) {
  const { tulis } = useApp();
  const [v, setV] = useState({ nama: namaAwal, jabatan: '', unit: '' });
  const [sibuk, setSibuk] = useState(false);
  async function simpan() {
    if (!v.nama.trim() || sibuk) return;
    setSibuk(true);
    const r = await tulis('addOrang', { nama: v.nama.trim(), jabatan: v.jabatan.trim(), unit: v.unit.trim() }, { optimis: false, sukses: 'Nama ditambahkan ke DaftarOrang.' });
    setSibuk(false);
    if (r && r.id) onSelesai({ ID_ORANG: r.id, NAMA: v.nama.trim(), JABATAN: v.jabatan.trim(), UNIT: v.unit.trim() });
  }
  const enter = (e) => { if (e.key === 'Enter') { e.preventDefault(); simpan(); } };
  return (
    <div className="orang-baru">
      <input autoFocus value={v.nama} onChange={(e) => setV(Object.assign({}, v, { nama: e.target.value }))} onKeyDown={enter} placeholder="Nama lengkap & gelar" />
      <input value={v.jabatan} onChange={(e) => setV(Object.assign({}, v, { jabatan: e.target.value }))} onKeyDown={enter} placeholder="Jabatan" />
      <input value={v.unit} onChange={(e) => setV(Object.assign({}, v, { unit: e.target.value }))} onKeyDown={enter} placeholder="Unit" />
      <button type="button" className="tombol kecil utama" disabled={!v.nama.trim() || sibuk} onClick={simpan}>{sibuk ? 'Menyimpan…' : 'Tambah'}</button>
      <button type="button" className="tombol kecil tipis" onClick={() => onSelesai(null)}>Batal</button>
    </div>
  );
}

/**
 * Pemilih satu orang dari DaftarOrang, dengan pilihan "Tambah orang baru" di bawah daftar.
 * mode "id" → nilai ID_ORANG; mode "nama" → nilai NAMA (kolom PIC lama yang menyimpan nama).
 */
export default function PilihOrang({ value, onChange, mode = 'id', kosong, placeholder = 'Pilih orang', bebas, lebar }) {
  const { data } = useApp();
  const [tambahan, setTambahan] = useState([]);
  const [baru, setBaru] = useState(null);
  const opsi = useMemo(() => {
    const ada = {};
    data.orang.forEach((o) => { ada[o.ID_ORANG] = 1; });
    const d = Object.assign({}, data, { orang: data.orang.concat(tambahan.filter((o) => !ada[o.ID_ORANG])) });
    return mode === 'nama' ? opsiOrang(d) : opsiOrangId(d);
  }, [data, tambahan, mode]);
  return (
    <>
      <Pilih value={value} onChange={onChange} opsi={opsi} kosong={kosong} placeholder={placeholder} bebas={bebas} lebar={lebar}
        onTambah={(q) => setBaru(q)} labelTambah="orang baru" />
      {baru !== null ? (
        <OrangBaru namaAwal={baru} onSelesai={(o) => {
          if (o) { setTambahan((x) => x.concat([o])); onChange(mode === 'nama' ? o.NAMA : o.ID_ORANG); }
          setBaru(null);
        }} />
      ) : null}
    </>
  );
}
