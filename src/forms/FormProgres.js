import React from 'react';
import { useApp } from '../konteks';
import { Modal } from '../components/Modal';
import { Field } from '../components/Dasar';
import { Pilih } from '../components/Pilih';
import { useIsian, selisih, GalatForm, Kaki } from './umum';
import { kunciTanggal } from '../utils/format';
import { BAWAAN, labelStatusTl } from '../utils/data';

export default function FormProgres({ item, draf, galat }) {
  const { tutupForm, kirimForm } = useApp();
  const asal = { progresTerakhir: item.PROGRES_TERAKHIR || '', status: item.STATUS || 'Progress', tanggalTarget: kunciTanggal(item.TANGGAL_TARGET) };
  const [v, set] = useIsian(asal, draf);
  function simpan(e) {
    e.preventDefault();
    const beda = selisih(asal, v);
    if (!Object.keys(beda).length) { tutupForm(); return; }
    kirimForm('updateTindakLanjut', Object.assign({ id: item.ID_TINDAKLANJUT }, beda), v, { sukses: 'Progres dicatat.' });
  }
  return (
    <Modal judul="Catat progres" sub={item.JUDUL} onTutup={tutupForm} ukuran="sm" kaki={<Kaki onBatal={tutupForm} form="form-progres" />}>
      <form id="form-progres" onSubmit={simpan} className="form">
        <GalatForm pesan={galat} />
        <Field label="Perkembangan terbaru"><textarea autoFocus rows={4} value={v.progresTerakhir} onChange={(e) => set('progresTerakhir', e.target.value)} /></Field>
        <div className="grid-2">
          <Field label="Status"><Pilih value={v.status} onChange={(x) => set('status', x)} opsi={BAWAAN.STATUS_TL.map((s) => ({ value: s, label: labelStatusTl(s) }))} cari={false} /></Field>
          <Field label="Target"><input type="date" value={v.tanggalTarget} onChange={(e) => set('tanggalTarget', e.target.value)} /></Field>
        </div>
      </form>
    </Modal>
  );
}
