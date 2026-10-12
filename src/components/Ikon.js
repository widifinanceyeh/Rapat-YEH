import React from 'react';

// Ikon garis sederhana (stroke), 24×24.
const P = {
  beranda: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  pokok: 'M4 5h16M4 5v14h16V5M8 9h8M8 13h8M8 17h5',
  rapat: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 12h3M8 16h6',
  tl: 'M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11',
  arahan: 'M4 5h16v11H8l-4 4zM8 9h8M8 12h5',
  tambah: 'M12 5v14M5 12h14',
  cari: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  titik: 'M5 12h.01M12 12h.01M19 12h.01',
  tutup: 'M6 6l12 12M18 6 6 18',
  kiri: 'M15 6l-6 6 6 6',
  kanan: 'M9 6l6 6-6 6',
  bawah: 'M6 9l6 6 6-6',
  atas: 'M6 15l6-6 6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  tautan: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  dok: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5',
  salin: 'M9 9h10v11H9zM5 15V4h10',
  segar: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
  centang: 'M5 12l5 5L20 7',
  peringatan: 'M12 4 2.5 20h19zM12 10v4M12 17h.01',
  orang: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  papan: 'M4 4h5v16H4zM10 4h5v10h-5zM16 4h4v13h-4z',
  daftar: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  baca: 'M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z',
  jam: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
};

export default function Ikon({ n, s = 16, className }) {
  const d = P[n];
  if (!d) return null;
  return (
    <svg className={'ikon ' + (className || '')} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}
