import { Link } from 'react-router-dom';
import { ChevronRight, Clock, Download, ExternalLink, Eye, FolderOpen, Pencil, Trash2, User } from 'lucide-react';
import { fileUrl, formatDateTime, formatSize } from '../api.js';
import { archiveVisual, canRead } from '../fileTypes.js';
import Highlight from './Highlight.jsx';
import { useDownload } from './useDownload.js';

const shortName = (u) => u?.name || (u?.email ? u.email.split('@')[0] : '-');

// showPath: tampilkan lokasi (tahun > kategori > kelompok), dipakai di hasil pencarian
// onRead: buka penampil dalam aplikasi (gambar, PDF, teks, CSV, dokumen Office)
export default function ArchiveRow({ a, index = 0, isAdmin, onEdit, onDelete, onRead, showPath, q = '' }) {
  const { download, busy } = useDownload();
  const { Icon, cls, label } = archiveVisual(a);
  const g = a.group;
  const isLink = a.type === 'link';
  const readable = canRead(a) && onRead;

  const read = () => onRead(a);

  return (
    <article className="arow" style={{ '--i': index, '--act-w': isAdmin ? '300px' : '205px', '--act-w-sm': isAdmin ? '250px' : '130px' }}>
      {readable ? (
        <button className={`archive-thumb ${cls}`} onClick={read} aria-label={`Baca ${a.title}`}>
          {a.type === 'image' ? <img src={fileUrl(a)} alt="" loading="lazy" /> : <Icon size={22} />}
        </button>
      ) : (
        <a className={`archive-thumb ${cls}`} href={isLink ? a.url : fileUrl(a)} target="_blank" rel="noreferrer" aria-label={`Buka ${a.title}`} tabIndex={-1}>
          <Icon size={22} />
        </a>
      )}

      <div className="arow-main">
        <h4><Highlight text={a.title} q={q} /></h4>
        <p className="archive-sub">
          <span className={`tag ${cls}`}>{label}</span>
          {isLink ? <span className="ellipsis">{a.url}</span> : <span className="ellipsis"><Highlight text={a.originalName || ''} q={q} />{a.size ? ` · ${formatSize(a.size)}` : ''}</span>}
        </p>
        {showPath && g && (
          <p className="archive-path">
            <FolderOpen size={13} />
            <Link to={`/kelompok/${g._id}`}>
              {g.category?.year?.year} <ChevronRight size={12} /> {g.category?.name} <ChevronRight size={12} /> {g.name}
            </Link>
          </p>
        )}
      </div>

      <div className="arow-meta">
        <p className="arow-by" title={a.uploadedBy?.email}><User size={14} /><span className="ellipsis">{shortName(a.uploadedBy)}</span></p>
        <p className="arow-date"><Clock size={14} /><span>{formatDateTime(a.createdAt)}</span></p>
      </div>

      <div className="arow-actions">
        {isLink ? (
          <a className="btn btn-soft sm" href={a.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Buka tautan</a>
        ) : (
          <>
            {readable && <button className="btn btn-soft sm" onClick={read}><Eye size={15} /> {a.type === 'image' ? 'Lihat' : 'Baca'}</button>}
            <button className={`btn sm ${readable ? 'btn-ghost' : 'btn-soft'}`} onClick={() => download(a)} disabled={busy} title="Unduh" aria-label={`Unduh ${a.title}`}>
              <Download size={15} /> <span className={readable ? 'btn-label-wide' : ''}>Unduh</span>
            </button>
          </>
        )}
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
