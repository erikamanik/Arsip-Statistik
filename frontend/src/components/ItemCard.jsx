import { Link } from 'react-router-dom';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';

// Kartu folder. Area utama berupa tautan sungguhan (bisa dibuka di tab baru); tombol edit/hapus adalah saudara, bukan anak tautan.
export default function ItemCard({ icon, title, meta, to, tone = 0, index = 0, canManage, onEdit, onDelete }) {
  return (
    <div className={`item-card tone-${tone % 3}`} style={{ '--i': index }}>
      <Link to={to} className="item-open">
        <span className="item-icon">{icon}</span>
        <h3 className="item-title">{title}</h3>
        <p className="item-meta">{meta}</p>
        <span className="item-go">Buka <ChevronRight size={16} /></span>
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
