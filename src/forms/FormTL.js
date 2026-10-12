import React, { useMemo } from 'react';
import { useApp } from '../konteks';
import { Modal } from '../components/Modal';
import { Field, Lipat } from '../components/Dasar';
import { Pilih, PilihBanyak } from '../components/Pilih';
import EditorTautan from '../components/EditorTautan';
import { useIsian, selisih, GalatForm, Kaki } from './umum';
import { kunciTanggal, tglPendek } from '../utils/format';
import { opsiOrang, tautan, BAWAAN, labelStatusTl } from '../utils/data';

export default function FormTL({ item, awal, draf, galat }) {
  const { data, tutupForm, kirimForm } = useApp();
  const edit = !!item;
  const pisah = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const asal = edit ? {
    judul: item.JUDUL || '', pic: item.PIC || '', tanggalTarget: kunciTanggal(item.TANGGAL_TARGET), status: item.STATUS || 'Belum Dimulai',
    idIsu: item.ID_ISU || '', catatan: item.CATATAN || '', penanda: pisah(item.PENANDA), terkaitDengan: pisah(item.TERKAIT_DENGAN),
    idInduk: item.ID_INDUK || '', tautan: tautan(data, 'Tindak Lanjut', item.ID_TINDAKLANJUT, item.LINK_DOKUMEN, 'Dokumen/output'),
  } : Object.assign({
    judul: '', pic: '', tanggalTarget: '', status: 'Belum Dimulai', idIsu: '', catatan: '', penanda: [], terkaitDengan: [], idInduk: '', idNotulen: '', idArahanAsal: '', tautan: [],
  }, awal || {}, awal && awal.penanda && !Array.isArray(awal.penanda) ? { penanda: pisah(awal.penanda) } : {});
  const [v, set] = useIsian(asal, draf);
  const arahan = data.peta.arahan[edit ? item.ID_ARAHAN_ASAL : v.idArahanAsal];
  const idNotulen = edit ? item.ID_NOTULEN : v.idNotulen;
  const induk = useMemo(() => data.tindakLanjut.filter((t) => {
    if (edit && t.ID_TINDAKLANJUT === item.ID_TINDAKLANJUT) return false;
    if (idNotulen) return t.ID_NOTULEN === idNotulen;
    if (arahan) return t.ID_ARAHAN_ASAL === arahan.ID_ARAHAN;
    return !t.ID_NOTULEN && !t.ID_ARAHAN_ASAL;
  }).map((t) => ({ value: t.ID_TINDAKLANJUT, label: t.JUDUL, meta: labelStatusTl(t.STATUS) })), [data, idNotulen, arahan, edit, item]);
  const isuOpsi = useMemo(() => {
    const batas = arahan && arahan.ID_ISU_LIST.length ? arahan.ID_ISU_LIST : null;
    return data.isu.filter((i) => !batas || batas.indexOf(i.ID_ISU) !== -1 || i.ID_ISU === v.idIsu).map((i) => ({ value: i.ID_ISU, label: i.JUDUL, meta: i.STATUS_ISU }));
  }, [data, arahan, v.idIsu]);
  const notulenOpsi = useMemo(() => data.notulen.slice().sort((a, b) => new Date(b.TANGGAL || 0) - new Date(a.TANGGAL || 0))
    .map((n) => ({ value: n.ID_NOTULEN, label: n.JUDUL, meta: tglPendek(n.TANGGAL) })), [data.notulen]);
  const tlOpsi = useMemo(() => data.tindakLanjut.filter((t) => !edit || t.ID_TINDAKLANJUT !== item.ID_TINDAKLANJUT).map((t) => ({ value: t.ID_TINDAKLANJUT, label: t.JUDUL, meta: labelStatusTl(t.STATUS) })), [data, edit, item]);

  function simpan(e) {
    e.preventDefault();
    if (!v.judul.trim()) return;
    const isi = Object.assign({}, v, { judul: v.judul.trim() });
    if (edit) {
      const beda = selisih(asal, isi);
      if (!Object.keys(beda).length) { tutupForm(); return; }
      kirimForm('updateTindakLanjut', Object.assign({ id: item.ID_TINDAKLANJUT }, beda), v, { sukses: 'Tindak lanjut diperbarui.' });
    } else {
      kirimForm('addTindakLanjut', isi, v, { sukses: 'Tindak lanjut ditambahkan.' });
    }
  }
  const judulModal = edit ? 'Edit tindak lanjut' : v.idInduk ? 'Tindak lanjut turunan' : 'Tindak lanjut baru';
  return (
    <Modal judul={judulModal} sub={arahan ? 'Dari arahan: ' + arahan.ISI_ARAHAN.slice(0, 90) + (arahan.ISI_ARAHAN.length > 90 ? '…' : '') : undefined} onTutup={tutupForm} ukuran="md"
      kaki={<Kaki onBatal={tutupForm} form="form-tl" nonaktif={!v.judul.trim()} />}>
      <form id="form-tl" onSubmit={simpan} className="form">
        <GalatForm pesan={galat} />
        <Field label="Pekerjaan" wajib><input autoFocus value={v.judul} onChange={(e) => set('judul', e.target.value)} placeholder="Apa yang harus dikerjakan?" /></Field>
        <div className={edit ? 'grid-3' : 'grid-2'}>
          <Field label="PIC"><Pilih value={v.pic} onChange={(x) => set('pic', x)} opsi={opsiOrang(data)} kosong="— belum ditentukan —" bebas placeholder="Pilih orang" /></Field>
          <Field label="Target"><input type="date" value={v.tanggalTarget} onChange={(e) => set('tanggalTarget', e.target.value)} /></Field>
          {edit ? <Field label="Status"><Pilih value={v.status} onChange={(x) => set('status', x)} opsi={BAWAAN.STATUS_TL.map((s) => ({ value: s, label: labelStatusTl(s) }))} cari={false} /></Field> : null}
        </div>
        <Field label="Pokok bahasan"><Pilih value={v.idIsu} onChange={(x) => set('idIsu', x)} opsi={isuOpsi} kosong="— tanpa pokok bahasan —" placeholder="Pilih pokok bahasan" lebar={420} /></Field>
        <Field label="Deskripsi"><textarea rows={3} value={v.catatan} onChange={(e) => set('catatan', e.target.value)} placeholder="Rincian pekerjaan, dasar, atau batasan." /></Field>
        <Lipat judul="Asal, induk, penanda, kaitan" terbuka={!!(v.idInduk || v.penanda.length || v.terkaitDengan.length || (!edit && v.idNotulen))}>
          <div className="grid-2">
            {!edit ? <Field label="Dari notulen"><Pilih value={v.idNotulen} onChange={(x) => { set('idNotulen', x); set('idInduk', ''); }} opsi={notulenOpsi} kosong="— tidak dari notulen —" lebar={420} /></Field> : null}
            <Field label="Induk"><Pilih value={v.idInduk} onChange={(x) => set('idInduk', x)} opsi={induk} kosong="— pekerjaan utama —" lebar={420} /></Field>
          </div>
          <Field label="Penanda"><PilihBanyak value={v.penanda} onChange={(x) => set('penanda', x)} opsi={BAWAAN.PENANDA} placeholder="Tidak ada" /></Field>
          <Field label="Terkait dengan"><PilihBanyak value={v.terkaitDengan} onChange={(x) => set('terkaitDengan', x)} opsi={tlOpsi} placeholder="Tindak lanjut lain yang berkaitan" lebar={420} /></Field>
        </Lipat>
        <Field label="Dokumen / output"><EditorTautan value={v.tautan} onChange={(x) => set('tautan', x)} data={data} /></Field>
      </form>
    </Modal>
  );
}
