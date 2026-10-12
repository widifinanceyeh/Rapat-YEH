import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../konteks';
import Kepala, { SaringBar, KotakCari, Segmen } from '../components/Kepala';
import Tabel from '../components/Tabel';
import { Pilih, MenuTitik } from '../components/Pilih';
import { Lencana } from '../components/Dasar';
import Ikon from '../components/Ikon';
import { pref, setPref } from '../simpanan';
import { cocokCari, kunciTanggal, tgl, hariSaja, rentangJam } from '../utils/format';
import { opsi, statusRapat, bahanNotulen, salinTeks, tautan, urlAman } from '../utils/data';

export function salinBahan(app, r) {
  salinTeks(bahanNotulen(app.data, r))
    .then(() => app.toast('Bahan notulen tersalin. Tempel bersama transkrip saat menjalankan /susun-notulen.', 'sukses'))
    .catch(() => app.toast('Gagal menyalin ke papan klip.', 'galat'));
}

export function aksiRapat(app, r) {
  const { buka, bukaForm, hapus } = app;
  return [
    { label: 'Lihat rincian', onClick: () => buka('rapat', r.ID_RAPAT) },
    { label: r.ID_NOTULEN ? 'Edit hasil rapat' : 'Isi hasil rapat', onClick: () => bukaForm('hasilRapat', { idRapat: r.ID_RAPAT }), hilang: r.STATUS === 'Dibatalkan' },
    { label: 'Salin bahan notulen', onClick: () => salinBahan(app, r) },
    { label: 'Edit jadwal', onClick: () => bukaForm('rapat', { item: r }) },
    { label: 'Salin jadwal', onClick: () => bukaForm('salinRapat', { item: r }) },
    { garis: true, hilang: !!r.ID_NOTULEN },
    { label: 'Hapus', bahaya: true, hilang: !!r.ID_NOTULEN, onClick: () => hapus('deleteRapat', r.ID_RAPAT, { judul: 'Hapus rapat?', pesan: '“' + r.JUDUL_RAPAT + '” dan agendanya akan dihapus. Pokok bahasan pada agenda kembali ke tahap sebelumnya.' }) },
  ];
}

export default function Rapat() {
  const app = useApp();
  const { data, rute, buka, bukaForm } = app;
  const [seg, setSeg] = useState(() => rute.query.f || pref('rapat.seg', 'mendatang'));
  const [q, setQ] = useState('');
  const [jenis, setJenis] = useState('');
  useEffect(() => { if (rute.query.f) setSeg(rute.query.f); }, [rute.query.f]);
  useEffect(() => { setPref('rapat.seg', seg); }, [seg]);
  const hari = data.hari;

  const semua = useMemo(() => {
    const list = data.rapat.map((r) => ({ jenis: 'rapat', id: r.ID_RAPAT, r, st: statusRapat(r, hari), k: kunciTanggal(r.TANGGAL) }));
    data.notulen.filter((n) => !n.ID_RAPAT || !data.peta.rapat[n.ID_RAPAT]).forEach((n) => {
      list.push({ jenis: 'notulen', id: n.ID_NOTULEN, n, st: { kunci: 'selesai', label: 'Notulen', nada: 'hijau' }, k: kunciTanggal(n.TANGGAL) });
    });
    return list;
  }, [data, hari]);

  const hitung = (k) => semua.filter((x) => (k === 'lain' ? ['draft', 'batal'].indexOf(x.st.kunci) !== -1 : x.st.kunci === k)).length;
  const baris = useMemo(() => semua.filter((x) => {
    if (seg !== 'semua') {
      if (seg === 'lain' ? ['draft', 'batal'].indexOf(x.st.kunci) === -1 : x.st.kunci !== seg) return false;
    }
    if (jenis && (x.r ? x.r.JENIS_RAPAT : '') !== jenis) return false;
    const t = x.r ? [x.r.JUDUL_RAPAT, x.r.JENIS_RAPAT, x.r.PESERTA, x.r.PIMPINAN_RAPAT] : [x.n.JUDUL, x.n.CATATAN, x.n.UNIT_PESERTA];
    return cocokCari(q, t);
  }).sort((a, b) => (seg === 'mendatang' ? (a.k || '9').localeCompare(b.k || '9') || (a.r.JAM_MULAI || '').localeCompare(b.r.JAM_MULAI || '') : (b.k || '').localeCompare(a.k || ''))), [semua, seg, q, jenis]);

  const kolom = useMemo(() => [
    { kunci: 'tgl', judul: 'Waktu', lebar: 150, render: (x) => (
      <div className="dua-baris"><strong>{x.k ? tgl(x.k) : 'Tanpa tanggal'}</strong><small>{x.k ? hariSaja(x.k) : ''}{x.r && rentangJam(x.r) ? ' · ' + rentangJam(x.r) : ''}</small></div>
    ) },
    { kunci: 'judul', judul: 'Rapat', lebar: 360, render: (x) => (
      <div className="dua-baris"><strong className="judul-baris">{x.r ? x.r.JUDUL_RAPAT : x.n.JUDUL}{x.r && x.r._baru ? <Lencana kecil nada="biru-muda">menyimpan…</Lencana> : null}</strong>
        <small>{x.r ? (x.r.JENIS_RAPAT || 'Rapat') : 'Notulen tanpa jadwal rapat'}</small></div>
    ) },
    { kunci: 'agenda', judul: 'Agenda', lebar: 90, render: (x) => { const n = x.r ? (data.agendaPer[x.r.ID_RAPAT] || []).length : 0; return n ? n + ' agenda' : <span className="samar">—</span>; } },
    { kunci: 'status', judul: 'Status', lebar: 130, render: (x) => <Lencana nada={x.st.nada}>{x.st.label}</Lencana> },
    { kunci: 'notulen', judul: 'Notulen', lebar: 110, render: (x) => {
      const n = x.n || data.peta.notulen[x.r.ID_NOTULEN];
      if (!n) return <span className="samar">—</span>;
      const l = tautan(data, 'Notulen', n.ID_NOTULEN, n.LINK_DOKUMEN, 'Notulen')[0];
      return l && urlAman(l.url) ? <a className="tautan-ikon" href={urlAman(l.url)} target="_blank" rel="noopener noreferrer"><Ikon n="dok" s={15} />Buka</a> : <span className="samar">tanpa dokumen</span>;
    } },
    { kunci: 'aksi', judul: '', lebar: 52, tetapKanan: true, kelas: 'kolom-aksi', render: (x) => {
      if (x.r && x.r._baru) return null;
      if (x.n) return <MenuTitik items={[{ label: 'Lihat rincian', onClick: () => buka('rapat', x.n.ID_NOTULEN) }, { label: 'Edit notulen', onClick: () => bukaForm('notulen', { item: x.n }) }]} />;
      return <MenuTitik items={aksiRapat(app, x.r)} />;
    } },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [data]);

  return (
    <div className="halaman">
      <Kepala judul="Rapat" sub="Jadwal, agenda, hasil, dan notulen dalam satu alur."
        aksi={<>
          <button type="button" className="tombol" onClick={() => bukaForm('hasilRapat', {})}>Catat hasil tanpa jadwal</button>
          <button type="button" className="tombol utama" onClick={() => bukaForm('rapat', {})}><Ikon n="tambah" s={15} />Jadwalkan Rapat</button>
        </>} />
      <div className="bilah-mode">
        <Segmen value={seg} onChange={setSeg} opsi={[
          { value: 'mendatang', label: 'Terjadwal', jumlah: hitung('mendatang') },
          { value: 'perlu-hasil', label: 'Perlu hasil', jumlah: hitung('perlu-hasil') },
          { value: 'selesai', label: 'Selesai', jumlah: hitung('selesai') },
          { value: 'lain', label: 'Draft & batal', jumlah: hitung('lain') },
          { value: 'semua', label: 'Semua' },
        ]} />
      </div>
      <SaringBar jumlah={baris.length + ' baris'} adaSaring={!!(q || jenis)} onReset={() => { setQ(''); setJenis(''); }}>
        <KotakCari value={q} onChange={setQ} placeholder="Cari judul, peserta, pimpinan…" />
        <Pilih className="saring-pilih" value={jenis} onChange={setJenis} opsi={opsi(data, 'JENIS_RAPAT')} kosong="Semua jenis" placeholder="Jenis rapat" />
      </SaringBar>
      <Tabel id="rapat" kolom={kolom} baris={baris} kunci={(x) => x.id} onBuka={(x) => !(x.r && x.r._baru) && buka('rapat', x.id)}
        kelasBaris={(x) => (x.st.kunci === 'perlu-hasil' ? 'baris-sorot' : '')}
        kosong={seg === 'mendatang' ? 'Belum ada rapat terjadwal.' : 'Tidak ada rapat pada bagian ini.'} />
    </div>
  );
}
