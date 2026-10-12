// Navigasi hash: #halaman, #halaman/ID, #halaman?kunci=nilai. Tombol Back tetap berfungsi.
import { useEffect, useState } from 'react';
import { pref, setPref } from './simpanan';

export const HALAMAN = ['beranda', 'pokok', 'rapat', 'tindak-lanjut', 'arahan', 'pengaturan'];

export function urai(hash) {
  const raw = decodeURIComponent(String(hash || '').replace(/^#\/?/, ''));
  const [jalur, qs] = raw.split('?');
  const [hal, id] = (jalur || '').split('/');
  const query = {};
  new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
  return { hal: HALAMAN.indexOf(hal) !== -1 ? hal : '', id: id || '', query };
}

export function susun(hal, id, query) {
  let h = '#' + hal + (id ? '/' + encodeURIComponent(id) : '');
  const usp = new URLSearchParams();
  Object.keys(query || {}).forEach((k) => { if (query[k]) usp.set(k, query[k]); });
  const q = usp.toString();
  return q ? h + '?' + q : h;
}

/* ---- Riwayat dalam aplikasi untuk tombol ← → (urutan entri disimpan di history.state.i) ---- */
const KUNCI_MAKS = 'rtl.v6.riwayatMaks';
let posisi = 0;
let maks = 0;
function simpanMaks() { try { sessionStorage.setItem(KUNCI_MAKS, String(maks)); } catch (e) { /* abaikan */ } }
function posisiState() { const st = window.history.state; return st && typeof st.i === 'number' ? st.i : null; }
/** Dipanggil saat riwayat berpindah (Back/Forward peramban, tombol aplikasi, atau hash diketik). */
function sesuaikanRiwayat() {
  const i = posisiState();
  if (i === null) { posisi += 1; maks = posisi; simpanMaks(); window.history.replaceState({ i: posisi }, ''); }
  else posisi = i;
}
function mulaiRiwayat() {
  const i = posisiState();
  if (i === null) { posisi = 0; window.history.replaceState({ i: 0 }, ''); } else posisi = i;
  let m = 0;
  try { m = Number(sessionStorage.getItem(KUNCI_MAKS)) || 0; } catch (e) { m = 0; }
  maks = Math.max(posisi, m);
}
export function riwayat() { return { mundur: posisi > 0, maju: posisi < maks }; }
export function mundur() { if (posisi > 0) window.history.back(); }
export function maju() { if (posisi < maks) window.history.forward(); }

export function pergi(hal, id, query, ganti) {
  const h = susun(hal, id, query);
  if (window.location.hash === h) return;
  if (ganti) window.history.replaceState({ i: posisi }, '', h);
  else { posisi += 1; maks = posisi; simpanMaks(); window.history.pushState({ i: posisi }, '', h); }
  window.dispatchEvent(new Event('rtl-nav'));
}

export function useRute() {
  const [rute, setRute] = useState(() => {
    mulaiRiwayat();
    const r = urai(window.location.hash);
    if (!r.hal) {
      const terakhir = pref('halaman', 'beranda');
      const hal = HALAMAN.indexOf(terakhir) !== -1 ? terakhir : 'beranda';
      window.history.replaceState({ i: posisi }, '', '#' + hal);
      return { hal, id: '', query: {} };
    }
    return r;
  });
  useEffect(() => {
    const ubah = (e) => {
      if (e && (e.type === 'popstate' || e.type === 'hashchange')) sesuaikanRiwayat();
      const r = urai(window.location.hash);
      setRute(r.hal ? r : { hal: 'beranda', id: '', query: {} });
    };
    window.addEventListener('popstate', ubah);
    window.addEventListener('hashchange', ubah);
    window.addEventListener('rtl-nav', ubah);
    return () => {
      window.removeEventListener('popstate', ubah);
      window.removeEventListener('hashchange', ubah);
      window.removeEventListener('rtl-nav', ubah);
    };
  }, []);
  useEffect(() => { setPref('halaman', rute.hal); }, [rute.hal]);
  return rute;
}
