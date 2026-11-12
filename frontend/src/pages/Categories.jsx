import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart3, Plus } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { addRecent } from '../recents.js';
import { invalidateIndex } from '../searchIndex.js';
import PageHeader from '../components/PageHeader.jsx';
import ItemCard from '../components/ItemCard.jsx';
import NameModal from '../components/NameModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { Empty, Loading, SkeletonText } from '../components/States.jsx';

export default function Categories() {
  const { yearId } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [year, setYear] = useState(null);
  const [cats, setCats] = useState(null);
  const [modal, setModal] = useState(null);

  const load = () =>
    api
      .get(`/years/${yearId}/categories`)
      .then((r) => setCats(r.data))
      .catch((e) => {
        toast(errorMessage(e), 'error');
        setCats([]);
      });

  useEffect(() => {
    setYear(null);
    setCats(null);
    api
      .get(`/years/${yearId}`)
      .then((r) => {
        setYear(r.data);
        addRecent({ to: `/tahun/${yearId}`, title: `Tahun ${r.data.year}`, sub: 'Kategori' });
      })
      .catch(() => navigate('/'));
    load();
  }, [yearId]);

  const save = async (name) => {
    try {
      if (modal.type === 'add') {
        await api.post(`/years/${yearId}/categories`, { name });
        toast('Kategori berhasil ditambahkan.');
      } else {
        await api.put(`/categories/${modal.item._id}`, { name });
        toast('Kategori berhasil diperbarui.');
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
      await api.delete(`/categories/${modal.item._id}`);
      toast('Kategori berhasil dihapus.');
      invalidateIndex();
      load();
      return true;
    } catch (e) {
      return errorMessage(e);
    }
  };

  const add = <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={18} /> Tambah Kategori</button>;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: year ? `Tahun ${year.year}` : <SkeletonText width={70} /> }]}
        title="Kategori Statistik"
        subtitle={year ? `Pilih kategori untuk arsip tahun ${year.year}.` : <SkeletonText width={220} />}
        action={add}
      />

      {cats === null ? (
        <Loading variant="grid" />
      ) : cats.length === 0 ? (
        <Empty text="Belum ada kategori. Tambahkan kategori pertama untuk tahun ini.">{add}</Empty>
      ) : (
        <div className="grid">
          {cats.map((c, i) => (
            <ItemCard
              key={c._id}
              index={i}
              tone={i}
              icon={<BarChart3 size={26} />}
              title={c.name}
              meta={`${c.groupCount} kelompok · ${c.archiveCount} arsip`}
              to={`/kategori/${c._id}`}
              canManage={isAdmin}
              onEdit={() => setModal({ type: 'edit', item: c })}
              onDelete={() => setModal({ type: 'delete', item: c })}
            />
          ))}
        </div>
      )}

      {modal && modal.type !== 'delete' && (
        <NameModal
          title={modal.type === 'add' ? 'Tambah Kategori' : 'Edit Kategori'}
          label="Nama kategori"
          placeholder="Contoh: Statistik Harga"
          initial={modal.item?.name ?? ''}
          onSubmit={save}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'delete' && (
        <ConfirmModal
          message={`Hapus kategori "${modal.item.name}"? Semua kelompok dan arsip di dalamnya ikut terhapus.`}
          onConfirm={remove}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
