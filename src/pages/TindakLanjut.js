import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../konteks';
import Kepala, { SaringBar, KotakCari, Segmen } from '../components/Kepala';
import Tabel from '../components/Tabel';
import { Pilih, MenuTitik } from '../components/Pilih';
import { EditPilihan, EditOrang, EditTanggal } from '../components/EditSel';
import { Lencana, Orang, Kosong } from '../components/Dasar';
import Ikon from '../components/Ikon';
import { pref, setPref } from '../simpanan';
import { cocokCari, kunciTanggal, tambahHari, tglPendek, selisihHari, waktuRelatif } from '../utils/format';
import { opsiOrang, opsiOrangId, labelStatusTl, nadaStatusTl, picCocok, BAWAAN } from '../utils/data';

const AWAL = { q: '', pic: '', isu: '', penanda: '', tenggat: '', status: '' };

export function aksiTl(app, t) {
  const { buka, bukaForm, hapus, tulis } = app;
  return [
    { label: 'Lihat rincian', onClick: () => buka('tindak-lanjut', t.ID_TINDAKLANJUT) },
    { label: 'Catat progres', onClick: () => bukaForm('progres', { item: t }) },
    { label: 'Edit', onClick: () => bukaForm('tl', { item: t }) },
    { label: 'Tambah turunan', onClick: () => bukaForm('tl', { awal: { idInduk: t.ID_TINDAKLANJUT, idNotulen: t.ID_NOTULEN, idArahanAsal: t.ID_ARAHAN_ASAL, idIsu: t.ID_ISU } }) },
    { label: 'Buat serupa', onClick: () => bukaForm('tl', { awal: { judul: t.JUDUL, catatan: t.CATATAN, pic: t.PIC, penanda: t.PENANDA } }) },
    { label: 'Buka kembali', hilang: t.STATUS !== 'Selesai', onClick: () => tulis('updateStatus', { id: t.ID_TINDAKLANJUT, status: 'Progress' }) },
    { garis: true },
    { label: 'Hapus', bahaya: true, onClick: () => hapus('deleteTindakLanjut', t.ID_TINDAKLANJUT, { judul: 'Hapus tindak lanjut?', pesan: '“' + t.JUDUL + '” akan dihapus. Penghapusan ditolak bila masih memiliki turunan atau menjadi bagian riwayat rapat.' }) },
  ];
}

export function TombolStatus({ t, kecil }) {
  const { tulis } = useApp();
  const cls = 'tombol ' + (kecil ? 'kecil ' : '');
  if (t._baru) return null;
  if (t.STATUS === 'Belum Dimulai') return <button type="button" className={cls + 'tipis'} onClick={(e) => { e.stopPropagation(); tulis('updateStatus', { id: t.ID_TINDAKLANJUT, status: 'Progress' }); }}>Mulai</button>;
  if (t.STATUS === 'Progress') return <button type="button" className={cls + 'sukses'} onClick={(e) => { e.stopPropagation(); tulis('updateStatus', { id: t.ID_TINDAKLANJUT, status: 'Selesai' }); }}><Ikon n="centang" s={13} />Selesaikan</button>;
  return null;
}

function Target({ t, hari }) {
  const k = kunciTanggal(t.TANGGAL_TARGET);
  if (!k) return <span className="samar kecil">tanpa target</span>;
  if (t.STATUS !== 'Selesai' && k < hari) return <span className="teks-merah kecil">lewat {selisihHari(hari, k)} hr</span>;
  return <span className={'kecil' + (t.URGENSI === 'kuning' ? ' teks-kuning' : '')}>{tglPendek(k)}</span>;
}

function KartuTl({ t }) {
  const app = useApp();
  const { data, buka } = app;
  const isu = data.peta.isu[t.ID_ISU];
  return (
    <article className={'kartu-tl u-' + t.URGENSI + (t._baru ? ' sementara' : '')} onClick={() => !t._baru && buka('tindak-lanjut', t.ID_TINDAKLANJUT)}>
      <h4>{t.JUDUL}</h4>
      {isu ? <div className="kt-pokok potong" title={isu.JUDUL}>{isu.JUDUL}</div> : null}
      {t.PROGRES_TERAKHIR ? <p className="kt-progres">{t.PROGRES_TERAKHIR}</p> : null}
      <div className="kt-bawah">
        <Orang nama={t.PIC} kosong="Tanpa PIC" />
        <Target t={t} hari={data.hari} />
      </div>
      <div className="kt-aksi" onClick={(e) => e.stopPropagation()}>
        {t.PENANDA ? <span className="kt-penanda" title={t.PENANDA}>{String(t.PENANDA).split(',').length} penanda</span> : <span />}
        <div className="kt-tombol"><TombolStatus t={t} kecil />{t._baru ? <small className="samar">menyimpan…</small> : <MenuTitik items={aksiTl(app, t)} />}</div>
      </div>
    </article>
  );
}

export default function TindakLanjut() {
  const app = useApp();
  const { data, rute, bukaForm, buka, tulis, saya, setSaya } = app;
  const [mode, setMode] = useState(() => (rute.query.saya ? 'saya' : pref('tl.mode', 'semua')));
  const [tampilan, setTampilan] = useState(() => pref('tl.tampilan', 'papan'));
  const [f, setF] = useState(() => Object.assign({}, AWAL, pref('saring.tl', {}), rute.query.tenggat ? { tenggat: rute.query.tenggat } : {}, rute.query.pic ? { pic: rute.query.pic } : {}));
  const [semuaSelesai, setSemuaSelesai] = useState(false);
  const [pilihan, setPilihan] = useState(() => new Set());
  useEffect(() => {
    if (rute.query.tenggat || rute.query.pic) setF(Object.assign({}, AWAL, { tenggat: rute.query.tenggat || '', pic: rute.query.pic || '' }));
    if (rute.query.saya) setMode('saya');
  }, [rute.query.tenggat, rute.query.pic, rute.query.saya]);
  useEffect(() => { setPref('saring.tl', f); }, [f]);
  useEffect(() => { setPref('tl.mode', mode); }, [mode]);
  useEffect(() => { setPref('tl.tampilan', tampilan); }, [tampilan]);
  const ubahF = (k, v) => setF((x) => Object.assign({}, x, { [k]: v }));
  const hari = data.hari;
  const orangSaya = data.peta.orang[saya];
  const orangOpsi = useMemo(() => opsiOrang(data), [data]);

  const baris = useMemo(() => data.tindakLanjut.filter((t) => {
    if (mode === 'saya' && (!orangSaya || !picCocok(t.PIC, orangSaya))) return false;
    if (!cocokCari(f.q, [t.JUDUL, t.CATATAN, t.PROGRES_TERAKHIR, t.PIC, data.peta.isu[t.ID_ISU] && data.peta.isu[t.ID_ISU].JUDUL])) return false;
    if (f.pic === '__kosong') { if (String(t.PIC || '').trim()) return false; } else if (f.pic) { const o = data.orang.find((p) => p.NAMA === f.pic); if (o ? !picCocok(t.PIC, o) : t.PIC !== f.pic) return false; }
    if (f.isu && t.ID_ISU !== f.isu) return false;
    if (f.penanda && String(t.PENANDA || '').indexOf(f.penanda) === -1) return false;
    const k = kunciTanggal(t.TANGGAL_TARGET);
    if (f.tenggat === 'terlambat' && !(t.STATUS !== 'Selesai' && k && k < hari)) return false;
    if (f.tenggat === '7hari' && !(t.STATUS !== 'Selesai' && k && k >= hari && k <= tambahHari(hari, 7))) return false;
    if (f.tenggat === 'tanpa' && (k || t.STATUS === 'Selesai')) return false;
    if (tampilan === 'daftar' && f.status && t.STATUS !== f.status) return false;
    return true;
  }), [data, f, mode, orangSaya, hari, tampilan]);

  const urut = (a, b) => {
    const u = { merah: 0, kuning: 1, abu: 2, hijau: 3 };
    if (u[a.URGENSI] !== u[b.URGENSI]) return u[a.URGENSI] - u[b.URGENSI];
    return (kunciTanggal(a.TANGGAL_TARGET) || '9999').localeCompare(kunciTanggal(b.TANGGAL_TARGET) || '9999');
  };

  const isuOpsi = useMemo(() => data.isu.filter((i) => data.tindakLanjut.some((t) => t.ID_ISU === i.ID_ISU)).map((i) => ({ value: i.ID_ISU, label: i.JUDUL })), [data]);
  const picOpsi = useMemo(() => [{ value: '__kosong', label: 'Tanpa PIC' }].concat(orangOpsi), [orangOpsi]);
  const adaSaring = JSON.stringify(f) !== JSON.stringify(AWAL);

  const kolom = useMemo(() => [
    { kunci: 'judul', judul: 'Tindak lanjut', lebar: 360, render: (t) => (
      <div className="dua-baris"><strong className="judul-baris"><span className={'titik-urgensi u-' + t.URGENSI} />{t.JUDUL}</strong>
        <small>{data.peta.isu[t.ID_ISU] ? data.peta.isu[t.ID_ISU].JUDUL : (t.ID_INDUK && data.peta.tl[t.ID_INDUK] ? 'Turunan dari: ' + data.peta.tl[t.ID_INDUK].JUDUL : '')}</small></div>
    ) },
    { kunci: 'status', judul: 'Status', lebar: 160, render: (t) => <EditPilihan value={t.STATUS} opsi={BAWAAN.STATUS_TL.map((s) => ({ value: s, label: labelStatusTl(s) }))} label={labelStatusTl} nada={nadaStatusTl} disabled={t._baru} onSimpan={(v) => tulis('updateStatus', { id: t.ID_TINDAKLANJUT, status: v })} /> },
    { kunci: 'pic', judul: 'PIC', lebar: 170, render: (t) => <EditOrang value={t.PIC} opsi={orangOpsi} onSimpan={(v) => tulis('updateTindakLanjut', { id: t.ID_TINDAKLANJUT, pic: v })} /> },
    { kunci: 'target', judul: 'Target', lebar: 130, render: (t) => <EditTanggal value={t.TANGGAL_TARGET} nada={t.URGENSI === 'merah' && t.STATUS !== 'Selesai' ? 'merah' : ''} onSimpan={(v) => tulis('updateTindakLanjut', { id: t.ID_TINDAKLANJUT, tanggalTarget: v })} /> },
    { kunci: 'penanda', judul: 'Penanda', lebar: 150, render: (t) => (t.PENANDA ? <span className="kecil">{t.PENANDA}</span> : <span className="samar">—</span>) },
    { kunci: 'upd', judul: 'Diperbarui', lebar: 120, render: (t) => <span className="kecil samar">{waktuRelatif(t.TANGGAL_UPDATE_TERAKHIR) || '—'}</span> },
    { kunci: 'aksi', judul: '', lebar: 52, tetapKanan: true, kelas: 'kolom-aksi', render: (t) => (t._baru ? null : <MenuTitik items={aksiTl(app, t)} />) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [data, orangOpsi]);

  const dipilih = Array.from(pilihan).filter((id) => data.peta.tl[id]);
  const bulk = (payload, label) => { tulis('bulkUpdateTindakLanjut', Object.assign({ ids: dipilih }, payload), { sukses: label }); setPilihan(new Set()); };

  const kolomPapan = BAWAAN.STATUS_TL.map((s) => {
    let isi = baris.filter((t) => t.STATUS === s);
    isi = s === 'Selesai' ? isi.sort((a, b) => new Date(b.TANGGAL_UPDATE_TERAKHIR || 0) - new Date(a.TANGGAL_UPDATE_TERAKHIR || 0)) : isi.sort(urut);
    return { s, isi };
  });

  return (
    <div className="halaman">
      <Kepala judul="Tindak Lanjut" sub="Pekerjaan hasil rapat, arahan, dan pokok bahasan."
        aksi={<button type="button" className="tombol utama" onClick={() => bukaForm('tl', {})}><Ikon n="tambah" s={15} />Tindak Lanjut</button>} />
      <div className="bilah-mode">
        <Segmen value={mode} onChange={setMode} opsi={[{ value: 'semua', label: 'Semua' }, { value: 'saya', label: 'Pekerjaan Saya' }]} />
        {mode === 'saya' ? <Pilih value={saya} onChange={setSaya} opsi={opsiOrangId(data)} placeholder="Pilih nama Anda" className="kecil" lebar={280} /> : null}
        <div className="dorong" />
        <Segmen value={tampilan} onChange={setTampilan} opsi={[{ value: 'papan', label: 'Papan' }, { value: 'daftar', label: 'Daftar' }]} />
      </div>
      <SaringBar jumlah={baris.length + ' tindak lanjut'} adaSaring={adaSaring} onReset={() => setF(AWAL)}>
        <KotakCari value={f.q} onChange={(v) => ubahF('q', v)} placeholder="Cari judul, progres, PIC…" />
        {mode === 'semua' ? <Pilih className="saring-pilih" value={f.pic} onChange={(v) => ubahF('pic', v)} opsi={picOpsi} kosong="Semua PIC" placeholder="PIC" lebar={260} /> : null}
        <Pilih className="saring-pilih" value={f.isu} onChange={(v) => ubahF('isu', v)} opsi={isuOpsi} kosong="Semua pokok bahasan" placeholder="Pokok bahasan" lebar={360} />
        <Pilih className="saring-pilih" value={f.tenggat} onChange={(v) => ubahF('tenggat', v)} opsi={[{ value: 'terlambat', label: 'Terlambat' }, { value: '7hari', label: '7 hari ke depan' }, { value: 'tanpa', label: 'Tanpa target' }]} kosong="Semua tenggat" placeholder="Tenggat" cari={false} />
        <Pilih className="saring-pilih" value={f.penanda} onChange={(v) => ubahF('penanda', v)} opsi={BAWAAN.PENANDA} kosong="Semua penanda" placeholder="Penanda" cari={false} />
        {tampilan === 'daftar' ? <Pilih className="saring-pilih" value={f.status} onChange={(v) => ubahF('status', v)} opsi={BAWAAN.STATUS_TL.map((s) => ({ value: s, label: labelStatusTl(s) }))} kosong="Semua status" placeholder="Status" cari={false} /> : null}
      </SaringBar>
      {mode === 'saya' && !orangSaya ? <Kosong ikon="orang">Pilih nama Anda di atas untuk menampilkan pekerjaan Anda.</Kosong> : tampilan === 'papan' ? (
        <div className="papan">
          {kolomPapan.map(({ s, isi }) => {
            const tampil = s === 'Selesai' && !semuaSelesai ? isi.slice(0, 12) : isi;
            return (
              <section key={s} className={'kolom-papan k-' + s.toLowerCase().replace(/\s/g, '-')}>
                <header><Lencana nada={nadaStatusTl(s)}>{labelStatusTl(s)}</Lencana><span className="jumlah">{isi.length}</span></header>
                <div className="kolom-isi">
                  {tampil.map((t) => <KartuTl key={t.ID_TINDAKLANJUT} t={t} />)}
                  {!isi.length ? <div className="kolom-kosong">Tidak ada.</div> : null}
                  {s === 'Selesai' && isi.length > 12 ? <button type="button" className="tautan-tombol" onClick={() => setSemuaSelesai((x) => !x)}>{semuaSelesai ? 'Tampilkan lebih sedikit' : 'Tampilkan semua (' + isi.length + ')'}</button> : null}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <>
          {dipilih.length ? (
            <div className="bilah-massal">
              <strong>{dipilih.length} dipilih</strong>
              <Pilih className="kecil" value="" onChange={(v) => v && bulk({ status: v }, 'Status diperbarui.')} opsi={BAWAAN.STATUS_TL.map((s) => ({ value: s, label: labelStatusTl(s) }))} placeholder="Ubah status" cari={false} />
              <Pilih className="kecil" value="" onChange={(v) => bulk({ pic: v }, 'PIC diperbarui.')} opsi={orangOpsi} placeholder="Ubah PIC" bebas lebar={280} />
              <Pilih className="kecil" value="" onChange={(v) => v && bulk({ penanda: v, penandaMode: 'add' }, 'Penanda ditambahkan.')} opsi={BAWAAN.PENANDA} placeholder="Tambah penanda" cari={false} />
              <Pilih className="kecil" value="" onChange={(v) => v && bulk({ penanda: v, penandaMode: 'remove' }, 'Penanda dihapus.')} opsi={BAWAAN.PENANDA} placeholder="Hapus penanda" cari={false} />
              <button type="button" className="tombol tipis kecil" onClick={() => setPilihan(new Set())}>Batal</button>
            </div>
          ) : null}
          <Tabel id="tl" kolom={kolom} baris={baris.slice().sort(urut)} kunci={(t) => t.ID_TINDAKLANJUT} onBuka={(t) => !t._baru && buka('tindak-lanjut', t.ID_TINDAKLANJUT)}
            pilihan={pilihan} onPilih={(id) => setPilihan((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
            onPilihSemua={(semua) => setPilihan(semua ? new Set(baris.map((t) => t.ID_TINDAKLANJUT)) : new Set())}
            kosong="Tidak ada tindak lanjut yang cocok." />
        </>
      )}
    </div>
  );
}
