import React, { useMemo, useState } from 'react';
import Ikon from './Ikon';
import { Pilih } from './Pilih';
import { opsi, urlAman } from '../utils/data';

/** Nama situs ringkas untuk baris dokumen, mis. docs.google.com. */
function situs(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }

/**
 * Daftar tautan dokumen. Dokumen yang sudah lengkap tampil ringkas (judul, jenis, situs);
 * kotak isian hanya muncul saat menambah atau mengubah. Referensi lama bisa dipakai ulang tanpa mengetik URL.
 */
export default function EditorTautan({ value, onChange, data }) {
  const list = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [cari, setCari] = useState(false);
  const [edit, setEdit] = useState(-1);
  const ubah = (i, k, v) => onChange(list.map((x, j) => (j === i ? Object.assign({}, x, { [k]: v }) : x)));
  const tambah = (x) => { onChange(list.concat([x || { judul: '', url: '', jenisDokumen: 'Referensi' }])); if (!x) setEdit(list.length); };
  const hapus = (i) => { onChange(list.filter((_, j) => j !== i)); setEdit((e) => (e === i ? -1 : e > i ? e - 1 : e)); };
  const kumpulan = useMemo(() => {
    const ada = {};
    list.forEach((l) => { const u = urlAman(l.url); if (u) ada[u] = 1; });
    const seen = {};
    return (data.tautanDokumen || []).filter((t) => { const u = urlAman(t.URL); if (!u || seen[u] || ada[u]) return false; seen[u] = 1; return true; })
      .map((t) => ({ value: t.URL, label: t.JUDUL_TAUTAN || 'Dokumen', meta: t.JENIS_DOKUMEN, cari: t.URL, x: t }));
  }, [data.tautanDokumen, list]);
  return (
    <div className="editor-tautan">
      {list.map((l, i) => {
        const url = urlAman(l.url);
        // Baris yang belum lengkap atau URL-nya salah selalu tampil sebagai isian agar bisa dibetulkan.
        if (edit === i || !url) {
          return (
            <div className="baris-tautan" key={i}>
              <input value={l.judul || ''} onChange={(e) => ubah(i, 'judul', e.target.value)} placeholder="Judul dokumen" />
              <input value={l.url || ''} onChange={(e) => ubah(i, 'url', e.target.value)} placeholder="https://…" className={l.url && !url ? 'salah' : ''} />
              <Pilih value={l.jenisDokumen || 'Referensi'} onChange={(v) => ubah(i, 'jenisDokumen', v)} opsi={opsi(data, 'JENIS_DOKUMEN')} bebas lebar={180} />
              {edit === i && url ? (
                <button type="button" className="tombol-ikon" onClick={() => setEdit(-1)} aria-label="Selesai" title="Selesai"><Ikon n="centang" s={15} /></button>
              ) : (
                <button type="button" className="tombol-ikon" onClick={() => hapus(i)} aria-label="Hapus tautan" title="Hapus"><Ikon n="tutup" s={15} /></button>
              )}
            </div>
          );
        }
        return (
          <div className="tautan-ringkas" key={i}>
            <Ikon n="dok" s={15} />
            <span className="tautan-ringkas-isi">
              <a href={url} target="_blank" rel="noopener noreferrer" title={l.judul || url}>{l.judul || situs(url) || 'Dokumen'}</a>
              <small>{[l.jenisDokumen || 'Referensi', situs(url)].filter(Boolean).join(' · ')}</small>
            </span>
            <button type="button" className="tautan-tombol" onClick={() => setEdit(i)}>Ubah</button>
            <button type="button" className="tombol-ikon" onClick={() => hapus(i)} aria-label="Hapus tautan" title="Hapus"><Ikon n="tutup" s={15} /></button>
          </div>
        );
      })}
      <div className="baris-aksi-kecil">
        <button type="button" className="tombol tipis kecil" onClick={() => tambah()}><Ikon n="tambah" s={14} /> Tautan</button>
        {kumpulan.length ? (
          cari ? (
            <Pilih value="" onChange={(u) => { const k = kumpulan.find((x) => x.value === u); if (k) tambah({ judul: k.x.JUDUL_TAUTAN, url: k.x.URL, jenisDokumen: k.x.JENIS_DOKUMEN || 'Referensi' }); setCari(false); }}
              opsi={kumpulan} placeholder="Cari dokumen yang pernah dipakai…" lebar={420} />
          ) : <button type="button" className="tombol tipis kecil" onClick={() => setCari(true)}>Pakai dokumen lama</button>
        ) : null}
      </div>
    </div>
  );
}
