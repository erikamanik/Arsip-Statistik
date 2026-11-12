import { Link } from 'react-router-dom';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';

// Kartu folder. Area utama berupa tautan sungguhan (bisa dibuka di tab baru); tombol edit/hapus adalah saudara, bukan anak tautan.
// count/unit: angka besar; meta: keterangan kecil; badge: label di samping judul (mis. tahun berjalan)
export default function ItemCard({ icon, title, meta, count, unit = 'arsip', badge, to, tone = 0, index = 0, canManage, onEdit, onDelete }) {
  return (
    <div className={`item-card tone-${tone % 3}`} style={{ '--i': index }}>
      <Link to={to} className="item-open" aria-label={`Buka ${title}`}>
        <span className="item-icon">{icon}</span>
        <h3 className="item-title">{title}{badge && <span className="item-badge">{badge}</span>}</h3>
        <div className="item-foot">
          <div>
            {count !== undefined && <p className="item-stat"><b>{count}</b> {unit}</p>}
            {meta && <p className="item-meta">{meta}</p>}
          </div>
          <span className="item-arrow" aria-hidden="true"><ChevronRight size={18} /></span>
        </div>
      </Link>
      {canManage && (
        <div className="item-actions">
          <button className="icon-btn sm" title="Edit" aria-label={`Edit ${title}`} onClick={onEdit}><Pencil size={15} /></button>
          <button className="icon-btn sm danger" title="Hapus" aria-label={`Hapus ${title}`} onClick={onDelete}><Trash2 size={15} /></button>
        </div>
      )}
    </div>
  );
}
