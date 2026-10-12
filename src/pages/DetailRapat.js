import React from 'react';
import { useApp } from '../konteks';
import { Panel } from '../components/Modal';
import { Lencana, Bagian, DaftarTautan, Info, Kosong, Orang } from '../components/Dasar';
import { MenuTitik } from '../components/Pilih';
import Ikon from '../components/Ikon';
import { aksiRapat, salinBahan } from './Rapat';
import { DaftarTlRingkas } from './DetailTL';
import { tglPanjang, tgl, rentangJam } from '../utils/format';
import { statusRapat, nadaPembahasan, judulAgenda, tautan } from '../utils/data';

function Peserta({ data, r }) {
  const o = (id, nama) => { const x = data.peta.orang[id]; return x ? x.NAMA : nama; };
  const ids = String(r.ID_PESERTA || '').split(',').map((s) => s.trim()).filter(Boolean);
  const peserta = ids.map((id) => o(id, id));
  return (
    <div className="grid-info">
      <Info label="Pimpinan"><Orang nama={o(r.ID_PIMPINAN, r.PIMPINAN_RAPAT)} /></Info>
      <Info label="Notulis"><Orang nama={o(r.ID_NOTULIS, r.NOTULIS)} /></Info>
      <Info label={peserta.length ? 'Peserta (' + peserta.length + ')' : 'Peserta'}>
        {peserta.length ? <div className="daftar-orang">{peserta.map((p, i) => <Orang key={i} nama={p} />)}</div> : <span className={r.PESERTA ? '' : 'samar'}>{r.PESERTA || '—'}</span>}
      </Info>
    </div>
  );
}

export default function DetailRapat({ id }) {
  const app = useApp();
  const { data, tutupPanel, buka, bukaForm } = app;
  const r = data.peta.rapat[id];
  if (!r) return <Panel onTutup={tutupPanel} kepala={<h2>Tidak ditemukan</h2>}><Kosong>Rapat ini tidak ada atau sudah dihapus.</Kosong></Panel>;
  const st = statusRapat(r, data.hari);
  const agenda = data.agendaPer[r.ID_RAPAT] || [];
  const notulen = data.peta.notulen[r.ID_NOTULEN];
  const tlRapat = notulen ? data.tindakLanjut.filter((t) => t.ID_NOTULEN_ASAL === notulen.ID_NOTULEN || t.ID_NOTULEN === notulen.ID_NOTULEN) : [];
  const dokRapat = tautan(data, 'Rapat', r.ID_RAPAT);
  const dokNotulen = notulen ? tautan(data, 'Notulen', notulen.ID_NOTULEN, notulen.LINK_DOKUMEN, 'Notulen') : [];

  return (
    <Panel onTutup={tutupPanel}
      kepala={<><small className="panel-label">{r.JENIS_RAPAT || 'Rapat'} · <Lencana kecil nada={st.nada}>{st.label}</Lencana></small><h2>{r.JUDUL_RAPAT}</h2>
        <p className="panel-sub"><Ikon n="rapat" s={14} />{tglPanjang(r.TANGGAL)}{rentangJam(r) ? ' · ' + rentangJam(r) + ' WIB' : ''}</p></>}
      aksi={<>
        {r.STATUS !== 'Dibatalkan' ? <button type="button" className={'tombol ' + (notulen ? '' : 'utama')} onClick={() => bukaForm('hasilRapat', { idRapat: r.ID_RAPAT })}>{notulen ? 'Edit hasil' : 'Isi hasil rapat'}</button> : null}
        {!notulen ? <button type="button" className="tombol" onClick={() => salinBahan(app, r)}><Ikon n="salin" s={14} />Salin bahan notulen</button> : null}
        {dokNotulen[0] ? <a className="tombol" href={dokNotulen[0].url} target="_blank" rel="noopener noreferrer"><Ikon n="dok" s={14} />Buka notulen</a> : null}
        <MenuTitik items={aksiRapat(app, r).filter((a) => ['Lihat rincian', 'Isi hasil rapat', 'Edit hasil rapat'].indexOf(a.label) === -1 && !(a.label === 'Salin bahan notulen' && !notulen))} />
      </>}>
      <Peserta data={data} r={r} />
      {r.CATATAN ? <div className="narasi"><div><h4>Catatan</h4><p>{r.CATATAN}</p></div></div> : null}

      <Bagian judul="Agenda & hasil" jumlah={agenda.length}>
        {agenda.length ? (
          <ol className="daftar-agenda">
            {agenda.map((a, i) => {
              const tlUtama = data.peta.tl[a.ID_TINDAKLANJUT];
              return (
                <li key={a.ID_ITEM_RAPAT}>
                  <span className="no-agenda">{i + 1}</span>
                  <div>
                    <div className="agenda-kepala">
                      <button type="button" className="tautan-teks" onClick={() => (a.JENIS_ITEM === 'Tindak Lanjut' ? buka('tindak-lanjut', a.ID_REFERENSI) : buka('pokok', a.ID_ISU || a.ID_REFERENSI))}>
                        <strong>{judulAgenda(data, a)}</strong>
                      </button>
                      {a.JENIS_ITEM === 'Tindak Lanjut' ? <Lencana kecil nada="abu">tindak lanjut lama</Lencana> : null}
                      {notulen || a.STATUS_PEMBAHASAN !== 'Belum Dibahas' ? <Lencana kecil nada={nadaPembahasan(a.STATUS_PEMBAHASAN)}>{a.STATUS_PEMBAHASAN || 'Dibahas'}</Lencana> : null}
                    </div>
                    {a.HASIL_KEPUTUSAN ? <p className="agenda-teks"><b>Keputusan:</b> {a.HASIL_KEPUTUSAN}</p> : null}
                    {a.RINGKASAN_PEMBAHASAN ? <p className="agenda-teks samar">{a.RINGKASAN_PEMBAHASAN}</p> : null}
                    {tlUtama && notulen ? <button type="button" className="agenda-tl" onClick={() => buka('tindak-lanjut', tlUtama.ID_TINDAKLANJUT)}><Ikon n="tl" s={13} />{tlUtama.JUDUL}</button> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : <Kosong ikon="daftar">Belum ada agenda.</Kosong>}
      </Bagian>

      {notulen ? (
        <Bagian judul="Notulen">
          <div className="kotak-notulen">
            <div><strong>{notulen.JUDUL}</strong><small>{tgl(notulen.TANGGAL)}</small></div>
            {notulen.CATATAN ? <p>{notulen.CATATAN}</p> : null}
            <DaftarTautan list={dokNotulen} kosong="Tautan notulen belum ditempel." />
          </div>
        </Bagian>
      ) : (
        <div className="saran">
          <Ikon n="baca" s={18} />
          <div><strong>Langkah notulen</strong>
            <ol><li>Klik <b>Salin bahan notulen</b>, tempel bersama transkrip saat menjalankan <code>/susun-notulen</code>.</li><li>Klik <b>Isi hasil rapat</b>, tempel tautan Google Doc, lalu <b>Baca dokumen</b>.</li></ol>
          </div>
        </div>
      )}
      {tlRapat.length ? <Bagian judul="Tindak lanjut dari rapat ini" jumlah={tlRapat.length}><DaftarTlRingkas list={tlRapat} /></Bagian> : null}
      {dokRapat.length ? <Bagian judul="Dokumen rapat" jumlah={dokRapat.length}><DaftarTautan list={dokRapat} /></Bagian> : null}
      <p className="kaki-panel samar">Kode: {r.ID_RAPAT}{notulen ? ' · ' + notulen.ID_NOTULEN : ''}</p>
    </Panel>
  );
}

export function DetailNotulen({ id }) {
  const app = useApp();
  const { data, tutupPanel, bukaForm, hapus } = app;
  const n = data.peta.notulen[id];
  if (!n) return <Panel onTutup={tutupPanel} kepala={<h2>Tidak ditemukan</h2>}><Kosong>Notulen ini tidak ada atau sudah dihapus.</Kosong></Panel>;
  const tl = data.tindakLanjut.filter((t) => t.ID_NOTULEN === id || t.ID_NOTULEN_ASAL === id);
  const dok = tautan(data, 'Notulen', id, n.LINK_DOKUMEN, 'Notulen');
  return (
    <Panel onTutup={tutupPanel}
      kepala={<><small className="panel-label">Notulen tanpa jadwal rapat</small><h2>{n.JUDUL}</h2><p className="panel-sub">{tglPanjang(n.TANGGAL)}</p></>}
      aksi={<>
        {dok[0] ? <a className="tombol utama" href={dok[0].url} target="_blank" rel="noopener noreferrer"><Ikon n="dok" s={14} />Buka notulen</a> : null}
        <button type="button" className="tombol" onClick={() => bukaForm('tl', { awal: { idNotulen: id } })}>Tindak lanjut</button>
        <button type="button" className="tombol" onClick={() => bukaForm('notulen', { item: n })}>Edit</button>
        <MenuTitik items={[{ label: 'Hapus', bahaya: true, onClick: () => hapus('deleteNotulen', id, { judul: 'Hapus notulen?', pesan: '“' + n.JUDUL + '” akan dihapus. Penghapusan ditolak bila masih terkait tindak lanjut.' }) }]} />
      </>}>
      {n.UNIT_PESERTA ? <div className="grid-info"><Info label="Peserta / unit">{n.UNIT_PESERTA}</Info></div> : null}
      {n.CATATAN ? <div className="narasi"><div><h4>Ringkasan</h4><p>{n.CATATAN}</p></div></div> : null}
      <Bagian judul="Dokumen" jumlah={dok.length}><DaftarTautan list={dok} /></Bagian>
      <Bagian judul="Tindak lanjut" jumlah={tl.length}>{tl.length ? <DaftarTlRingkas list={tl} /> : <Kosong ikon="tl">Belum ada tindak lanjut.</Kosong>}</Bagian>
      <p className="kaki-panel samar">Kode: {n.ID_NOTULEN}</p>
    </Panel>
  );
}
