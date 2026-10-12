import React, { useMemo } from 'react';
import { useApp } from '../konteks';
import { Modal } from '../components/Modal';
import { Field, Lipat } from '../components/Dasar';
import { Pilih, PilihBanyak } from '../components/Pilih';
import PilihOrang from '../components/PilihOrang';
import EditorTautan from '../components/EditorTautan';
import { useIsian, selisih, GalatForm, Kaki } from './umum';
import { kunciTanggal, hariIni } from '../utils/format';
import { opsi, tautan } from '../utils/data';

export default function FormArahan({ item, awal, draf, galat }) {
  const { data, tutupForm, kirimForm } = useApp();
  const edit = !!item;
  const asal = edit ? {
    isiArahan: item.ISI_ARAHAN || '', tanggal: kunciTanggal(item.TANGGAL), idPemberi: item.ID_PEMBERI || '', sifat: item.SIFAT || '',
    idIsuList: item.ID_ISU_LIST || [], lembaga: item.LEMBAGA || '', forum: item.FORUM || '', unitTujuan: item.UNIT_TUJUAN || '',
    idPencatat: item.ID_PENCATAT || '', catatan: item.CATATAN || '', tautan: tautan(data, 'Arahan', item.ID_ARAHAN),
  } : Object.assign({
    isiArahan: '', tanggal: hariIni(), idPemberi: '', sifat: 'Arahan/Instruksi', idIsuList: [], lembaga: 'YEH', forum: 'Diskusi lisan',
    unitTujuan: '', idPencatat: '', catatan: '', tautan: [],
  }, awal || {});
  const [v, set] = useIsian(asal, draf);
  const unitOpsi = useMemo(() => {
    const dari = opsi(data, 'UNIT_TUJUAN');
    if (dari.length) return dari;
    const u = {};
    data.orang.forEach((o) => { if (o.UNIT) u[o.UNIT] = 1; });
    return Object.keys(u).sort();
  }, [data]);

  function simpan(e) {
    e.preventDefault();
    if (!v.isiArahan.trim()) return;
    const isi = Object.assign({}, v, { isiArahan: v.isiArahan.trim() });
    const pemberi = data.peta.orang[v.idPemberi];
    if (edit) {
      const beda = selisih(asal, isi);
      if (!Object.keys(beda).length) { tutupForm(); return; }
      kirimForm('updateArahan', Object.assign({ id: item.ID_ARAHAN }, beda), v, { sukses: 'Arahan diperbarui.' });
    } else {
      kirimForm('addArahan', Object.assign({ pemberiNama: pemberi ? pemberi.NAMA : '' }, isi), v, { sukses: 'Arahan dicatat.' });
    }
  }
  return (
    <Modal judul={edit ? 'Edit arahan' : 'Catat arahan'} onTutup={tutupForm} ukuran="md"
      kaki={<Kaki onBatal={tutupForm} form="form-arahan" nonaktif={!v.isiArahan.trim() || !v.idPemberi} />}>
      <form id="form-arahan" onSubmit={simpan} className="form">
        <GalatForm pesan={galat} />
        <Field label="Isi arahan" wajib><textarea autoFocus rows={4} value={v.isiArahan} onChange={(e) => set('isiArahan', e.target.value)} placeholder="Tulis arahan singkat dan langsung ke inti." /></Field>
        <div className="grid-3">
          <Field label="Tanggal"><input type="date" value={v.tanggal} onChange={(e) => set('tanggal', e.target.value)} /></Field>
          <Field label="Pemberi arahan" wajib><PilihOrang value={v.idPemberi} onChange={(x) => set('idPemberi', x)} /></Field>
          <Field label="Sifat"><Pilih value={v.sifat} onChange={(x) => set('sifat', x)} opsi={opsi(data, 'SIFAT_ARAHAN')} cari={false} /></Field>
        </div>
        <Field label="Pokok bahasan terkait" petunjuk="Opsional. Satu arahan dapat terkait beberapa pokok bahasan.">
          <PilihBanyak value={v.idIsuList} onChange={(x) => set('idIsuList', x)} opsi={data.isu.map((i) => ({ value: i.ID_ISU, label: i.JUDUL, meta: i.STATUS_ISU }))} placeholder="Berdiri sendiri" lebar={460} />
        </Field>
        <Lipat judul="Lembaga, forum, tujuan, pencatat" terbuka={edit}>
          <div className="grid-2">
            <Field label="Lembaga"><Pilih value={v.lembaga} onChange={(x) => set('lembaga', x)} opsi={opsi(data, 'LEMBAGA')} cari={false} /></Field>
            <Field label="Forum / sumber"><Pilih value={v.forum} onChange={(x) => set('forum', x)} opsi={opsi(data, 'FORUM_ARAHAN')} /></Field>
            <Field label="Ditujukan kepada"><Pilih value={v.unitTujuan} onChange={(x) => set('unitTujuan', x)} opsi={unitOpsi} kosong="— tidak khusus —" bebas /></Field>
            <Field label="Pencatat"><PilihOrang value={v.idPencatat} onChange={(x) => set('idPencatat', x)} kosong="— belum ditentukan —" /></Field>
          </div>
          <Field label="Catatan"><textarea rows={2} value={v.catatan} onChange={(e) => set('catatan', e.target.value)} /></Field>
        </Lipat>
        <Field label="Dokumen"><EditorTautan value={v.tautan} onChange={(x) => set('tautan', x)} data={data} /></Field>
      </form>
    </Modal>
  );
}
