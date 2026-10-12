import React, { useMemo, useState } from 'react';
import { useApp } from '../konteks';
import { Modal } from '../components/Modal';
import { Field, Lipat } from '../components/Dasar';
import { Pilih, PilihBanyak } from '../components/Pilih';
import EditorTautan from '../components/EditorTautan';
import Ikon from '../components/Ikon';
import { useIsian, selisih, GalatForm, Kaki } from './umum';
import { kunciTanggal, jam, menit, rentangJam } from '../utils/format';
import { opsi, opsiOrangId, tautan, TAHAP_ARSIP, labelStatusTl } from '../utils/data';

/** Tambah orang baru ke DaftarOrang tanpa meninggalkan form. */
export function OrangBaru({ onSelesai }) {
  const { tulis } = useApp();
  const [v, setV] = useState({ nama: '', jabatan: '', unit: '' });
  const [sibuk, setSibuk] = useState(false);
  async function simpan() {
    if (!v.nama.trim() || sibuk) return;
    setSibuk(true);
    const r = await tulis('addOrang', { nama: v.nama.trim(), jabatan: v.jabatan.trim(), unit: v.unit.trim() }, { optimis: false, sukses: 'Nama ditambahkan ke DaftarOrang.' });
    setSibuk(false);
    if (r && r.id) onSelesai({ ID_ORANG: r.id, NAMA: v.nama.trim(), JABATAN: v.jabatan.trim(), UNIT: v.unit.trim() });
  }
  return (
    <div className="orang-baru">
      <input autoFocus value={v.nama} onChange={(e) => setV(Object.assign({}, v, { nama: e.target.value }))} placeholder="Nama lengkap & gelar" />
      <input value={v.jabatan} onChange={(e) => setV(Object.assign({}, v, { jabatan: e.target.value }))} placeholder="Jabatan" />
      <input value={v.unit} onChange={(e) => setV(Object.assign({}, v, { unit: e.target.value }))} placeholder="Unit" />
      <button type="button" className="tombol kecil utama" disabled={!v.nama.trim() || sibuk} onClick={simpan}>{sibuk ? 'Menyimpan…' : 'Tambah'}</button>
      <button type="button" className="tombol kecil tipis" onClick={() => onSelesai(null)}>Batal</button>
    </div>
  );
}

function PilihAgenda({ value, onChange, data, terkunci }) {
  const kunci = (a) => a.jenisItem + '|' + a.idReferensi;
  const ada = {};
  value.forEach((a) => { ada[kunci(a)] = 1; });
  const pilihan = useMemo(() => [].concat(
    data.isu.filter((i) => TAHAP_ARSIP.indexOf(i.STATUS_ISU) === -1 && !i._baru).map((i) => ({ value: 'Pokok Bahasan|' + i.ID_ISU, label: i.JUDUL, meta: i.STATUS_ISU })),
    data.tindakLanjut.filter((t) => t.STATUS !== 'Selesai' && !t._baru).map((t) => ({ value: 'Tindak Lanjut|' + t.ID_TINDAKLANJUT, label: t.JUDUL, meta: 'Tindak lanjut · ' + labelStatusTl(t.STATUS) }))
  ), [data]);
  const judul = (a) => {
    if (a.jenisItem === 'Tindak Lanjut') { const t = data.peta.tl[a.idReferensi]; return t ? t.JUDUL : a.idReferensi; }
    const i = data.peta.isu[a.idReferensi]; return i ? i.JUDUL : a.idReferensi;
  };
  const geser = (i, d) => { const n = value.slice(); const j = i + d; if (j < 0 || j >= n.length) return; const t = n[i]; n[i] = n[j]; n[j] = t; onChange(n); };
  return (
    <div className="pilih-agenda">
      {value.length ? (
        <ol>
          {value.map((a, i) => (
            <li key={kunci(a)}>
              <span className="no-agenda">{i + 1}</span>
              <span className="potong">{judul(a)}{a.jenisItem === 'Tindak Lanjut' ? <small> · tindak lanjut lama</small> : null}</span>
              {!terkunci ? <span className="aksi-agenda">
                <button type="button" className="tombol-ikon" disabled={i === 0} onClick={() => geser(i, -1)} aria-label="Naikkan"><Ikon n="atas" s={14} /></button>
                <button type="button" className="tombol-ikon" disabled={i === value.length - 1} onClick={() => geser(i, 1)} aria-label="Turunkan"><Ikon n="bawah" s={14} /></button>
                <button type="button" className="tombol-ikon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Hapus"><Ikon n="tutup" s={14} /></button>
              </span> : null}
            </li>
          ))}
        </ol>
      ) : <div className="samar kecil">Belum ada agenda.</div>}
      {terkunci ? <small className="field-petunjuk">Agenda terkunci karena hasil rapat sudah dicatat.</small> : (
        <Pilih value="" onChange={(x) => { if (!x || ada[x]) return; const [jenis, id] = x.split('|'); const t = jenis === 'Tindak Lanjut' ? data.peta.tl[id] : null; onChange(value.concat([{ jenisItem: jenis, idReferensi: id, idIsu: jenis === 'Pokok Bahasan' ? id : (t && t.ID_ISU) || '' }])); }}
          opsi={pilihan.filter((p) => !ada[p.value])} placeholder="+ Tambah agenda (pokok bahasan / tindak lanjut lama)" lebar={460} />
      )}
    </div>
  );
}

export default function FormRapat({ item, agendaAwal, draf, galat }) {
  const { data, tutupForm, kirimForm } = useApp();
  const edit = !!item;
  const [orangTambahan, setOrangTambahan] = useState([]);
  const [baru, setBaru] = useState('');
  const asal = edit ? {
    judulRapat: item.JUDUL_RAPAT || '', tanggal: kunciTanggal(item.TANGGAL), jamMulai: jam(item.JAM_MULAI), jamSelesai: jam(item.JAM_SELESAI),
    jenisRapat: item.JENIS_RAPAT || '', idPimpinan: item.ID_PIMPINAN || '', idNotulis: item.ID_NOTULIS || '',
    idPeserta: String(item.ID_PESERTA || '').split(',').map((s) => s.trim()).filter(Boolean), status: item.STATUS || 'Dijadwalkan', catatan: item.CATATAN || '',
    agenda: (data.agendaPer[item.ID_RAPAT] || []).map((a) => ({ jenisItem: a.JENIS_ITEM, idReferensi: a.ID_REFERENSI, idIsu: a.ID_ISU || '' })),
    tautan: tautan(data, 'Rapat', item.ID_RAPAT),
  } : {
    judulRapat: '', tanggal: '', jamMulai: '', jamSelesai: '', jenisRapat: '', idPimpinan: '', idNotulis: '', idPeserta: [], status: 'Dijadwalkan', catatan: '',
    agenda: (agendaAwal || []).map((id) => ({ jenisItem: 'Pokok Bahasan', idReferensi: id, idIsu: id })), tautan: [],
  };
  const [v, set] = useIsian(asal, draf);
  const terkunci = edit && !!item.ID_NOTULEN;
  const orangOpsi = useMemo(() => opsiOrangId(Object.assign({}, data, { orang: data.orang.concat(orangTambahan) })), [data, orangTambahan]);
  const jamSalah = v.jamMulai && v.jamSelesai && menit(v.jamSelesai) <= menit(v.jamMulai);
  const bentrok = useMemo(() => {
    if (!v.tanggal || !v.jamMulai) return [];
    const a = menit(v.jamMulai); const b = menit(v.jamSelesai) || a + 60;
    return data.rapat.filter((r) => r.ID_RAPAT !== (item && item.ID_RAPAT) && r.STATUS !== 'Dibatalkan' && kunciTanggal(r.TANGGAL) === v.tanggal && jam(r.JAM_MULAI))
      .filter((r) => { const c = menit(r.JAM_MULAI); const d = menit(r.JAM_SELESAI) || c + 60; return a < d && b > c; });
  }, [v.tanggal, v.jamMulai, v.jamSelesai, data.rapat, item]);

  function orangBaruSelesai(o) {
    if (o) {
      setOrangTambahan((x) => x.concat([o]));
      if (baru === 'pimpinan') set('idPimpinan', o.ID_ORANG);
      else if (baru === 'notulis') set('idNotulis', o.ID_ORANG);
      else set('idPeserta', v.idPeserta.concat(o.ID_ORANG));
    }
    setBaru('');
  }
  function simpan(e) {
    e.preventDefault();
    if (!v.judulRapat.trim() || jamSalah) return;
    const isi = Object.assign({}, v, { judulRapat: v.judulRapat.trim() });
    if (terkunci) delete isi.agenda;
    if (edit) {
      const beda = selisih(asal, isi);
      if (!Object.keys(beda).length) { tutupForm(); return; }
      kirimForm('updateRapat', Object.assign({ id: item.ID_RAPAT }, beda), v, { sukses: 'Rapat diperbarui.' });
    } else {
      kirimForm('addRapat', isi, v, { sukses: 'Rapat dijadwalkan.' });
    }
  }
  return (
    <Modal judul={edit ? 'Edit jadwal rapat' : 'Jadwalkan rapat'} onTutup={tutupForm} ukuran="lg"
      kaki={<Kaki onBatal={tutupForm} form="form-rapat" nonaktif={!v.judulRapat.trim() || jamSalah} />}>
      <form id="form-rapat" onSubmit={simpan} className="form">
        <GalatForm pesan={galat} />
        <Field label="Judul rapat" wajib><input autoFocus value={v.judulRapat} onChange={(e) => set('judulRapat', e.target.value)} placeholder="mis. Rapat Koordinasi Kepegawaian" /></Field>
        <div className="grid-4">
          <Field label="Tanggal"><input type="date" value={v.tanggal} onChange={(e) => set('tanggal', e.target.value)} /></Field>
          <Field label="Mulai"><input type="time" value={v.jamMulai} onChange={(e) => set('jamMulai', e.target.value)} /></Field>
          <Field label="Selesai"><input type="time" value={v.jamSelesai} onChange={(e) => set('jamSelesai', e.target.value)} className={jamSalah ? 'salah' : ''} /></Field>
          <Field label="Jenis"><Pilih value={v.jenisRapat} onChange={(x) => set('jenisRapat', x)} opsi={opsi(data, 'JENIS_RAPAT')} kosong="— pilih —" bebas /></Field>
        </div>
        {jamSalah ? <div className="peringatan-kecil teks-merah">Jam selesai harus lebih akhir dari jam mulai.</div> : null}
        {bentrok.length ? <div className="peringatan-kecil"><Ikon n="peringatan" s={14} />Bersamaan dengan: {bentrok.map((r) => r.JUDUL_RAPAT + ' (' + rentangJam(r) + ')').join('; ')}</div> : null}
        <div className="grid-2">
          <Field label="Pimpinan rapat"><Pilih value={v.idPimpinan} onChange={(x) => set('idPimpinan', x)} opsi={orangOpsi} kosong="— belum ditentukan —" placeholder={item && item.PIMPINAN_RAPAT ? item.PIMPINAN_RAPAT : 'Pilih orang'} /></Field>
          <Field label="Notulis"><Pilih value={v.idNotulis} onChange={(x) => set('idNotulis', x)} opsi={orangOpsi} kosong="— belum ditentukan —" placeholder={item && item.NOTULIS ? item.NOTULIS : 'Pilih orang'} /></Field>
        </div>
        <Field label="Peserta"><PilihBanyak value={v.idPeserta} onChange={(x) => set('idPeserta', x)} opsi={orangOpsi} placeholder={item && item.PESERTA && !v.idPeserta.length ? 'Data lama: ' + item.PESERTA : 'Pilih peserta'} /></Field>
        {baru ? <OrangBaru onSelesai={orangBaruSelesai} /> : (
          <div className="baris-aksi-kecil">
            <span className="samar kecil">Nama belum ada?</span>
            <button type="button" className="tautan-tombol" onClick={() => setBaru('peserta')}>+ Tambah ke DaftarOrang</button>
          </div>
        )}
        <Field label={'Agenda (' + v.agenda.length + ')'}><PilihAgenda value={v.agenda} onChange={(x) => set('agenda', x)} data={data} terkunci={terkunci} /></Field>
        <Lipat judul="Catatan, dokumen, status" terbuka={!!(v.catatan || v.tautan.length)}>
          <Field label="Catatan"><textarea rows={2} value={v.catatan} onChange={(e) => set('catatan', e.target.value)} placeholder="mis. tempat, tautan Zoom, persiapan undangan" /></Field>
          <Field label="Dokumen rapat"><EditorTautan value={v.tautan} onChange={(x) => set('tautan', x)} data={data} /></Field>
          {edit ? <Field label="Status"><Pilih value={v.status} onChange={(x) => set('status', x)} opsi={opsi(data, 'STATUS_RAPAT')} cari={false} /></Field> : null}
        </Lipat>
      </form>
    </Modal>
  );
}
