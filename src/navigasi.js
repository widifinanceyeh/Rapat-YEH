// Navigasi hash: #halaman, #halaman/ID, #halaman?kunci=nilai. Tombol Back tetap berfungsi.
import { useEffect, useState } from 'react';
import { pref, setPref } from './simpanan';

export const HALAMAN = ['beranda', 'pokok', 'rapat', 'tindak-lanjut', 'arahan'];

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

export function pergi(hal, id, query, ganti) {
  const h = susun(hal, id, query);
  if (window.location.hash === h) return;
  if (ganti) window.history.replaceState(null, '', h);
  else window.history.pushState(null, '', h);
  window.dispatchEvent(new Event('rtl-nav'));
}

export function useRute() {
  const [rute, setRute] = useState(() => {
    const r = urai(window.location.hash);
    if (!r.hal) {
      const terakhir = pref('halaman', 'beranda');
      const hal = HALAMAN.indexOf(terakhir) !== -1 ? terakhir : 'beranda';
      window.history.replaceState(null, '', '#' + hal);
      return { hal, id: '', query: {} };
    }
    return r;
  });
  useEffect(() => {
    const ubah = () => {
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
