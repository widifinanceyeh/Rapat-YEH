// Salinan data di perangkat (IndexedDB). Bila ditolak peramban, diabaikan diam-diam.
import { APP_VERSION, STORAGE_KEY } from './config';

const DB = STORAGE_KEY + '.data';
const STORE = 'paket';

function buka() {
  return new Promise((resolve, reject) => {
    try {
      const req = window.indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) { reject(err); }
  });
}

export async function bacaSalinan() {
  try {
    const db = await buka();
    const nilai = await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get('utama');
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => resolve(null);
    });
    if (!nilai || nilai.appVersion !== APP_VERSION) return null;
    return nilai.paket;
  } catch (err) { return null; }
}

export async function simpanSalinan(paket) {
  try {
    const db = await buka();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ appVersion: APP_VERSION, paket, waktu: Date.now() }, 'utama');
  } catch (err) { /* abaikan */ }
}

export async function hapusSalinan() {
  try {
    const db = await buka();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete('utama');
  } catch (err) { /* abaikan */ }
}

// Preferensi tampilan (filter, lebar kolom, halaman terakhir) di localStorage.
export function pref(kunci, bawaan) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY + '.' + kunci);
    return raw === null ? bawaan : JSON.parse(raw);
  } catch (err) { return bawaan; }
}
export function setPref(kunci, nilai) {
  try { window.localStorage.setItem(STORAGE_KEY + '.' + kunci, JSON.stringify(nilai)); } catch (err) { /* abaikan */ }
}
export function hapusPrefAwalan(awalan) {
  try {
    Object.keys(window.localStorage).forEach((k) => {
      if (k.indexOf(STORAGE_KEY + '.' + awalan) === 0) window.localStorage.removeItem(k);
    });
  } catch (err) { /* abaikan */ }
}
