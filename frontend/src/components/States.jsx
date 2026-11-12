import { Inbox } from 'lucide-react';

// variant: 'center' (spinner) | 'grid' (kerangka kartu) | 'list' (kerangka baris)
export const Loading = ({ variant = 'center' }) => {
  if (variant === 'grid') {
    return (
      <div className="grid" role="status" aria-label="Memuat data">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="sk-card" key={i}>
            <span className="sk sk-icon" />
            <span className="sk sk-line" style={{ width: '70%', height: 20, marginTop: 8 }} />
            <span className="sk sk-line" style={{ width: '45%' }} />
          </div>
        ))}
        <span className="sr-only">Memuat data…</span>
      </div>
    );
  }
  if (variant === 'list') {
    return (
      <div className="archive-list" role="status" aria-label="Memuat data">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="sk-row" key={i}>
            <span className="sk sk-thumb" />
            <div className="sk-col">
              <span className="sk sk-line" style={{ width: '55%', height: 16 }} />
              <span className="sk sk-line" style={{ width: '35%' }} />
              <span className="sk sk-line" style={{ width: '45%' }} />
            </div>
          </div>
        ))}
        <span className="sr-only">Memuat data…</span>
      </div>
    );
  }
  return (
    <div className="state" role="status"><div className="spinner" /><p>Memuat data…</p></div>
  );
};

export const SkeletonText = ({ width = 90 }) => <span className="sk sk-inline" style={{ width }} aria-hidden="true" />;

export const Empty = ({ text, children }) => (
  <div className="state empty">
    <span className="empty-icon"><Inbox size={30} /></span>
    <p>{text}</p>
    {children}
  </div>
);
