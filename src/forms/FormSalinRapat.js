import React from 'react';
import { useApp } from '../konteks';
import { Modal } from '../components/Modal';
import { Field } from '../components/Dasar';
import { Pilih } from '../components/Pilih';
import { useIsian, GalatForm, Kaki } from './umum';
import { kunciTanggal, tambahHari, hariIni } from '../utils/format';

export default function FormSalinRapat({ item, draf, galat }) {
  const { tutupForm, kirimForm } = useApp();
  const asalTgl = kunciTanggal(item.TANGGAL);
  const saran = asalTgl && asalTgl >= hariIni() ? tambahHari(asalTgl, 7) : tambahHari(hariIni(), 7);
  const selesai = !!item.ID_NOTULEN || item.STATUS === 'Selesai';
  const [v, set] = useIsian({ judulRapat: item.JUDUL_RAPAT || '', startDate: saran, recurrence: 'once', count: 1, agendaMode: selesai ? 'unfinished' : 'empty', copyNotes: false, copyLinks: false }, draf);
  function simpan(e) {
    e.preventDefault();
    kirimForm('copyRapatSeries', Object.assign({ sourceId: item.ID_RAPAT }, v, { count: Number(v.count) || 1 }), v, { optimis: false, sukses: 'Jadwal rapat disalin.' });
  }
  return (
    <Modal judul="Salin jadwal rapat" sub={item.JUDUL_RAPAT} onTutup={tutupForm} ukuran="sm" kaki={<Kaki onBatal={tutupForm} form="form-salin" label="Salin" />}>
      <form id="form-salin" onSubmit={simpan} className="form">
        <GalatForm pesan={galat} />
        <Field label="Judul rapat baru"><input value={v.judulRapat} onChange={(e) => set('judulRapat', e.target.value)} /></Field>
        <div className="grid-2">
          <Field label="Tanggal pertama"><input type="date" value={v.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
          <Field label="Pengulangan"><Pilih value={v.recurrence} onChange={(x) => set('recurrence', x)} cari={false} opsi={[{ value: 'once', label: 'Sekali' }, { value: 'weekly', label: 'Mingguan' }, { value: 'biweekly', label: 'Dua mingguan' }, { value: 'monthly', label: 'Bulanan' }]} /></Field>
        </div>
        {v.recurrence !== 'once' ? <Field label="Jumlah rapat (maks. 12)"><input type="number" min={1} max={12} value={v.count} onChange={(e) => set('count', e.target.value)} /></Field> : null}
        <Field label="Agenda" petunjuk={selesai ? 'Agenda ditempel pada rapat pertama saja.' : 'Agenda hanya dapat disalin dari rapat yang sudah selesai.'}>
          <Pilih value={v.agendaMode} onChange={(x) => set('agendaMode', x)} cari={false} disabled={!selesai}
            opsi={[{ value: 'empty', label: 'Tanpa agenda' }, { value: 'unfinished', label: 'Agenda yang belum diputuskan' }, { value: 'all', label: 'Semua agenda' }]} />
        </Field>
        <label className="cek"><input type="checkbox" checked={v.copyNotes} onChange={(e) => set('copyNotes', e.target.checked)} /> Salin catatan</label>
        <label className="cek"><input type="checkbox" checked={v.copyLinks} onChange={(e) => set('copyLinks', e.target.checked)} /> Salin dokumen rapat</label>
      </form>
    </Modal>
  );
}
