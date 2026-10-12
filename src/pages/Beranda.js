import React, { useMemo, useState } from 'react';
import { useApp } from '../konteks';
import Kepala, { KotakCari } from '../components/Kepala';
import { Lencana, Kosong, Orang } from '../components/Dasar';
import { Pilih } from '../components/Pilih';
import Ikon from '../components/Ikon';
import { kunciTanggal, tambahHari, tglPanjang, hariSaja, tglPendek, rentangJam, cocokCari, selisihHari } from '../utils/format';
import { statusRapat, picCocok, opsiOrangId, labelStatusTl, tautan } from '../utils/data';

export default function Beranda() {
  const { data, buka, bukaForm, saya, setSaya } = useApp();
  const [q, setQ] = useState('');
  const hari = data.hari;
  const orangSaya = data.peta.orang[saya];

  const r = useMemo(() => {
    const aktifTl = data.tindakLanjut.filter((t) => t.STATUS !== 'Selesai');
    const mendatang7 = data.rapat.filter((x) => statusRapat(x, hari).kunci === 'mendatang' && kunciTanggal(x.TANGGAL) <= tambahHari(hari, 7));
    const perluHasil = data.rapat.filter((x) => statusRapat(x, hari).kunci === 'perlu-hasil');
    const terlambat = aktifTl.filter((t) => { const k = kunciTanggal(t.TANGGAL_TARGET); return k && k < hari; });
    const keputusan = data.isu.filter((x) => x.STATUS_ISU === 'Menunggu Keputusan').length
      + aktifTl.filter((t) => String(t.PENANDA || '').indexOf('Perlu Keputusan') !== -1).length;
    const batas = tambahHari(hari, 14);
    const jadwal = {};
    const tambah = (k, e) => { if (k && k >= hari && k <= batas) (jadwal[k] = jadwal[k] || []).push(e); };
    data.rapat.filter((x) => x.STATUS !== 'Dibatalkan' && !x.ID_NOTULEN).forEach((x) => tambah(kunciTanggal(x.TANGGAL), { jenis: 'rapat', x }));
    aktifTl.forEach((t) => tambah(kunciTanggal(t.TANGGAL_TARGET), { jenis: 'tl', x: t }));
    const hariJadwal = Object.keys(jadwal).sort().map((k) => ({ k, isi: jadwal[k].sort((a, b) => (a.jenis === 'rapat' ? (a.x.JAM_MULAI || '00') : '99').localeCompare(b.jenis === 'rapat' ? (b.x.JAM_MULAI || '00') : '99')) }));
    const milikSaya = orangSaya ? aktifTl.filter((t) => picCocok(t.PIC, orangSaya)).sort((a, b) => (kunciTanggal(a.TANGGAL_TARGET) || '9999').localeCompare(kunciTanggal(b.TANGGAL_TARGET) || '9999')) : [];
    const lengkapi = [
      { label: 'Tindak lanjut aktif tanpa PIC', n: aktifTl.filter((t) => !String(t.PIC || '').trim()).length, ke: ['tindak-lanjut', '', { pic: '__kosong' }] },
      { label: 'Tindak lanjut aktif tanpa target', n: aktifTl.filter((t) => !t.TANGGAL_TARGET).length, ke: ['tindak-lanjut', '', { tenggat: 'tanpa' }] },
      { label: 'Rapat tanpa hasil', n: perluHasil.length, ke: ['rapat', '', { f: 'perlu-hasil' }] },
      { label: 'Siap dibahas tanpa dokumen', n: data.isu.filter((i) => i.STATUS_ISU === 'Siap Dibahas' && !tautan(data, 'Pokok Bahasan', i.ID_ISU).length).length, ke: ['pokok', '', { tahap: 'Siap Dibahas' }] },
    ].filter((x) => x.n > 0);
    return { mendatang7, perluHasil, terlambat, keputusan, hariJadwal, milikSaya, lengkapi };
  }, [data, hari, orangSaya]);

  const hasilCari = useMemo(() => {
    if (!q.trim()) return null;
    const grup = [
      { judul: 'Pokok Bahasan', list: data.isu.filter((x) => cocokCari(q, [x.JUDUL, x.RINGKASAN, x.PIC_UTAMA, x.KATEGORI])).slice(0, 6).map((x) => ({ k: x.ID_ISU, t: x.JUDUL, m: x.STATUS_ISU, ke: ['pokok', x.ID_ISU] })) },
      { judul: 'Rapat', list: data.rapat.filter((x) => cocokCari(q, [x.JUDUL_RAPAT, x.JENIS_RAPAT, x.PESERTA])).slice(0, 6).map((x) => ({ k: x.ID_RAPAT, t: x.JUDUL_RAPAT, m: tglPendek(x.TANGGAL), ke: ['rapat', x.ID_RAPAT] })) },
      { judul: 'Tindak Lanjut', list: data.tindakLanjut.filter((x) => cocokCari(q, [x.JUDUL, x.CATATAN, x.PIC, x.PROGRES_TERAKHIR])).slice(0, 6).map((x) => ({ k: x.ID_TINDAKLANJUT, t: x.JUDUL, m: labelStatusTl(x.STATUS), ke: ['tindak-lanjut', x.ID_TINDAKLANJUT] })) },
      { judul: 'Arahan', list: data.arahan.filter((x) => cocokCari(q, [x.ISI_ARAHAN, x.PEMBERI_ARAHAN, x.CATATAN])).slice(0, 4).map((x) => ({ k: x.ID_ARAHAN, t: x.ISI_ARAHAN, m: tglPendek(x.TANGGAL), ke: ['arahan', x.ID_ARAHAN] })) },
      { judul: 'Notulen', list: data.notulen.filter((x) => cocokCari(q, [x.JUDUL, x.CATATAN])).slice(0, 4).map((x) => ({ k: x.ID_NOTULEN, t: x.JUDUL, m: tglPendek(x.TANGGAL), ke: ['rapat', x.ID_RAPAT || x.ID_NOTULEN] })) },
    ];
    return grup.filter((g) => g.list.length);
  }, [q, data]);

  const kartu = [
    { label: 'Rapat 7 hari ke depan', n: r.mendatang7.length, ikon: 'rapat', ke: ['rapat', '', { f: 'mendatang' }] },
    { label: 'Rapat perlu diisi hasilnya', n: r.perluHasil.length, ikon: 'dok', ke: ['rapat', '', { f: 'perlu-hasil' }], nada: r.perluHasil.length ? 'kuning' : '' },
    { label: 'Tindak lanjut terlambat', n: r.terlambat.length, ikon: 'jam', ke: ['tindak-lanjut', '', { tenggat: 'terlambat' }], nada: r.terlambat.length ? 'merah' : '' },
    { label: 'Menunggu keputusan', n: r.keputusan, ikon: 'peringatan', ke: ['pokok', '', { tahap: 'Menunggu Keputusan' }] },
  ];

  return (
    <div className="halaman">
      <Kepala judul="Beranda" sub={tglPanjang(hari)} aksi={<button type="button" className="tombol utama" onClick={() => bukaForm('pokok', {})}><Ikon n="tambah" s={15} />Pokok Bahasan</button>} />
      <div className="beranda-cari"><KotakCari value={q} onChange={setQ} placeholder="Cari pokok bahasan, rapat, tindak lanjut, arahan, notulen…" /></div>
      {hasilCari ? (
        <div className="kartu hasil-cari">
          {hasilCari.length ? hasilCari.map((g) => (
            <div key={g.judul} className="grup-cari">
              <h3>{g.judul}</h3>
              {g.list.map((x) => <button key={x.k} type="button" className="baris-daftar" onClick={() => buka(x.ke[0], x.ke[1])}><span className="potong">{x.t}</span><small>{x.m}</small></button>)}
            </div>
          )) : <Kosong ikon="cari">Tidak ada yang cocok dengan “{q}”.</Kosong>}
        </div>
      ) : (
        <>
          <div className="ringkasan">
            {kartu.map((k) => (
              <button key={k.label} type="button" className={'angka' + (k.nada ? ' nada-' + k.nada : '')} onClick={() => buka(k.ke[0], k.ke[1], k.ke[2])}>
                <span className="angka-ikon"><Ikon n={k.ikon} s={18} /></span>
                <strong>{k.n}</strong><span>{k.label}</span>
              </button>
            ))}
          </div>
          <div className="beranda-grid">
            <section className="kartu">
              <div className="kartu-kepala"><h2>Jadwal 14 hari</h2><button type="button" className="tautan-tombol" onClick={() => buka('rapat')}>Semua rapat</button></div>
              {r.hariJadwal.length ? (
                <ol className="jadwal">
                  {r.hariJadwal.map((h) => (
                    <li key={h.k}>
                      <div className={'jadwal-tgl' + (h.k === hari ? ' hari-ini' : '')}><strong>{h.k.slice(8)}</strong><small>{h.k === hari ? 'Hari ini' : hariSaja(h.k)}</small></div>
                      <div className="jadwal-isi">
                        {h.isi.map((e) => e.jenis === 'rapat' ? (
                          <button key={e.x.ID_RAPAT} type="button" className="baris-jadwal" onClick={() => buka('rapat', e.x.ID_RAPAT)}>
                            <Lencana nada="biru" kecil>Rapat{rentangJam(e.x) ? ' ' + rentangJam(e.x) : ''}</Lencana>
                            <span className="potong">{e.x.JUDUL_RAPAT}</span>
                            <small>{(data.agendaPer[e.x.ID_RAPAT] || []).length} agenda</small>
                          </button>
                        ) : (
                          <button key={e.x.ID_TINDAKLANJUT} type="button" className="baris-jadwal" onClick={() => buka('tindak-lanjut', e.x.ID_TINDAKLANJUT)}>
                            <Lencana nada={e.x.URGENSI === 'kuning' ? 'kuning' : 'abu'} kecil>Tenggat</Lencana>
                            <span className="potong">{e.x.JUDUL}</span>
                            <small><Orang nama={e.x.PIC} kosong="Tanpa PIC" /></small>
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : <Kosong ikon="rapat">Tidak ada rapat atau tenggat dalam 14 hari ke depan.</Kosong>}
            </section>
            <div className="kolom-kanan">
              <section className="kartu">
                <div className="kartu-kepala">
                  <h2>Pekerjaan Saya</h2>
                  <Pilih value={saya} onChange={setSaya} opsi={opsiOrangId(data)} placeholder="Pilih nama Anda" kosong="— belum dipilih —" className="kecil tipis" lebar={280} />
                </div>
                {!orangSaya ? <Kosong ikon="orang">Pilih nama Anda untuk melihat tindak lanjut yang menjadi tanggung jawab Anda.</Kosong>
                  : r.milikSaya.length ? (
                    <>
                      <ul className="daftar-ringkas">
                        {r.milikSaya.slice(0, 6).map((t) => {
                          const k = kunciTanggal(t.TANGGAL_TARGET);
                          const lewat = k && k < hari;
                          return (
                            <li key={t.ID_TINDAKLANJUT}>
                              <button type="button" className="baris-daftar" onClick={() => buka('tindak-lanjut', t.ID_TINDAKLANJUT)}>
                                <span className={'titik-urgensi u-' + t.URGENSI} />
                                <span className="potong">{t.JUDUL}</span>
                                <small className={lewat ? 'teks-merah' : ''}>{k ? (lewat ? 'lewat ' + selisihHari(hari, k) + ' hr' : tglPendek(k)) : 'tanpa target'}</small>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <button type="button" className="tautan-tombol" onClick={() => buka('tindak-lanjut', '', { saya: '1' })}>Lihat semua ({r.milikSaya.length})</button>
                    </>
                  ) : <Kosong ikon="centang">Tidak ada tindak lanjut aktif atas nama Anda.</Kosong>}
              </section>
              {r.lengkapi.length ? (
                <section className="kartu">
                  <div className="kartu-kepala"><h2>Perlu dilengkapi</h2></div>
                  <ul className="daftar-ringkas">
                    {r.lengkapi.map((x) => (
                      <li key={x.label}><button type="button" className="baris-daftar" onClick={() => buka(x.ke[0], x.ke[1], x.ke[2])}><span className="isi">{x.label}</span><b className="hitung">{x.n}</b></button></li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
