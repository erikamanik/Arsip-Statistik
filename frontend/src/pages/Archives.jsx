import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, SearchX, Upload } from 'lucide-react';
import api, { errorMessage, formatSize } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import useUndoable from '../components/useUndoable.js';
import { addRecent } from '../recents.js';
import { invalidateIndex } from '../searchIndex.js';
import { TYPES } from '../fileTypes.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import ArchiveRow from '../components/ArchiveRow.jsx';
import { Empty, Loading, SkeletonText } from '../components/States.jsx';

const MAX_SIZE = 25 * 1024 * 1024;

function FieldError({ id, children }) {
  return children ? <small id={id} className="field-error" role="alert">{children}</small> : null;
}

function ArchiveForm({ groupId, item, onDone, onClose }) {
  const toast = useToast();
  const editing = Boolean(item);
  const [type, setType] = useState(item?.type || 'file');
  const [title, setTitle] = useState(item?.title || '');
  const [url, setUrl] = useState(item?.url || '');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);

  const preview = useMemo(() => (file && type === 'image' ? URL.createObjectURL(file) : null), [file, type]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const clear = (key) => setErrors((e) => (e[key] || e.form ? { ...e, [key]: undefined, form: undefined } : e));

  const submit = async (e, close) => {
    e.preventDefault();
    const next = {};
    if (!title.trim()) next.title = 'Judul wajib diisi.';
    if (type === 'link') {
      if (!url.trim()) next.url = 'Tautan wajib diisi.';
      else if (!/^https?:\/\//i.test(url.trim())) next.url = 'Tautan harus diawali http:// atau https://';
    }
    if (!editing && type !== 'link' && !file) next.file = 'Pilih file terlebih dahulu.';
    if (file && file.size > MAX_SIZE) next.file = `Ukuran file ${formatSize(file.size)} melebihi batas 25 MB.`;
    setErrors(next);
    if (Object.keys(next).length) return;

    const fd = new FormData();
    fd.append('title', title.trim());
    if (!editing) fd.append('type', type);
    if (type === 'link') fd.append('url', url.trim());
    else if (file) fd.append('file', file);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const cfg = {
      signal: ctrl.signal,
      onUploadProgress: (ev) => { if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total)); },
    };

    setBusy(true);
    setProgress(0);
    try {
      if (editing) await api.put(`/archives/${item._id}`, fd, cfg);
      else await api.post(`/groups/${groupId}/archives`, fd, cfg);
      toast(editing ? 'Arsip berhasil diperbarui.' : 'Arsip berhasil diunggah.');
      invalidateIndex();
      onDone();
      close();
    } catch (err) {
      setBusy(false);
      if (err.code === 'ERR_CANCELED') toast('Upload dibatalkan.', 'info');
      else setErrors({ form: errorMessage(err) });
    }
  };

  const uploading = busy && Boolean(file);

  return (
    <Modal title={editing ? 'Edit Arsip' : 'Upload Arsip'} onClose={onClose} locked={busy}>
      {(close) => (
        <form onSubmit={(e) => submit(e, close)} className="form" noValidate>
          {!editing && (
            <div className="seg">
              {TYPES.map(({ key, label, icon: Icon }) => (
                <button type="button" key={key} disabled={busy} aria-pressed={type === key} className={type === key ? 'on' : ''} onClick={() => { setType(key); setFile(null); setErrors({}); }}>
                  <Icon size={17} /> {label}
                </button>
              ))}
            </div>
          )}

          <label className="field">
            <span>Judul</span>
            <input autoFocus value={title} disabled={busy} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'err-title' : undefined} onChange={(e) => { setTitle(e.target.value); clear('title'); }} placeholder="Contoh: Laporan Survei Triwulan I" />
            <FieldError id="err-title">{errors.title}</FieldError>
          </label>

          {type === 'link' ? (
            <label className="field">
              <span>Tautan (URL)</span>
              <input type="url" value={url} disabled={busy} aria-invalid={Boolean(errors.url)} aria-describedby={errors.url ? 'err-url' : undefined} onChange={(e) => { setUrl(e.target.value); clear('url'); }} placeholder="https://..." />
              <FieldError id="err-url">{errors.url}</FieldError>
            </label>
          ) : (
            <label className="field">
              <span>{type === 'image' ? 'Pilih gambar' : 'Pilih file'}{editing && ' (kosongkan jika tidak diganti)'}</span>
              <div className={`file-drop ${errors.file ? 'invalid' : ''}`}>
                <Upload size={22} />
                <b>{file ? file.name : 'Klik untuk memilih'}</b>
                <small>{file ? formatSize(file.size) : 'Maksimal 25 MB'}</small>
                <input type="file" disabled={busy} accept={type === 'image' ? 'image/*' : undefined} aria-describedby={errors.file ? 'err-file' : undefined} onChange={(e) => { setFile(e.target.files[0] || null); clear('file'); }} />
              </div>
              <FieldError id="err-file">{errors.file}</FieldError>
              {preview && <img className="preview" src={preview} alt="Pratinjau" />}
            </label>
          )}

          {uploading && (
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progres upload">
              <div className="progress-track"><span className="progress-bar" style={{ width: `${progress}%` }} /></div>
              <small>{progress < 100 ? `Mengunggah… ${progress}%` : 'Memproses di server…'}</small>
            </div>
          )}

          {errors.form && <div className="alert" role="alert">{errors.form}</div>}

          <div className="form-actions">
            {busy ? (
              <button type="button" className="btn btn-ghost" onClick={() => abortRef.current?.abort()}>Batalkan{uploading ? ' upload' : ''}</button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={close}>Batal</button>
            )}
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : editing ? 'Simpan' : 'Upload'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

const SORTS = {
  new: { label: 'Terbaru', fn: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  old: { label: 'Terlama', fn: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
  az: { label: 'Judul A–Z', fn: (a, b) => a.title.localeCompare(b.title, 'id') },
  size: { label: 'Ukuran terbesar', fn: (a, b) => (b.size || 0) - (a.size || 0) },
};

export default function Archives() {
  const { groupId } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const undoable = useUndoable();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [items, setItems] = useState(null);
  const [hidden, setHidden] = useState(() => new Set()); // arsip yang menunggu penghapusan (bisa diurungkan)
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('new');
  const [modal, setModal] = useState(null);

  const load = () =>
    api
      .get(`/groups/${groupId}/archives`)
      .then((r) => setItems(r.data))
      .catch((e) => {
        toast(errorMessage(e), 'error');
        setItems([]);
      });

  useEffect(() => {
    setGroup(null);
    setItems(null);
    setQ('');
    setType('all');
    api
      .get(`/groups/${groupId}`)
      .then((r) => {
        setGroup(r.data);
        const c = r.data.category;
        addRecent({ to: `/kelompok/${groupId}`, title: r.data.name, sub: c ? `${c.year.year} · ${c.name}` : '' });
      })
      .catch(() => navigate('/'));
    load();
  }, [groupId]);

  const unhide = (id) => setHidden((s) => { const n = new Set(s); n.delete(id); return n; });

  const removeArchive = (a) =>
    undoable({
      message: `"${a.title}" dihapus.`,
      hide: () => setHidden((s) => new Set(s).add(a._id)),
      restore: () => unhide(a._id),
      commit: async () => {
        await api.delete(`/archives/${a._id}`);
        invalidateIndex();
        setItems((p) => p && p.filter((x) => x._id !== a._id));
        unhide(a._id);
      },
    });

  const visible = useMemo(() => (items || []).filter((a) => !hidden.has(a._id)), [items, hidden]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return visible
      .filter((a) => type === 'all' || a.type === type)
      .filter((a) => !term || [a.title, a.originalName, a.uploadedBy?.email].join(' ').toLowerCase().includes(term))
      .sort(SORTS[sort].fn);
  }, [visible, q, type, sort]);

  const cat = group?.category;
  const upload = <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={18} /> Upload Arsip</button>;
  const filtering = q.trim() !== '' || type !== 'all';

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: cat ? `Tahun ${cat.year.year}` : <SkeletonText width={70} />, to: cat ? `/tahun/${cat.year._id}` : undefined },
          { label: cat?.name || <SkeletonText width={100} />, to: cat ? `/kategori/${cat._id}` : undefined },
          { label: group?.name || <SkeletonText width={110} /> },
        ]}
        title={group?.name || 'Daftar Arsip'}
        subtitle="Semua arsip dalam kelompok ini beserta pengunggah dan waktu unggahnya."
        action={upload}
      />

      {items && visible.length > 0 && (
        <div className="toolbar">
          <div className="searchbar">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul, nama file, atau pengunggah…" aria-label="Cari arsip" />
          </div>
          <label className="select-wrap">
            <span className="sr-only">Urutkan</span>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </label>
          <div className="chips" role="group" aria-label="Filter jenis">
            {[{ key: 'all', label: 'Semua' }, ...TYPES].map((t) => (
              <button key={t.key} className={`chip ${type === t.key ? 'on' : ''}`} aria-pressed={type === t.key} onClick={() => setType(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>
      )}

      {items === null ? (
        <Loading variant="list" />
      ) : visible.length === 0 ? (
        <Empty text="Belum ada arsip. Unggah file, gambar, atau tautan pertama.">
          <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Upload size={18} /> Upload Arsip</button>
        </Empty>
      ) : filtered.length === 0 ? (
        <div className="state empty">
          <span className="empty-icon"><SearchX size={30} /></span>
          <p>Tidak ada arsip yang cocok dengan pencarian atau filter ini.</p>
          <button className="btn btn-soft" onClick={() => { setQ(''); setType('all'); }}>Reset pencarian</button>
        </div>
      ) : (
        <>
          {filtering && <p className="result-count" aria-live="polite">Menampilkan {filtered.length} dari {visible.length} arsip</p>}
          <div className="archive-list">
            {filtered.map((a, i) => (
              <ArchiveRow
                key={a._id}
                a={a}
                index={i}
                q={q}
                isAdmin={isAdmin}
                onEdit={() => setModal({ type: 'edit', item: a })}
                onDelete={() => removeArchive(a)}
              />
            ))}
          </div>
        </>
      )}

      {modal && (
        <ArchiveForm
          groupId={groupId}
          item={modal.item}
          onClose={() => setModal(null)}
          onDone={load}
        />
      )}
    </>
  );
}
