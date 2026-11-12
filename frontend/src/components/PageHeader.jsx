import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

// crumbs: [{ label, to? }]  (label boleh berupa node, misalnya kerangka loading)
// Di mobile breadcrumb diganti satu tautan "Kembali" ke tingkat di atasnya.
export default function PageHeader({ crumbs = [], title, subtitle, action }) {
  const parent = [...crumbs].reverse().find((c) => c.to);
  return (
    <div className="page-header">
      {parent && (
        <Link to={parent.to} className="back-link">
          <ArrowLeft size={16} /> {typeof parent.label === 'string' ? parent.label : 'Kembali'}
        </Link>
      )}
      {crumbs.length > 0 && (
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i} className="crumb">
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              {i < crumbs.length - 1 && <ChevronRight size={14} />}
            </span>
          ))}
        </nav>
      )}
      <div className="page-header-row">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        {action && <div className="page-action">{action}</div>}
      </div>
    </div>
  );
}
