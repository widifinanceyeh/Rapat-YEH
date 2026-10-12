import React from 'react';
import { useApp } from '../konteks';
import { Modal } from '../components/Modal';
import { Field } from '../components/Dasar';
import EditorTautan from '../components/EditorTautan';
import { useIsian, selisih, GalatForm, Kaki } from './umum';
import { kunciTanggal } from '../utils/format';
import { tautan } from '../utils/data';

/** Edit notulen lama (tanpa jadwal rapat). Notulen baru dibuat lewat "Isi hasil rapat". */
export default function FormNotulen({ item, draf, galat }) {
  const { data, tutupForm, kirimForm } = useApp();
  const asal = {
    judul: item.JUDUL || '', tanggal: kunciTanggal(item.TANGGAL), unitPeserta: item.UNIT_PESERTA || '', catatan: item.CATATAN || '',
    tautan: tautan(data, 'Notulen', item.ID_NOTULEN, item.LINK_DOKUMEN, 'Notulen'),
  };
  const [v, set] = useIsian(asal, draf);
  function simpan(e) {
    e.preventDefault();
    if (!v.judul.trim()) return;
    const beda = selisih(asal, v);
    if (!Object.keys(beda).length) { tutupForm(); return; }
    kirimForm('updateNotulen', Object.assign({ id: item.ID_NOTULEN }, beda), v, { sukses: 'Notulen diperbarui.' });
  }
  return (
    <Modal judul="Edit notulen" onTutup={tutupForm} ukuran="md" kaki={<Kaki onBatal={tutupForm} form="form-notulen" nonaktif={!v.judul.trim()} />}>
      <form id="form-notulen" onSubmit={simpan} className="form">
        <GalatForm pesan={galat} />
        <div className="grid-3">
          <Field label="Judul" wajib lebar="2"><input value={v.judul} onChange={(e) => set('judul', e.target.value)} /></Field>
          <Field label="Tanggal"><input type="date" value={v.tanggal} onChange={(e) => set('tanggal', e.target.value)} /></Field>
        </div>
        <Field label="Peserta / unit"><input value={v.unitPeserta} onChange={(e) => set('unitPeserta', e.target.value)} /></Field>
        <Field label="Ringkasan"><textarea rows={3} value={v.catatan} onChange={(e) => set('catatan', e.target.value)} /></Field>
        <Field label="Dokumen notulen"><EditorTautan value={v.tautan} onChange={(x) => set('tautan', x)} data={data} /></Field>
      </form>
    </Modal>
  );
}
