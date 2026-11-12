import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, History, Plus, Upload } from 'lucide-react';
import api, { errorMessage, timeAgo } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { useRecents } from '../recents.js';
import { invalidateIndex, useIndex } from '../searchIndex.js';
import { archiveVisual } from '../fileTypes.js';
import PageHeader from '../components/PageHeader.jsx';
import ItemCard from '../components/ItemCard.jsx';
import NameModal from '../components/NameModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { Empty, Loading } from '../components/States.jsx';

const WEEK = 7 * 24 * 3600 * 1000;

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const recents = useRecents();
  const { items: archives } = useIndex();
  const [years, setYears] = useState(null);
  const [modal, setModal] = useState(null); // {type:'add'|'edit'|'delete', item?}

  const load = () =>
    api
      .get('/years')
      .then((r) => setYears(r.data))
      .catch((e) => {
        toast(errorMessage(e), 'error');
        setYears([]);
      });

  useEffect(() => {
    load();
  }, []);

  const save = async (value) => {
    try {
      if (modal.type === 'add') {
        await api.post('/years', { year: value });
        toast('Tahun berhasil ditambahkan.');
      } else {
        await api.put(`/years/${modal.item._id}`, { year: value });
        toast('Tahun berhasil diperbarui.');
      }
      invalidateIndex();
      load();
      return true;
    } catch (e) {
      return errorMessage(e);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/years/${modal.item._id}`);
      toast('Tahun berhasil dihapus.');
      invalidateIndex();
      load();
      return true;
    } catch (e) {
      return errorMessage(e);
    }
  };

  const total = useMemo(() => (years || []).reduce((s, y) => s + (y.archiveCount || 0), 0), [years]);
  const thisWeek = archives ? archives.filter((a) => Date.now() - new Date(a.createdAt) < WEEK).length : null;
  const latest = (archives || []).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Arsip Kegiatan Statistik"
        subtitle="Pilih tahun kegiatan untuk melihat dan mengelola arsip."
        action={
          <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>
            <Plus size={18} /> Tambah Tahun
          </button>
        }
      />

      {years !== null && years.length > 0 && (
        <div className="summary" aria-label="Ringkasan">
          <div><b>{years.length}</b><span>Tahun kegiatan</span></div>
          <div><b>{total}</b><span>Arsip tersimpan</span></div>
          <div><b>{thisWeek === null ? '–' : thisWeek}</b><span>Ditambah 7 hari ini</span></div>
        </div>
      )}

      {years === null ? (
        <Loading variant="grid" />
      ) : years.length === 0 ? (
        <Empty text="Belum ada tahun. Mulai dengan menambahkan tahun kegiatan.">
          <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={18} /> Tambah Tahun</button>
        </Empty>
      ) : (
        <div className="grid">
          {years.map((y, i) => (
            <ItemCard
              key={y._id}
              index={i}
              tone={i}
              icon={<CalendarDays size={26} />}
              title={`Tahun ${y.year}`}
              meta={`${y.archiveCount} arsip tersimpan`}
              to={`/tahun/${y._id}`}
              canManage={isAdmin}
              onEdit={() => setModal({ type: 'edit', item: y })}
              onDelete={() => setModal({ type: 'delete', item: y })}
            />
          ))}
        </div>
      )}

      {years !== null && years.length > 0 && (
        <div className="dash-cols">
          <section className="panel">
            <h3>Unggahan terbaru</h3>
            {archives === null ? (
              <div className="sk-col"><span className="sk sk-line" style={{ width: '80%', height: 16 }} /><span className="sk sk-line" style={{ width: '60%' }} /><span className="sk sk-line" style={{ width: '70%' }} /></div>
            ) : latest.length === 0 ? (
              <p className="muted small">Belum ada arsip yang diunggah.</p>
            ) : (
              <ul className="mini-list">
                {latest.map((a) => {
                  const { Icon, cls } = archiveVisual(a);
                  return (
                    <li key={a._id}>
                      <Link to={`/kelompok/${a.group._id}`} className="mini-row">
                        <span className={`archive-thumb sm ${cls}`}><Icon size={18} /></span>
                        <span className="mini-text"><b className="ellipsis">{a.title}</b><small className="ellipsis">{a.group.name} · {timeAgo(a.createdAt)}</small></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel">
            <h3>Terakhir dibuka</h3>
            {recents.length === 0 ? (
              <p className="muted small"><History size={15} /> Kelompok dan kategori yang Anda buka akan muncul di sini.</p>
            ) : (
              <ul className="mini-list">
                {recents.map((r) => (
                  <li key={r.to}>
                    <Link to={r.to} className="mini-row">
                      <span className="archive-thumb sm"><History size={18} /></span>
                      <span className="mini-text"><b className="ellipsis">{r.title}</b>{r.sub && <small className="ellipsis">{r.sub}</small>}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {modal && modal.type !== 'delete' && (
        <NameModal
          title={modal.type === 'add' ? 'Tambah Tahun' : 'Edit Tahun'}
          label="Tahun"
          type="number"
          placeholder="Contoh: 2026"
          initial={modal.item?.year ?? new Date().getFullYear()}
          onSubmit={save}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'delete' && (
        <ConfirmModal
          message={`Hapus tahun ${modal.item.year}? Semua kategori, kelompok, dan arsip di dalamnya ikut terhapus.`}
          onConfirm={remove}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
