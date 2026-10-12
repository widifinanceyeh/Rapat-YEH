import React, { useMemo, useState } from 'react';
import { useApp } from '../konteks';
import * as api from '../api';
import { Modal } from '../components/Modal';
import { Field, Lipat, Lencana } from '../components/Dasar';
import { Pilih } from '../components/Pilih';
import PilihPeserta from '../components/PilihPeserta';
import PilihOrang from '../components/PilihOrang';
import Ikon from '../components/Ikon';
import { GalatForm } from './umum';
import { hariIni, tglPanjang, teks } from '../utils/format';
import { BAWAAN, opsi, opsiOrang, opsiOrangId, judulAgenda, tautan, cariOrang, TAHAP_ARSIP, labelStatusTl } from '../utils/data';

const STATUS_HASIL = BAWAAN.STATUS_PEMBAHASAN.filter((s) => s !== 'Belum Dibahas');
const URL_DOC = /^https:\/\/docs\.google\.com\/document\/d\//i;

function statusDariKeputusan(k) {
  const t = teks(k).toLowerCase();
  if (!t) return 'Dibahas';
  if (t.indexOf('tidak dilanjutkan') !== -1) return 'Tidak Dilanjutkan';
  if (t.indexOf('ditunda') !== -1) return 'Ditunda';
  return 'Diputuskan';
}
/** Sel "Tindak Lanjut" berisi beberapa butir bernomor → dipecah per butir. */
function pecahButir(s) {
  const baris = teks(s).split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const butir = baris.filter((b) => /^(\d+[.)]|[-•*–])\s+/.test(b));
  if (butir.length > 1 && butir.length === baris.length) return baris.map((b) => b.replace(/^(\d+[.)]|[-•*–])\s+/, ''));
  return [teks(s).replace(/\n+/g, ' ')];
}
let urut = 0;
const idBaris = () => 'b' + (urut++);

export default function FormHasilRapat({ idRapat, draf, galat: galatAwal }) {
  const { data, tutupForm, tulis, toast, buka } = useApp();
  const r = idRapat ? data.peta.rapat[idRapat] : null;
  const notulenAda = r ? data.peta.notulen[r.ID_NOTULEN] : null;
  const dokAda = notulenAda ? tautan(data, 'Notulen', notulenAda.ID_NOTULEN, notulenAda.LINK_DOKUMEN, 'Notulen') : [];
  const agendaAwal = r ? (data.agendaPer[r.ID_RAPAT] || []).map((a) => ({
    kunci: a.ID_ITEM_RAPAT, judul: judulAgenda(data, a), jenis: a.JENIS_ITEM,
    statusPembahasan: a.STATUS_PEMBAHASAN && a.STATUS_PEMBAHASAN !== 'Belum Dibahas' ? a.STATUS_PEMBAHASAN : 'Dibahas',
    ringkasanPembahasan: a.RINGKASAN_PEMBAHASAN || '', hasilKeputusan: a.HASIL_KEPUTUSAN || '',
  })) : [];
  const [v, setV] = useState(() => Object.assign({
    rapatBaru: { judulRapat: '', tanggal: hariIni(), jenisRapat: '', idPimpinan: '', idNotulis: '', idPeserta: [] },
    url: dokAda[0] ? dokAda[0].url : '', judulNotulen: notulenAda ? notulenAda.JUDUL : (r ? r.JUDUL_RAPAT : ''),
    catatan: notulenAda ? (notulenAda.CATATAN || '') : '', agenda: agendaAwal, tl: [],
  }, draf || {}));
  const [baca, setBaca] = useState({ status: '', pesan: '' });
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState(galatAwal || '');
  const set = (k, x) => setV((s) => Object.assign({}, s, { [k]: x }));
  const setAgenda = (i, k, x) => setV((s) => Object.assign({}, s, { agenda: s.agenda.map((a, j) => (j === i ? Object.assign({}, a, { [k]: x }) : a)) }));
  const setTl = (id, k, x) => setV((s) => Object.assign({}, s, { tl: s.tl.map((t) => (t.id === id ? Object.assign({}, t, { [k]: x, peringatan: k === 'pic' || k === 'kunci' || k === 'tanggalTarget' ? '' : t.peringatan }) : t)) }));
  const orangOpsi = useMemo(() => opsiOrang(data), [data]);
  const pesertaOpsi = useMemo(() => opsiOrangId(data), [data]);
  // Dibaca sekali saat form dibuka, agar lipatan tidak menutup sendiri ketika centang dilepas.
  const [pesertaTerbuka] = useState(() => !!(draf && draf.rapatBaru && draf.rapatBaru.idPeserta && draf.rapatBaru.idPeserta.length));
  const tlLama = notulenAda ? data.tindakLanjut.filter((t) => t.ID_NOTULEN_ASAL === notulenAda.ID_NOTULEN || t.ID_NOTULEN === notulenAda.ID_NOTULEN) : [];
  const agendaOpsi = [{ value: '', label: 'Tanpa agenda' }].concat(v.agenda.map((a, i) => ({ value: a.kunci, label: (i + 1) + '. ' + a.judul })));
  const isuOpsi = useMemo(() => data.isu.filter((i) => TAHAP_ARSIP.indexOf(i.STATUS_ISU) === -1 && !v.agenda.some((a) => a.kunci === i.ID_ISU)).map((i) => ({ value: i.ID_ISU, label: i.JUDUL, meta: i.STATUS_ISU })), [data, v.agenda]);

  function cocokAgenda(baris, agenda) {
    const kode = teks(baris.kode).toUpperCase();
    if (kode) {
      const a = agenda.find((x) => x.kunci.toUpperCase() === kode);
      if (a) return a.kunci;
      if (r) { const it = (data.agendaPer[r.ID_RAPAT] || []).find((x) => x.ID_ISU === kode || x.ID_REFERENSI === kode); if (it) return it.ID_ITEM_RAPAT; }
    }
    const pk = teks(baris.pokok).toLowerCase();
    if (pk) {
      const a = agenda.find((x) => x.judul.toLowerCase() === pk) || agenda.find((x) => x.judul.toLowerCase().indexOf(pk) !== -1 || pk.indexOf(x.judul.toLowerCase()) !== -1);
      if (a) return a.kunci;
    }
    return '';
  }

  async function bacaDokumen() {
    const url = v.url.trim();
    if (!URL_DOC.test(url)) { setBaca({ status: 'galat', pesan: 'Tautan harus berupa Google Doc (https://docs.google.com/document/d/…).' }); return; }
    setBaca({ status: 'memuat', pesan: 'Membaca dokumen…' });
    let hasil;
    try { hasil = await api.bacaNotulen(url); } catch (err) { setBaca({ status: 'galat', pesan: err.message }); return; }
    if (!hasil.lampiranDitemukan) {
      setV((s) => Object.assign({}, s, { judulNotulen: s.judulNotulen || hasil.judul }));
      setBaca({ status: 'peringatan', pesan: 'Tabel lampiran tidak ditemukan. Tautan tetap disimpan; hasil dapat diisi manual. Pastikan judul kolom: Kode Agenda | Pokok Bahasan | Ringkasan Pembahasan | Keputusan | Tindak Lanjut | PIC | Target.' });
      return;
    }
    let agenda = v.agenda.slice();
    // Rapat tanpa jadwal: pokok bahasan dikenali dari kode ISU-… atau judul yang sama persis.
    if (!r) {
      hasil.baris.forEach((b) => {
        const kode = teks(b.kode).toUpperCase();
        const isu = data.peta.isu[kode] || data.isu.find((i) => teks(i.JUDUL).toLowerCase() === teks(b.pokok).toLowerCase());
        if (isu && !agenda.some((a) => a.kunci === isu.ID_ISU)) agenda.push({ kunci: isu.ID_ISU, judul: isu.JUDUL, jenis: 'Pokok Bahasan', statusPembahasan: 'Dibahas', ringkasanPembahasan: '', hasilKeputusan: '' });
      });
    }
    const isiAgenda = {};
    let tidakDikenal = 0;
    const tl = [];
    hasil.baris.forEach((b) => {
      const k = cocokAgenda(b, agenda);
      if (!k && (b.kode && b.kode !== '-')) tidakDikenal++;
      if (k) {
        const s = isiAgenda[k] || (isiAgenda[k] = { ringkasan: '', keputusan: '' });
        if (!s.ringkasan && b.ringkasan) s.ringkasan = b.ringkasan;
        if (!s.keputusan && b.keputusan) s.keputusan = b.keputusan;
      }
      if (teks(b.tindakLanjut)) {
        pecahButir(b.tindakLanjut).forEach((judul) => {
          const o = cariOrang(data, b.pic);
          const ket = [];
          if (b.pic && !o) ket.push('PIC “' + b.pic + '” belum ada di DaftarOrang');
          if (b.targetTeks && !b.target) ket.push('target “' + b.targetTeks + '” tidak terbaca');
          if (!k && b.kode && b.kode !== '-') ket.push('kode agenda ' + b.kode + ' tidak ada di rapat ini');
          tl.push({ id: idBaris(), kunci: k, judul, pic: o ? o.NAMA : teks(b.pic), tanggalTarget: b.target || '', peringatan: ket.join('; ') });
        });
      }
    });
    agenda = agenda.map((a) => {
      const s = isiAgenda[a.kunci];
      if (!s) return a;
      return Object.assign({}, a, {
        ringkasanPembahasan: s.ringkasan || a.ringkasanPembahasan, hasilKeputusan: s.keputusan || a.hasilKeputusan,
        statusPembahasan: s.keputusan ? statusDariKeputusan(s.keputusan) : a.statusPembahasan,
      });
    });
    setV((s) => Object.assign({}, s, { agenda, tl, judulNotulen: s.judulNotulen || hasil.judul }));
    const peringatan = tl.filter((t) => t.peringatan).length;
    setBaca({ status: peringatan || tidakDikenal ? 'peringatan' : 'ok', pesan: 'Terbaca ' + hasil.baris.length + ' baris: ' + Object.keys(isiAgenda).length + ' agenda, ' + tl.length + ' tindak lanjut.' + (peringatan ? ' ' + peringatan + ' baris perlu dicek (bertanda kuning).' : '') });
  }

  async function simpan(e) {
    e.preventDefault();
    if (sibuk) return;
    if (!r && !v.rapatBaru.judulRapat.trim()) { setGalat('Judul rapat wajib diisi.'); return; }
    const url = v.url.trim();
    if (url && !URL_DOC.test(url) && !/^https?:\/\//i.test(url)) { setGalat('Tautan notulen tidak valid.'); return; }
    let tautanNotulen;
    if (url && !dokAda.some((d) => d.url === url)) tautanNotulen = dokAda.concat([{ judul: v.judulNotulen || 'Notulen', url, jenisDokumen: 'Final' }]);
    const payload = {
      idRapat: r ? r.ID_RAPAT : '',
      rapatBaru: r ? undefined : Object.assign({}, v.rapatBaru, { judulRapat: v.rapatBaru.judulRapat.trim(), agendaIsu: v.agenda.map((a) => a.kunci) }),
      notulen: { judul: v.judulNotulen.trim() || (r ? r.JUDUL_RAPAT : v.rapatBaru.judulRapat.trim()), catatan: v.catatan, tautan: tautanNotulen, tanggal: r ? undefined : v.rapatBaru.tanggal },
      agenda: v.agenda.map((a) => ({ kunci: a.kunci, statusPembahasan: a.statusPembahasan, ringkasanPembahasan: a.ringkasanPembahasan, hasilKeputusan: a.hasilKeputusan })),
      tindakLanjut: v.tl.filter((t) => teks(t.judul)).map((t) => ({ kunci: t.kunci, judul: teks(t.judul), pic: t.pic, tanggalTarget: t.tanggalTarget })),
    };
    setSibuk(true); setGalat('');
    const hasil = await tulis('simpanHasilRapat', payload, { optimis: false, onGagal: (err) => setGalat(err.message) });
    setSibuk(false);
    if (!hasil) return;
    toast('Hasil rapat tersimpan' + (hasil.tindakLanjutBaru ? '; ' + hasil.tindakLanjutBaru + ' tindak lanjut baru.' : '.'), 'sukses');
    tutupForm();
    if (!r && hasil.idRapat) buka('rapat', hasil.idRapat);
  }

  const judul = r ? (notulenAda ? 'Edit hasil rapat' : 'Isi hasil rapat') : 'Catat hasil rapat tanpa jadwal';
  return (
    <Modal judul={judul} sub={r ? r.JUDUL_RAPAT + ' · ' + tglPanjang(r.TANGGAL) : 'Rapat dibuat otomatis dari isian ini.'} onTutup={tutupForm} ukuran="lg"
      kaki={<>
        <button type="button" className="tombol" onClick={tutupForm}>Batal</button>
        <button type="submit" form="form-hasil" className="tombol utama" disabled={sibuk}>{sibuk ? 'Menyimpan…' : notulenAda ? 'Simpan hasil' : 'Simpan & tutup rapat'}</button>
      </>}>
      <form id="form-hasil" onSubmit={simpan} className="form">
        <GalatForm pesan={galat} />
        {!r ? (
          <section className="blok">
            <h3 className="blok-judul"><span>1</span>Data rapat</h3>
            <div className="grid-3">
              <Field label="Judul rapat" wajib lebar="2"><input autoFocus value={v.rapatBaru.judulRapat} onChange={(e) => set('rapatBaru', Object.assign({}, v.rapatBaru, { judulRapat: e.target.value }))} /></Field>
              <Field label="Tanggal"><input type="date" value={v.rapatBaru.tanggal} onChange={(e) => set('rapatBaru', Object.assign({}, v.rapatBaru, { tanggal: e.target.value }))} /></Field>
            </div>
            <div className="grid-3">
              <Field label="Jenis"><Pilih value={v.rapatBaru.jenisRapat} onChange={(x) => set('rapatBaru', Object.assign({}, v.rapatBaru, { jenisRapat: x }))} opsi={opsi(data, 'JENIS_RAPAT')} kosong="— pilih —" bebas /></Field>
              <Field label="Pimpinan"><PilihOrang value={v.rapatBaru.idPimpinan} onChange={(x) => set('rapatBaru', Object.assign({}, v.rapatBaru, { idPimpinan: x }))} kosong="— belum ditentukan —" /></Field>
              <Field label="Notulis"><PilihOrang value={v.rapatBaru.idNotulis} onChange={(x) => set('rapatBaru', Object.assign({}, v.rapatBaru, { idNotulis: x }))} kosong="— belum ditentukan —" /></Field>
            </div>
            <Lipat judul={'Peserta (' + (v.rapatBaru.idPeserta || []).length + ')'} ringkas="opsional · ikut tercatat di notulen" terbuka={pesertaTerbuka}>
              <PilihPeserta value={v.rapatBaru.idPeserta || []} onChange={(x) => set('rapatBaru', Object.assign({}, v.rapatBaru, { idPeserta: x }))} opsi={pesertaOpsi} />
            </Lipat>
          </section>
        ) : null}

        <section className="blok">
          <h3 className="blok-judul"><span>{r ? 1 : 2}</span>Dokumen notulen</h3>
          <div className="baris-baca">
            <input value={v.url} onChange={(e) => { set('url', e.target.value); setBaca({ status: '', pesan: '' }); }} placeholder="Tempel tautan Google Doc notulen hasil /susun-notulen" />
            <button type="button" className="tombol utama" onClick={bacaDokumen} disabled={!v.url.trim() || baca.status === 'memuat'}><Ikon n="baca" s={15} />{baca.status === 'memuat' ? 'Membaca…' : 'Baca dokumen'}</button>
          </div>
          {baca.pesan ? <div className={'hasil-baca ' + baca.status}><Ikon n={baca.status === 'ok' ? 'centang' : 'peringatan'} s={15} /><span>{baca.pesan}</span></div> : (
            <small className="field-petunjuk">Tabel lampiran di akhir notulen dibaca otomatis: ringkasan, keputusan, dan tindak lanjut per agenda.</small>
          )}
          <Field label="Judul notulen"><input value={v.judulNotulen} onChange={(e) => set('judulNotulen', e.target.value)} placeholder={r ? r.JUDUL_RAPAT : 'Judul notulen'} /></Field>
          <Lipat judul="Ringkasan umum notulen" terbuka={!!v.catatan}>
            <textarea rows={3} value={v.catatan} onChange={(e) => set('catatan', e.target.value)} placeholder="Opsional. Kesimpulan keseluruhan rapat." />
          </Lipat>
        </section>

        <section className="blok">
          <h3 className="blok-judul"><span>{r ? 2 : 3}</span>Hasil per agenda <small>{v.agenda.length} agenda</small></h3>
          {v.agenda.length ? v.agenda.map((a, i) => (
            <div key={a.kunci} className="kartu-agenda">
              <div className="ka-kepala">
                <span className="no-agenda">{i + 1}</span>
                <strong className="potong">{a.judul}</strong>
                {a.jenis === 'Tindak Lanjut' ? <Lencana kecil>tindak lanjut lama</Lencana> : null}
                {!r ? <button type="button" className="tombol-ikon" onClick={() => setV((s) => Object.assign({}, s, { agenda: s.agenda.filter((_, j) => j !== i) }))} aria-label="Hapus agenda"><Ikon n="tutup" s={14} /></button> : null}
              </div>
              <div className="segmen kecil">
                {STATUS_HASIL.map((s) => <button key={s} type="button" className={a.statusPembahasan === s ? 'aktif' : ''} onClick={() => setAgenda(i, 'statusPembahasan', s)}>{s}</button>)}
              </div>
              <div className="grid-2">
                <textarea rows={2} value={a.ringkasanPembahasan} onChange={(e) => setAgenda(i, 'ringkasanPembahasan', e.target.value)} placeholder="Ringkasan pembahasan" />
                <textarea rows={2} value={a.hasilKeputusan} onChange={(e) => setAgenda(i, 'hasilKeputusan', e.target.value)} placeholder="Keputusan" />
              </div>
            </div>
          )) : <div className="samar kecil">{r ? 'Rapat ini tidak memiliki agenda. Tindak lanjut tetap dapat dicatat tanpa agenda.' : 'Tambahkan pokok bahasan yang dibahas (opsional).'}</div>}
          {!r ? <Pilih value="" onChange={(x) => { const i = data.peta.isu[x]; if (i) setV((s) => Object.assign({}, s, { agenda: s.agenda.concat([{ kunci: i.ID_ISU, judul: i.JUDUL, jenis: 'Pokok Bahasan', statusPembahasan: 'Dibahas', ringkasanPembahasan: '', hasilKeputusan: '' }]) })); }} opsi={isuOpsi} placeholder="+ Tambah pokok bahasan yang dibahas" lebar={460} /> : null}
        </section>

        <section className="blok">
          <h3 className="blok-judul"><span>{r ? 3 : 4}</span>Tindak lanjut baru <small>{v.tl.length}</small></h3>
          {tlLama.length ? <div className="samar kecil">Sudah tercatat dari rapat ini: {tlLama.map((t) => t.JUDUL + ' (' + labelStatusTl(t.STATUS) + ')').join('; ')}.</div> : null}
          {v.tl.length ? (
            <div className="tabel-tl-baru">
              <div className="ttb-kepala"><span>Agenda</span><span>Pekerjaan</span><span>PIC</span><span>Target</span><span /></div>
              {v.tl.map((t) => (
                <div key={t.id} className={'ttb-baris' + (t.peringatan ? ' perlu-cek' : '')}>
                  <Pilih value={t.kunci} onChange={(x) => setTl(t.id, 'kunci', x)} opsi={agendaOpsi} cari={false} lebar={320} />
                  <input value={t.judul} onChange={(e) => setTl(t.id, 'judul', e.target.value)} placeholder="Pekerjaan" />
                  <Pilih value={t.pic} onChange={(x) => setTl(t.id, 'pic', x)} opsi={orangOpsi} kosong="— belum ditentukan —" bebas placeholder="PIC" lebar={280} />
                  <input type="date" value={t.tanggalTarget} onChange={(e) => setTl(t.id, 'tanggalTarget', e.target.value)} />
                  <button type="button" className="tombol-ikon" onClick={() => setV((s) => Object.assign({}, s, { tl: s.tl.filter((x) => x.id !== t.id) }))} aria-label="Hapus baris"><Ikon n="tutup" s={14} /></button>
                  {t.peringatan ? <small className="ttb-peringatan"><Ikon n="peringatan" s={12} />{t.peringatan}</small> : null}
                </div>
              ))}
            </div>
          ) : null}
          <button type="button" className="tombol tipis kecil" onClick={() => setV((s) => Object.assign({}, s, { tl: s.tl.concat([{ id: idBaris(), kunci: s.agenda[0] ? s.agenda[0].kunci : '', judul: '', pic: '', tanggalTarget: '', peringatan: '' }]) }))}>
            <Ikon n="tambah" s={14} />Baris tindak lanjut
          </button>
          <small className="field-petunjuk">Tindak lanjut dikaitkan ke pokok bahasan agendanya. Bila pokok bahasan sudah punya tindak lanjut utama, baris ini menjadi turunannya.</small>
        </section>
      </form>
    </Modal>
  );
}
