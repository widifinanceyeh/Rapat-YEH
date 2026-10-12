import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from './api';
import { APP_VERSION, API_URL } from './config';
import { bacaSalinan, simpanSalinan, hapusSalinan, pref, setPref, hapusPrefAwalan } from './simpanan';
import { useRute, pergi } from './navigasi';
import { Konteks } from './konteks';
import { olah, KOSONG } from './utils/data';
import { terapkan } from './utils/patch';
import Ikon from './components/Ikon';
import { Orang } from './components/Dasar';
import { Modal, Konfirmasi } from './components/Modal';
import Beranda from './pages/Beranda';
import PokokBahasan from './pages/PokokBahasan';
import Rapat from './pages/Rapat';
import TindakLanjut from './pages/TindakLanjut';
import Arahan from './pages/Arahan';
import DetailPokok from './pages/DetailPokok';
import DetailRapat, { DetailNotulen } from './pages/DetailRapat';
import DetailTL from './pages/DetailTL';
import DetailArahan from './pages/DetailArahan';
import Pengaturan from './pages/Pengaturan';
import Masuk from './pages/Masuk';
import FormPokok from './forms/FormPokok';
import FormRapat from './forms/FormRapat';
import FormTL from './forms/FormTL';
import FormArahan from './forms/FormArahan';
import FormNotulen from './forms/FormNotulen';
import FormSalinRapat from './forms/FormSalinRapat';
import FormHasilRapat from './forms/FormHasilRapat';
import FormProgres from './forms/FormProgres';
import logo from './logo.png';

const MENU = [
  { hal: 'beranda', label: 'Beranda', ikon: 'beranda' },
  { hal: 'pokok', label: 'Pokok Bahasan', ikon: 'pokok' },
  { hal: 'rapat', label: 'Rapat', ikon: 'rapat' },
  { hal: 'tindak-lanjut', label: 'Tindak Lanjut', ikon: 'tl' },
  { hal: 'arahan', label: 'Arahan', ikon: 'arahan' },
  { hal: 'pengaturan', label: 'Pengaturan', ikon: 'atur', pisah: true },
];
const FORM = { pokok: FormPokok, rapat: FormRapat, tl: FormTL, arahan: FormArahan, notulen: FormNotulen, salinRapat: FormSalinRapat, hasilRapat: FormHasilRapat, progres: FormProgres };

/** Gerbang masuk: aplikasi (dan salinan datanya) baru dimuat setelah ada sesi. */
export default function App() {
  const [sesi, setSesi] = useState(() => {
    const s = pref('sesi', null);
    if (s && s.token) api.setToken(s.token);
    return s && s.token ? s : null;
  });
  function masuk(hasil) {
    api.setToken(hasil.token);
    setPref('sesi', hasil);
    if (hasil.pengguna && hasil.pengguna.idOrang) setPref('saya', hasil.pengguna.idOrang);
    setSesi(hasil);
  }
  function keluar() {
    api.post('keluar', {}).catch(() => {});
    api.setToken('');
    setPref('sesi', null);
    hapusSalinan();
    setSesi(null);
  }
  if (!sesi) return <Masuk onMasuk={masuk} />;
  return <Aplikasi key={sesi.pengguna.id} sesi={sesi} onMasukUlang={masuk} onKeluar={keluar} />;
}

function Aplikasi({ sesi, onMasukUlang, onKeluar }) {
  const pengguna = sesi.pengguna;
  const rute = useRute();
  const [sesiHabis, setSesiHabis] = useState(false);
  const [raw, setRaw] = useState(null);
  const data = useMemo(() => olah(raw || KOSONG), [raw]);
  const [muat, setMuat] = useState({ awal: true, galat: '' });
  const [sinkron, setSinkron] = useState({ status: 'diam' });
  const [toasts, setToasts] = useState([]);
  const [form, setForm] = useState(null);
  const [tanyaState, setTanyaState] = useState(null);
  const [diagnosa, setDiagnosa] = useState(null);
  const [ciut, setCiut] = useState(() => pref('ciut', false));
  const [laci, setLaci] = useState(false);
  const [saya, setSayaState] = useState(() => pref('saya', ''));

  const server = useRef(null);
  const antrean = useRef([]);
  const terkonfirmasi = useRef([]);
  const timerSinkron = useRef(null);
  const sedangMuat = useRef(false);
  const cekTerakhir = useRef(0);
  const aktif = useRef(true);
  useEffect(() => () => { aktif.current = false; window.clearTimeout(timerSinkron.current); }, []);

  const toast = useCallback((pesan, jenis) => {
    const id = Date.now() + Math.random();
    setToasts((t) => t.concat([{ id, pesan, jenis: jenis || 'info' }]));
    if (jenis !== 'galat') window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const susunUlang = useCallback(() => {
    if (!server.current) return;
    const ops = terkonfirmasi.current.concat(antrean.current);
    setRaw(ops.reduce((r, op) => terapkan(r, op), server.current));
  }, []);

  const muatServer = useCallback(async (segar) => {
    if (sedangMuat.current) return;
    sedangMuat.current = true;
    const n = terkonfirmasi.current.length;
    try {
      const paket = await api.init(segar);
      if (!aktif.current) return;
      server.current = paket;
      terkonfirmasi.current.splice(0, n);
      simpanSalinan(paket);
      susunUlang();
      setMuat({ awal: false, galat: '' });
      if (segar) toast('Data terbaru sudah dimuat.', 'sukses');
    } catch (err) {
      if (err instanceof api.GalatSesi) return;
      setMuat((m) => ({ awal: false, galat: m.awal || !server.current ? err.message : '' }));
      if (server.current) toast('Gagal memuat data terbaru: ' + err.message, 'galat');
    } finally {
      sedangMuat.current = false;
    }
  }, [susunUlang, toast]);

  const jadwalSinkron = useCallback((jeda) => {
    window.clearTimeout(timerSinkron.current);
    timerSinkron.current = window.setTimeout(function cek() {
      if (!aktif.current) return;
      if (antrean.current.length) { timerSinkron.current = window.setTimeout(cek, 800); return; }
      muatServer(false);
    }, jeda || 1200);
  }, [muatServer]);

  const cekVersi = useCallback(async () => {
    if (!server.current || Date.now() - cekTerakhir.current < 20000) return;
    cekTerakhir.current = Date.now();
    try {
      const v = await api.versi();
      if (v.versi !== server.current.versi && !antrean.current.length) muatServer(false);
    } catch (err) { /* abaikan; dicoba saat berikutnya */ }
  }, [muatServer]);

  // Muat awal: salinan perangkat tampil seketika, lalu cek versi ringan.
  useEffect(() => {
    let batal = false;
    (async () => {
      const salinan = await bacaSalinan();
      if (batal) return;
      if (salinan) {
        server.current = salinan;
        setRaw(salinan);
        setMuat({ awal: false, galat: '' });
        cekTerakhir.current = 0;
        try {
          const v = await api.versi();
          if (v.versi !== salinan.versi) muatServer(false);
        } catch (err) { muatServer(false); }
      } else {
        muatServer(false);
      }
    })();
    const vis = () => { if (document.visibilityState === 'visible') cekVersi(); };
    const habis = () => setSesiHabis(true);
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('focus', vis);
    window.addEventListener('rtl-sesi-habis', habis);
    return () => {
      batal = true;
      document.removeEventListener('visibilitychange', vis); window.removeEventListener('focus', vis);
      window.removeEventListener('rtl-sesi-habis', habis);
    };
  }, [muatServer, cekVersi]);

  /** Satu tindakan simpan = satu permintaan. Tampil dulu di layar; dikembalikan bila ditolak. */
  const tulis = useCallback(async (action, payload, opsi = {}) => {
    const op = { action, payload, idSementara: 'BARU-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    const optimis = opsi.optimis !== false;
    if (optimis) { antrean.current.push(op); setRaw((r) => terapkan(r || KOSONG, op)); }
    setSinkron({ status: 'menyimpan' });
    try {
      const hasil = await api.post(action, payload);
      if (optimis) {
        antrean.current = antrean.current.filter((x) => x !== op);
        if (hasil && hasil.id && /^add/.test(action)) op.idAsli = hasil.id;
        terkonfirmasi.current.push(op);
        susunUlang();
      }
      setSinkron({ status: 'tersimpan', waktu: Date.now() });
      if (opsi.sukses) toast(opsi.sukses, 'sukses');
      jadwalSinkron();
      return hasil || {};
    } catch (err) {
      antrean.current = antrean.current.filter((x) => x !== op);
      susunUlang();
      const ulang = () => tulis(action, payload, opsi);
      setSinkron({ status: 'gagal', pesan: err.message, ulang: opsi.onGagal ? null : ulang });
      toast((opsi.label ? opsi.label + ': ' : 'Gagal menyimpan: ') + err.message, 'galat');
      if (opsi.onGagal) opsi.onGagal(err);
      if (err instanceof api.GalatData) jadwalSinkron(300);
      return null;
    }
  }, [jadwalSinkron, susunUlang, toast]);

  const bukaForm = useCallback((jenis, props) => setForm({ jenis, props: props || {} }), []);
  const tutupForm = useCallback(() => setForm(null), []);
  /** Form ditutup segera; bila server menolak, form dibuka lagi dengan isian yang sama. */
  const kirimForm = useCallback((action, payload, draf, opsi = {}) => {
    const sebelum = form;
    setForm(null);
    return tulis(action, payload, Object.assign({}, opsi, {
      onGagal: (err) => { if (sebelum) setForm({ jenis: sebelum.jenis, props: Object.assign({}, sebelum.props, { draf, galat: err.message }) }); },
    }));
  }, [form, tulis]);

  const tanya = useCallback((cfg) => new Promise((resolve) => setTanyaState(Object.assign({}, cfg, { resolve }))), []);
  const hapus = useCallback(async (action, id, cfg) => {
    const ya = await tanya(Object.assign({ label: 'Ya, hapus', bahaya: true }, cfg));
    if (!ya) return false;
    const r = await tulis(action, { id }, { label: 'Tidak dapat dihapus', sukses: 'Data dihapus.' });
    return !!r;
  }, [tanya, tulis]);

  const setSaya = useCallback((id) => { setSayaState(id); setPref('saya', id); }, []);
  const buka = useCallback((hal, id, query) => { setLaci(false); pergi(hal, id, query); }, []);
  const tutupPanel = useCallback(() => {
    if (window.history.length > 1 && rute.id) window.history.back();
    else pergi(rute.hal, '', rute.query, true);
  }, [rute]);

  async function jalankanDiagnosa() {
    setDiagnosa({ muat: true });
    const t0 = performance.now();
    try {
      const p = await api.ping();
      const waktu = Math.round(performance.now() - t0);
      const v = await api.versi();
      setDiagnosa({ versiKode: p.versiKode, versiData: v.versi, waktu });
    } catch (err) { setDiagnosa({ galat: err.message }); }
  }

  const menuGlobal = [
    { label: 'Refresh data', onClick: () => muatServer(true) },
    { label: 'Diagnosa', onClick: jalankanDiagnosa },
    { label: 'Reset lebar kolom', onClick: () => { hapusPrefAwalan('lebar.'); toast('Lebar kolom dikembalikan. Muat ulang halaman untuk melihatnya.'); } },
  ];

  const nilai = {
    data, rute, buka, tutupPanel, tulis, kirimForm, bukaForm, tutupForm, hapus, tanya, toast, saya, setSaya,
    sinkron, menuGlobal, pengguna,
  };

  const Halaman = { beranda: Beranda, pokok: PokokBahasan, rapat: Rapat, 'tindak-lanjut': TindakLanjut, arahan: Arahan, pengaturan: Pengaturan }[rute.hal] || Beranda;
  const FormAktif = form ? FORM[form.jenis] : null;

  let panel = null;
  if (rute.id && raw) {
    if (rute.hal === 'pokok') panel = <DetailPokok id={rute.id} />;
    else if (rute.hal === 'rapat') panel = /^NTL/i.test(rute.id) ? <DetailNotulen id={rute.id} /> : <DetailRapat id={rute.id} />;
    else if (rute.hal === 'tindak-lanjut') panel = <DetailTL id={rute.id} />;
    else if (rute.hal === 'arahan') panel = <DetailArahan id={rute.id} />;
  }

  return (
    <Konteks.Provider value={nilai}>
      <div className={'app' + (ciut ? ' ciut' : '') + (laci ? ' laci-buka' : '')}>
        <aside className="sisi">
          <div className="sisi-merek">
            <img src={logo} alt="Logo Yayasan Eka Harap" />
            <div className="merek-teks"><strong>Rapat &amp; Tindak Lanjut</strong><small>Yayasan Eka Harap · UNEKA</small></div>
          </div>
          <nav className="sisi-nav">
            {MENU.map((m) => (
              <button key={m.hal} type="button" className={'nav' + (rute.hal === m.hal ? ' aktif' : '') + (m.pisah ? ' nav-pisah' : '')} onClick={() => buka(m.hal)} title={m.label}>
                <Ikon n={m.ikon} s={18} /><span>{m.label}</span>
              </button>
            ))}
          </nav>
          <div className="sisi-kaki">
            <div className="sisi-pengguna" title={pengguna.nama + ' · ' + pengguna.peran}>
              <Orang nama={pengguna.nama} />
              <small>{pengguna.peran}</small>
              <button type="button" className="tombol-ikon" onClick={onKeluar} aria-label="Keluar" title="Keluar"><Ikon n="keluar" s={16} /></button>
            </div>
            <button type="button" className="nav ciutkan" onClick={() => { setCiut((c) => { setPref('ciut', !c); return !c; }); }} title={ciut ? 'Perluas menu' : 'Ciutkan menu'}>
              <Ikon n={ciut ? 'kanan' : 'kiri'} s={16} /><span>Ciutkan menu</span>
            </button>
            <small className="versi">{APP_VERSION}</small>
          </div>
        </aside>
        <div className="tirai" onClick={() => setLaci(false)} />
        <div className="isi-utama">
          <div className="bar-hp">
            <button type="button" className="tombol-ikon" onClick={() => setLaci(true)} aria-label="Buka menu"><Ikon n="menu" s={20} /></button>
            <img src={logo} alt="" /><strong>Rapat &amp; Tindak Lanjut</strong>
          </div>
          {muat.galat ? (
            <div className="bilah-galat"><Ikon n="peringatan" s={16} /><span>Data belum dapat dimuat: {muat.galat}</span>
              <button type="button" className="tombol kecil" onClick={() => muatServer(true)}>Coba lagi</button></div>
          ) : null}
          {muat.awal && !raw ? <div className="memuat"><span className="pemutar" />Memuat data…</div> : <Halaman />}
        </div>
      </div>
      {panel}
      {FormAktif ? <FormAktif key={form.jenis + JSON.stringify(Object.keys(form.props))} {...form.props} /> : null}
      {sesiHabis ? <Masuk ulang idAwal={pengguna.username} onMasuk={(h) => { onMasukUlang(h); setSesiHabis(false); jadwalSinkron(200); }} /> : null}
      <Konfirmasi state={tanyaState} onBatal={() => { tanyaState.resolve(false); setTanyaState(null); }} onYa={() => { tanyaState.resolve(true); setTanyaState(null); }} />
      {diagnosa ? (
        <Modal judul="Diagnosa" onTutup={() => setDiagnosa(null)} ukuran="sm" kaki={<button type="button" className="tombol" onClick={() => setDiagnosa(null)}>Tutup</button>}>
          <dl className="diagnosa">
            <dt>Versi web</dt><dd>{APP_VERSION}</dd>
            <dt>Versi kode backend</dt><dd>{diagnosa.muat ? 'memeriksa…' : (diagnosa.versiKode || '—')}</dd>
            <dt>Waktu respons</dt><dd>{diagnosa.waktu ? diagnosa.waktu + ' ms' : '—'}</dd>
            <dt>Versi data</dt><dd>{diagnosa.versiData ? new Date(Number(diagnosa.versiData)).toLocaleString('id-ID') : '—'}</dd>
            <dt>Alamat server</dt><dd className="kecil">…{API_URL.slice(-24)}</dd>
            {diagnosa.galat ? <><dt>Galat</dt><dd className="teks-merah">{diagnosa.galat}</dd></> : null}
          </dl>
        </Modal>
      ) : null}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={'toast ' + t.jenis}>
            <span>{t.pesan}</span>
            <button type="button" className="tombol-ikon" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Tutup"><Ikon n="tutup" s={14} /></button>
          </div>
        ))}
      </div>
    </Konteks.Provider>
  );
}
