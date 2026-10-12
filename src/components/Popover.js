import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Panel mengambang yang diposisikan "fixed" terhadap pemicunya,
 * sehingga tidak terpotong oleh tabel atau isi modal yang bergulir.
 */
export default function Popover({ jangkar, buka, onTutup, lebar, children, rata = 'kiri', className }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!buka || !jangkar.current) return undefined;
    function hitung() {
      const r = jangkar.current.getBoundingClientRect();
      const w = lebar || Math.max(r.width, 220);
      const tinggiMaks = 320;
      const bawah = window.innerHeight - r.bottom;
      const keAtas = bawah < 240 && r.top > bawah;
      let left = rata === 'kanan' ? r.right - w : r.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      setPos({ left, width: w, top: keAtas ? undefined : r.bottom + 4, bottom: keAtas ? window.innerHeight - r.top + 4 : undefined, maxHeight: Math.min(tinggiMaks, (keAtas ? r.top : bawah) - 16) });
    }
    hitung();
    window.addEventListener('resize', hitung);
    window.addEventListener('scroll', hitung, true);
    return () => { window.removeEventListener('resize', hitung); window.removeEventListener('scroll', hitung, true); };
  }, [buka, jangkar, lebar, rata]);

  useEffect(() => {
    if (!buka) return undefined;
    function luar(e) {
      if (ref.current && ref.current.contains(e.target)) return;
      if (jangkar.current && jangkar.current.contains(e.target)) return;
      onTutup();
    }
    function esc(e) { if (e.key === 'Escape') { e.stopPropagation(); onTutup(); } }
    document.addEventListener('mousedown', luar);
    document.addEventListener('keydown', esc, true);
    return () => { document.removeEventListener('mousedown', luar); document.removeEventListener('keydown', esc, true); };
  }, [buka, jangkar, onTutup]);

  if (!buka || !pos) return null;
  return createPortal(
    <div ref={ref} className={'popover ' + (className || '')} style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }}
      onClick={(e) => e.stopPropagation()}>
      {children}
    </div>,
    document.body
  );
}
