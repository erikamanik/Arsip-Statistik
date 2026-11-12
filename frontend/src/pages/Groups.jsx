import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderOpen, Plus } from 'lucide-react';
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

export default function Groups() {
  const { categoryId } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [groups, setGroups] = useState(null);
  const [modal, setModal] = useState(null);

  const load = () =>
    api
      .get(`/categories/${categoryId}/groups`)
      .then((r) => setGroups(r.data))
      .catch((e) => {
        toast(errorMessage(e), 'error');
        setGroups([]);
      });

  useEffect(() => {
    setCategory(null);
    setGroups(null);
    api
      .get(`/categories/${categoryId}`)
      .then((r) => {
        setCategory(r.data);
        addRecent({ to: `/kategori/${categoryId}`, title: r.data.name, sub: `Tahun ${r.data.year.year}` });
      })
      .catch(() => navigate('/'));
    load();
  }, [categoryId]);

  const save = async (name) => {
    try {
      if (modal.type === 'add') {
        await api.post(`/categories/${categoryId}/groups`, { name });
        toast('Kelompok arsip berhasil ditambahkan.');
      } else {
        await api.put(`/groups/${modal.item._id}`, { name });
        toast('Kelompok arsip berhasil diperbarui.');
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
      await api.delete(`/groups/${modal.item._id}`);
      toast('Kelompok arsip berhasil dihapus.');
      invalidateIndex();
      load();
      return true;
    } catch (e) {
      return errorMessage(e);
    }
  };

  const add = <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={18} /> Tambah Kelompok</button>;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: category ? `Tahun ${category.year.year}` : <SkeletonText width={70} />, to: category ? `/tahun/${category.year._id}` : undefined },
          { label: category?.name || <SkeletonText width={110} /> },
        ]}
        title={category?.name || 'Kelompok Arsip'}
        subtitle="Kelompokkan arsip berdasarkan nama kegiatan atau jenis arsip."
        action={add}
      />

      {groups === null ? (
        <Loading variant="grid" />
      ) : groups.length === 0 ? (
        <Empty text="Belum ada kelompok arsip. Tambahkan kelompok pertama Anda.">{add}</Empty>
      ) : (
        <div className="grid">
          {groups.map((g, i) => (
            <ItemCard
              key={g._id}
              index={i}
              tone={i}
              icon={<FolderOpen size={26} />}
              title={g.name}
              meta={`${g.archiveCount} arsip`}
              to={`/kelompok/${g._id}`}
              canManage={isAdmin}
              onEdit={() => setModal({ type: 'edit', item: g })}
              onDelete={() => setModal({ type: 'delete', item: g })}
            />
          ))}
        </div>
      )}

      {modal && modal.type !== 'delete' && (
        <NameModal
          title={modal.type === 'add' ? 'Tambah Kelompok Arsip' : 'Edit Kelompok Arsip'}
          label="Nama arsip"
          placeholder="Contoh: Survei Harga Konsumen"
          initial={modal.item?.name ?? ''}
          onSubmit={save}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'delete' && (
        <ConfirmModal
          message={`Hapus kelompok "${modal.item.name}"? Semua arsip di dalamnya ikut terhapus.`}
          onConfirm={remove}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
