import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, SearchX, X } from 'lucide-react';
import { useIndex } from '../searchIndex.js';
import { TYPES } from '../fileTypes.js';
import PageHeader from '../components/PageHeader.jsx';
import ArchiveRow from '../components/ArchiveRow.jsx';
import { Empty, Loading } from '../components/States.jsx';

export default function Search() {
  const { items, loading, error } = useIndex();
  const [params, setParams] = useSearchParams();
  const input = useRef(null);
  const q = params.get('q') || '';
  const type = params.get('jenis') || 'all';

  useEffect(() => { input.current?.focus(); }, []);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== 'all' ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!items) return [];
    return items
      .filter((a) => type === 'all' || a.type === type)
      .filter((a) => !term || [a.title, a.originalName, a.uploadedBy?.email, a.group?.name, a.group?.category?.name].join(' ').toLowerCase().includes(term));
  }, [items, term, type]);

  const shown = term || type !== 'all' ? results : results.slice(0, 10);

  return (
    <>
      <PageHeader title="Pencarian Arsip" subtitle="Cari judul, nama file, pengunggah, atau nama kelompok dari seluruh tahun." />

      <div className="toolbar">
        <div className="searchbar big">
          <SearchIcon size={18} />
          <input
            ref={input}
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Escape') update({ q: '' }); }}
            placeholder="Ketik untuk mencari arsip…"
            aria-label="Cari arsip"
          />
          {q && <button className="icon-btn sm" onClick={() => { update({ q: '' }); input.current?.focus(); }} aria-label="Hapus kata kunci"><X size={16} /></button>}
        </div>
        <div className="chips" role="group" aria-label="Filter jenis">
          {[{ key: 'all', label: 'Semua' }, ...TYPES].map((t) => (
            <button key={t.key} className={`chip ${type === t.key ? 'on' : ''}`} aria-pressed={type === t.key} onClick={() => update({ jenis: t.key })}>{t.label}</button>
          ))}
        </div>
      </div>

      {loading && !items ? (
        <>
          <p className="result-count">Menyiapkan pencarian…</p>
          <Loading variant="list" />
        </>
      ) : error && !items ? (
        <Empty text="Pencarian belum bisa dimuat. Periksa koneksi Anda lalu muat ulang halaman." />
      ) : results.length === 0 ? (
        <div className="state empty">
          <span className="empty-icon"><SearchX size={30} /></span>
          <p>{term ? `Tidak ada arsip yang cocok dengan "${q}".` : 'Belum ada arsip.'}</p>
        </div>
      ) : (
        <>
          <p className="result-count" aria-live="polite">
            {term || type !== 'all' ? `${results.length} arsip ditemukan` : 'Arsip terbaru'}
          </p>
          <div className="archive-list">
            {shown.map((a, i) => <ArchiveRow key={a._id} a={a} index={i} q={q} showPath />)}
          </div>
        </>
      )}
    </>
  );
}
