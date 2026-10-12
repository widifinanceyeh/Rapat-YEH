import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../konteks';
import Kepala, { SaringBar, KotakCari } from '../components/Kepala';
import Tabel from '../components/Tabel';
import { Pilih, MenuTitik } from '../components/Pilih';
import { EditPilihan, EditOrang } from '../components/EditSel';
import { Lencana } from '../components/Dasar';
import Ikon from '../components/Ikon';
import { pref, setPref } from '../simpanan';
import { cocokCari, tglPendek, kunciTanggal } from '../utils/format';
import { opsi, nadaTahap, nadaPrioritas, opsiOrang, TAHAP_OTOMATIS, TAHAP_ARSIP, agendaPokok, tlPokok, tautan, picCocok, cariOrang } from '../utils/data';

const AWAL = { q: '', tahap: 'aktif', kategori: '', pic: '', prioritas: '' };

export function aksiPokok(app, x) {
  const { buka, bukaForm, hapus } = app;
  return [
    { label: 'Lihat rincian', onClick: () => buka('pokok', x.ID_ISU) },
    { label: 'Edit', onClick: () => bukaForm('pokok', { item: x }) },
    { label: 'Jadwalkan rapat', onClick: () => bukaForm('rapat', { agendaAwal: [x.ID_ISU] }), hilang: TAHAP_ARSIP.indexOf(x.STATUS_ISU) !== -1 },
    { label: 'Tambah tindak lanjut', onClick: () => bukaForm('tl', { awal: { idIsu: x.ID_ISU, judul: x.JUDUL } }) },
    { label: 'Catat arahan', onClick: () => bukaForm('arahan', { awal: { idIsuList: [x.ID_ISU] } }) },
    { garis: true },
    { label: 'Hapus', bahaya: true, onClick: () => hapus('deleteIsu', x.ID_ISU, { judul: 'Hapus pokok bahasan?', pesan: '“' + x.JUDUL + '” akan dihapus dari sheet. Penghapusan ditolak bila masih terkait arahan, agenda rapat, atau tindak lanjut.' }) },
  ];
}

export default function PokokBahasan() {
  const app = useApp();
  const { data, rute, buka, bukaForm, tulis } = app;
  const [f, setF] = useState(() => Object.assign({}, AWAL, pref('saring.pokok', {}), rute.query.tahap ? { tahap: rute.query.tahap } : {}));
  const [pilihan, setPilihan] = useState(() => new Set());
  useEffect(() => { if (rute.query.tahap) setF((x) => Object.assign({}, x, { tahap: rute.query.tahap })); }, [rute.query.tahap]);
  useEffect(() => { setPref('saring.pokok', f); }, [f]);
  const ubahF = (k, v) => setF((x) => Object.assign({}, x, { [k]: v }));

  const tahapOpsi = opsi(data, 'STATUS_ISU');
  const tahapManual = tahapOpsi.filter((t) => TAHAP_OTOMATIS.indexOf(t) === -1).map((t) => ({ value: t, label: t }));
  const orangOpsi = useMemo(() => opsiOrang(data), [data]);
  const picFilter = useMemo(() => {
    const set = {};
    data.isu.forEach((x) => { if (x.PIC_UTAMA) { const o = cariOrang(data, x.PIC_UTAMA); set[o ? o.NAMA : x.PIC_UTAMA] = 1; } });
    return Object.keys(set).sort().map((n) => ({ value: n, label: n.split(',')[0] }));
  }, [data]);

  const baris = useMemo(() => data.isu.filter((x) => {
    if (!cocokCari(f.q, [x.ID_ISU, x.JUDUL, x.RINGKASAN, x.KATEGORI, x.PIC_UTAMA, x.UNIT_TERKAIT, x.TUJUAN_PEMBAHASAN])) return false;
    if (f.tahap === 'aktif' && TAHAP_ARSIP.indexOf(x.STATUS_ISU) !== -1) return false;
    if (f.tahap !== 'aktif' && f.tahap !== 'semua' && x.STATUS_ISU !== f.tahap) return false;
    if (f.kategori && (x.KATEGORI || '') !== f.kategori) return false;
    if (f.prioritas && (x.PRIORITAS || '') !== f.prioritas) return false;
    if (f.pic) { const o = data.orang.find((p) => p.NAMA === f.pic); if (o ? !picCocok(x.PIC_UTAMA, o) : x.PIC_UTAMA !== f.pic) return false; }
    return true;
  }).sort((a, b) => new Date(b.TANGGAL_UPDATE || b.TANGGAL_DIBUAT || 0) - new Date(a.TANGGAL_UPDATE || a.TANGGAL_DIBUAT || 0)), [data, f]);

  const ubah = (id, field, v) => tulis('updateIsu', { id, [field]: v });

  const kolom = useMemo(() => [
    { kunci: 'judul', judul: 'Pokok bahasan', lebar: 380, render: (x) => (
      <div className="dua-baris">
        <strong className="judul-baris">{x.JUDUL}{x._baru ? <Lencana kecil nada="biru-muda">menyimpan…</Lencana> : null}</strong>
        <small>{[x.KATEGORI, tautan(data, 'Pokok Bahasan', x.ID_ISU).length ? tautan(data, 'Pokok Bahasan', x.ID_ISU).length + ' dokumen' : ''].filter(Boolean).join(' · ')}</small>
      </div>
    ) },
    { kunci: 'tahap', judul: 'Tahap', lebar: 170, render: (x) => (
      <EditPilihan value={x.STATUS_ISU} opsi={tahapManual} nada={nadaTahap} onSimpan={(v) => ubah(x.ID_ISU, 'statusIsu', v)} disabled={x._baru} />
    ) },
    { kunci: 'prioritas', judul: 'Prioritas', lebar: 120, render: (x) => (
      <EditPilihan value={x.PRIORITAS} opsi={opsi(data, 'PRIORITAS')} nada={nadaPrioritas} onSimpan={(v) => ubah(x.ID_ISU, 'prioritas', v)} disabled={x._baru} />
    ) },
    { kunci: 'pic', judul: 'PIC', lebar: 170, render: (x) => <EditOrang value={x.PIC_UTAMA} opsi={orangOpsi} onSimpan={(v) => ubah(x.ID_ISU, 'picUtama', v)} /> },
    { kunci: 'rapat', judul: 'Rapat', lebar: 130, render: (x) => {
      const ag = agendaPokok(data, x.ID_ISU).map((a) => data.peta.rapat[a.ID_RAPAT]).filter(Boolean).sort((a, b) => new Date(b.TANGGAL || 0) - new Date(a.TANGGAL || 0));
      if (!ag.length) return <span className="samar">—</span>;
      const akanDatang = ag.find((r) => !r.ID_NOTULEN && kunciTanggal(r.TANGGAL) >= data.hari);
      return <span className={akanDatang ? 'teks-biru' : ''}>{tglPendek((akanDatang || ag[0]).TANGGAL)}{ag.length > 1 ? <small className="samar"> · {ag.length}×</small> : null}</span>;
    } },
    { kunci: 'tl', judul: 'Tindak lanjut', lebar: 120, render: (x) => {
      const t = tlPokok(data, x.ID_ISU);
      if (!t.length) return <span className="samar">—</span>;
      const aktif = t.filter((y) => y.STATUS !== 'Selesai').length;
      return <span>{aktif ? aktif + ' aktif' : 'selesai'}<small className="samar"> / {t.length}</small></span>;
    } },
    { kunci: 'aksi', judul: '', lebar: 52, tetapKanan: true, kelas: 'kolom-aksi', render: (x) => (x._baru ? null : <MenuTitik items={aksiPokok(app, x)} />) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [data, orangOpsi, tahapManual.length]);

  const adaSaring = JSON.stringify(f) !== JSON.stringify(AWAL);
  const dipilih = Array.from(pilihan).filter((id) => data.peta.isu[id]);
  const bulk = (payload, label) => {
    tulis('bulkUpdatePokokBahasan', Object.assign({ ids: dipilih }, payload), { sukses: label });
    setPilihan(new Set());
  };

  return (
    <div className="halaman">
      <Kepala judul="Pokok Bahasan" sub="Pusat setiap urusan: dari persiapan, rapat, sampai tindak lanjut."
        aksi={<button type="button" className="tombol utama" onClick={() => bukaForm('pokok', {})}><Ikon n="tambah" s={15} />Pokok Bahasan</button>} />
      <SaringBar jumlah={baris.length + ' pokok bahasan'} adaSaring={adaSaring} onReset={() => setF(AWAL)}>
        <KotakCari value={f.q} onChange={(v) => ubahF('q', v)} placeholder="Cari judul, PIC, unit…" />
        <Pilih className="saring-pilih" value={f.tahap} onChange={(v) => ubahF('tahap', v || 'aktif')}
          opsi={[{ value: 'aktif', label: 'Semua yang aktif' }, { value: 'semua', label: 'Semua tahap' }].concat(tahapOpsi.map((t) => ({ value: t, label: t })))} cari={false} />
        <Pilih className="saring-pilih" value={f.kategori} onChange={(v) => ubahF('kategori', v)} opsi={opsi(data, 'KATEGORI_ISU')} kosong="Semua kategori" placeholder="Kategori" />
        <Pilih className="saring-pilih" value={f.pic} onChange={(v) => ubahF('pic', v)} opsi={picFilter} kosong="Semua PIC" placeholder="PIC" />
        <Pilih className="saring-pilih" value={f.prioritas} onChange={(v) => ubahF('prioritas', v)} opsi={opsi(data, 'PRIORITAS')} kosong="Semua prioritas" placeholder="Prioritas" cari={false} />
      </SaringBar>
      {dipilih.length ? (
        <div className="bilah-massal">
          <strong>{dipilih.length} dipilih</strong>
          <button type="button" className="tombol utama kecil" onClick={() => { bukaForm('rapat', { agendaAwal: dipilih }); setPilihan(new Set()); }}>Jadwalkan rapat</button>
          <Pilih className="kecil" value="" onChange={(v) => v && bulk({ statusIsu: v }, 'Tahap diperbarui.')} opsi={tahapManual} placeholder="Ubah tahap" cari={false} />
          <Pilih className="kecil" value="" onChange={(v) => v && bulk({ prioritas: v }, 'Prioritas diperbarui.')} opsi={opsi(data, 'PRIORITAS')} placeholder="Ubah prioritas" cari={false} />
          <Pilih className="kecil" value="" onChange={(v) => bulk({ picUtama: v }, 'PIC diperbarui.')} opsi={orangOpsi} placeholder="Ubah PIC" bebas lebar={280} />
          <button type="button" className="tombol tipis kecil" onClick={() => setPilihan(new Set())}>Batal</button>
        </div>
      ) : null}
      <Tabel id="pokok" kolom={kolom} baris={baris} kunci={(x) => x.ID_ISU} onBuka={(x) => !x._baru && buka('pokok', x.ID_ISU)}
        pilihan={pilihan} onPilih={(id) => setPilihan((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
        onPilihSemua={(semua) => setPilihan(semua ? new Set(baris.map((x) => x.ID_ISU)) : new Set())}
        kosong={adaSaring ? 'Tidak ada pokok bahasan yang cocok dengan saringan.' : 'Belum ada pokok bahasan.'} />
    </div>
  );
}
