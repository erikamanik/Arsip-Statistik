import { Link } from 'react-router-dom';
import { ChevronRight, Clock, ExternalLink, FolderOpen, Mail, Pencil, Trash2 } from 'lucide-react';
import { fileUrl, formatDateTime, formatSize } from '../api.js';
import { archiveVisual } from '../fileTypes.js';
import Highlight from './Highlight.jsx';

// showPath: tampilkan lokasi (tahun > kategori > kelompok), dipakai di hasil pencarian
export default function ArchiveRow({ a, index = 0, isAdmin, onEdit, onDelete, showPath, q = '' }) {
  const href = a.type === 'link' ? a.url : fileUrl(a);
  const { Icon, cls, label } = archiveVisual(a);
  const g = a.group;

  return (
    <article className="archive" style={{ '--i': index }}>
      <a className={`archive-thumb ${cls}`} href={href} target="_blank" rel="noreferrer" aria-label={`Buka ${a.title}`}>
        {a.type === 'image' ? <img src={fileUrl(a)} alt="" loading="lazy" /> : <Icon size={28} />}
      </a>

      <div className="archive-main">
        <h4><Highlight text={a.title} q={q} /></h4>
        <p className="archive-sub">
          <span className={`tag ${cls}`}>{label}</span>
          {a.type === 'link' ? <span className="ellipsis">{a.url}</span> : <span className="ellipsis"><Highlight text={a.originalName || ''} q={q} /> · {formatSize(a.size)}</span>}
        </p>
        {showPath && g && (
          <p className="archive-path">
            <FolderOpen size={13} />
            <Link to={`/kelompok/${g._id}`}>
              {g.category?.year?.year} <ChevronRight size={12} /> {g.category?.name} <ChevronRight size={12} /> {g.name}
            </Link>
          </p>
        )}
        <p className="archive-by">
          <span><Mail size={13} /> {a.uploadedBy?.email || '-'}</span>
          <span><Clock size={13} /> {formatDateTime(a.createdAt)}</span>
        </p>
      </div>

      <div className="archive-actions">
        <a className="btn btn-soft sm" href={href} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Buka</a>
        {isAdmin && (
          <>
            <button className="icon-btn sm" onClick={onEdit} title="Edit" aria-label={`Edit ${a.title}`}><Pencil size={15} /></button>
            <button className="icon-btn sm danger" onClick={onDelete} title="Hapus" aria-label={`Hapus ${a.title}`}><Trash2 size={15} /></button>
          </>
        )}
      </div>
    </article>
  );
}
