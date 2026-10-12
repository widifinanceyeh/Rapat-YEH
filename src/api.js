// Semua komunikasi ke Apps Script.
import { API_URL, TIMEOUT_BACA, TIMEOUT_TULIS } from './config';

export class GalatData extends Error {}
export class GalatJaringan extends Error {}

function urlDengan(params) {
  const usp = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
  });
  usp.set('_', String(Date.now()));
  return API_URL + '?' + usp.toString();
}

async function ambil(url, opsi, batas) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? window.setTimeout(() => ctrl.abort(), batas) : null;
  let res;
  try {
    res = await fetch(url, Object.assign({ redirect: 'follow', cache: 'no-store', signal: ctrl ? ctrl.signal : undefined }, opsi));
  } catch (err) {
    throw new GalatJaringan(err && err.name === 'AbortError'
      ? 'Server terlalu lama merespons.'
      : 'Tidak dapat terhubung ke server. Periksa koneksi internet.');
  } finally {
    if (timer) window.clearTimeout(timer);
  }
  if (!res.ok) throw new GalatJaringan('Server merespons ' + res.status + '.');
  let json;
  try { json = await res.json(); } catch (err) { throw new GalatJaringan('Respons server tidak terbaca.'); }
  if (!json || !json.success) throw new GalatData((json && json.message) || 'Permintaan ditolak server.');
  return json.data;
}

/** GET dengan batas waktu; diulang hanya untuk galat jaringan. */
export async function get(action, params = {}, ulang = 2) {
  let galat;
  for (let i = 0; i <= ulang; i++) {
    try {
      return await ambil(urlDengan(Object.assign({ action }, params)), { method: 'GET' }, TIMEOUT_BACA);
    } catch (err) {
      if (err instanceof GalatData) throw err;
      galat = err;
      await new Promise((r) => window.setTimeout(r, 600 * (i + 1)));
    }
  }
  throw galat;
}

function idPermintaan() {
  try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); } catch (e) { /* abaikan */ }
  return 'REQ-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

/** POST text/plain; bila jaringan gagal, cadangan GET ?p= dengan requestId sama (aman diulang). */
export async function post(action, payload) {
  const requestId = idPermintaan();
  const body = JSON.stringify({ action, payload, requestId });
  try {
    return await ambil(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body }, TIMEOUT_TULIS);
  } catch (err) {
    if (err instanceof GalatData) throw err;
    return ambil(urlDengan({ action, p: JSON.stringify({ payload, requestId }) }), { method: 'GET' }, TIMEOUT_TULIS);
  }
}

export const init = (segar) => get('init', segar ? { segar: '1' } : {});
export const versi = () => get('versi', {}, 0);
export const ping = () => get('ping', {}, 0);
export const bacaNotulen = (url) => get('bacaNotulen', { url }, 0);
