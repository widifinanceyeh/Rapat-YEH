import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Ikon from './Ikon';
import { NavRiwayat } from './Kepala';

function useEsc(aktif, fn) {
  useEffect(() => {
    if (!aktif) return undefined;
    const h = (e) => { if (e.key === 'Escape') fn(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [aktif, fn]);
}

/** Modal formulir: kepala ringkas, isi bergulir, kaki menempel (maks. 2 tombol). */
export function Modal({ judul, sub, onTutup, children, kaki, ukuran = 'md' }) {
  useEsc(true, onTutup);
  return createPortal(
    <div className="lapis" onMouseDown={(e) => { if (e.target === e.currentTarget) onTutup(); }}>
      <div className={'modal ukuran-' + ukuran} role="dialog" aria-modal="true" aria-label={judul}>
        <header className="modal-kepala">
          <div><h2>{judul}</h2>{sub ? <p>{sub}</p> : null}</div>
          <button type="button" className="tombol-ikon" onClick={onTutup} aria-label="Tutup"><Ikon n="tutup" s={18} /></button>
        </header>
        <div className="modal-isi">{children}</div>
        {kaki ? <footer className="modal-kaki">{kaki}</footer> : null}
      </div>
    </div>,
    document.body
  );
}

/** Panel detail dari kanan; ditutup dengan Back, Esc, atau klik di luar. */
export function Panel({ onTutup, kepala, aksi, children }) {
  useEsc(true, onTutup);
  return createPortal(
    <div className="lapis lapis-panel" onMouseDown={(e) => { if (e.target === e.currentTarget) onTutup(); }}>
      <aside className="panel" role="dialog" aria-modal="true">
        <header className="panel-kepala">
          <button type="button" className="tombol-ikon" onClick={onTutup} aria-label="Tutup panel"><Ikon n="tutup" s={18} /></button>
          <div className="panel-judul">{kepala}</div>
          <NavRiwayat />
        </header>
        {aksi ? <div className="panel-aksi">{aksi}</div> : null}
        <div className="panel-isi">{children}</div>
      </aside>
    </div>,
    document.body
  );
}

export function Konfirmasi({ state, onBatal, onYa }) {
  useEsc(!!state, onBatal);
  if (!state) return null;
  return createPortal(
    <div className="lapis lapis-atas" onMouseDown={(e) => { if (e.target === e.currentTarget) onBatal(); }}>
      <div className="modal ukuran-sm" role="alertdialog" aria-modal="true">
        <header className="modal-kepala"><div><h2>{state.judul}</h2></div></header>
        <div className="modal-isi"><p className="konfirmasi-pesan">{state.pesan}</p></div>
        <footer className="modal-kaki">
          <button type="button" className="tombol" onClick={onBatal}>Batal</button>
          <button type="button" autoFocus className={'tombol ' + (state.bahaya ? 'bahaya' : 'utama')} onClick={onYa}>{state.label || 'Lanjutkan'}</button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
