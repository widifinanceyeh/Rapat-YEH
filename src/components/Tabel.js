import React, { memo, useCallback, useRef, useState } from 'react';
import { pref, setPref } from '../simpanan';

/**
 * Tabel generik.
 * kolom: [{ kunci, judul, lebar, render(row), kelas, tetapKiri, tetapKanan }]
 * - kepala menempel, isi sel maks. 2 baris; klik ganda membuka/menutup isi penuh (satu baris).
 * - kolom pertama menempel di kiri, kolom aksi menempel di kanan; gulir samping hanya di dalam wadah.
 * - lebar kolom dapat diseret, tersimpan, dan direset dari menu ⋯.
 */
function Tabel({ id, kolom, baris, kunci, onBuka, kosong, pilihan, onPilih, onPilihSemua, kelasBaris }) {
  const [lebar, setLebar] = useState(() => pref('lebar.' + id, {}));
  const [terbuka, setTerbuka] = useState('');
  const seret = useRef(null);

  const mulaiSeret = useCallback((e, k, awal) => {
    e.preventDefault(); e.stopPropagation();
    seret.current = { k, x: e.clientX, awal };
    function gerak(ev) {
      const s = seret.current; if (!s) return;
      const w = Math.max(70, Math.round(s.awal + ev.clientX - s.x));
      setLebar((l) => Object.assign({}, l, { [s.k]: w }));
    }
    function lepas() {
      window.removeEventListener('mousemove', gerak); window.removeEventListener('mouseup', lepas);
      seret.current = null;
      setLebar((l) => { setPref('lebar.' + id, l); return l; });
    }
    window.addEventListener('mousemove', gerak); window.addEventListener('mouseup', lepas);
  }, [id]);

  const adaPilih = !!onPilih;
  const semua = adaPilih && baris.length > 0 && baris.every((r) => pilihan.has(kunci(r)));

  function klikBaris(e, r) {
    if (e.target.closest('button, a, input, select, textarea, label, .tanpa-buka, .popover')) return;
    if (onBuka) onBuka(r);
  }

  return (
    <div className="wadah-tabel">
      <table className="tabel">
        <colgroup>
          {kolom.map((c) => <col key={c.kunci} style={{ width: (lebar[c.kunci] || c.lebar || 140) + 'px' }} />)}
        </colgroup>
        <thead>
          <tr>
            {kolom.map((c, i) => (
              <th key={c.kunci} className={(c.kelas || '') + (i === 0 ? ' tetap-kiri' : '') + (c.tetapKanan ? ' tetap-kanan' : '')}>
                <div className="th-isi">
                  {i === 0 && adaPilih ? <input type="checkbox" className="cek-baris" checked={semua} onChange={() => onPilihSemua(!semua)} aria-label="Pilih semua" /> : null}
                  <span>{c.judul}</span>
                </div>
                {!c.tetapKanan ? <span className="penyeret" onMouseDown={(e) => mulaiSeret(e, c.kunci, (lebar[c.kunci] || c.lebar || 140))} /> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.map((r) => {
            const k = kunci(r);
            const dipilih = adaPilih && pilihan.has(k);
            return (
              <tr key={k} className={(terbuka === k ? 'terbuka ' : '') + (dipilih ? 'dipilih ' : '') + (kelasBaris ? kelasBaris(r) : '')}
                onClick={(e) => klikBaris(e, r)} onDoubleClick={(e) => { if (!e.target.closest('button, a, input, .popover')) setTerbuka((t) => (t === k ? '' : k)); }}>
                {kolom.map((c, i) => (
                  <td key={c.kunci} className={(c.kelas || '') + (i === 0 ? ' tetap-kiri' : '') + (c.tetapKanan ? ' tetap-kanan' : '')}>
                    <div className="sel">
                      {i === 0 && adaPilih ? <input type="checkbox" className="cek-baris" checked={dipilih} onChange={() => onPilih(k)} aria-label="Pilih baris" /> : null}
                      <div className="sel-isi">{c.render(r)}</div>
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!baris.length ? <div className="tabel-kosong">{kosong || 'Tidak ada data.'}</div> : null}
    </div>
  );
}
export default memo(Tabel);
