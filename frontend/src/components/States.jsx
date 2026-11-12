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

// Ilustrasi batang grafik (motif merek) untuk keadaan kosong
export const BarsArt = () => (
  <svg className="bars-art" width="96" height="72" viewBox="0 0 96 72" aria-hidden="true">
    <rect x="6" y="38" width="20" height="30" rx="5" fill="var(--blue)" opacity=".9" />
    <rect x="38" y="10" width="20" height="58" rx="5" fill="var(--orange)" />
    <rect x="70" y="26" width="20" height="42" rx="5" fill="var(--blue)" opacity=".45" />
    <rect x="0" y="68" width="96" height="3" rx="1.5" fill="var(--line-strong)" />
  </svg>
);

export const Empty = ({ text, title, icon, children }) => (
  <div className="state empty">
    {icon ? <span className="empty-icon">{icon}</span> : <BarsArt />}
    {title && <h3 className="empty-title">{title}</h3>}
    <p>{text}</p>
    {children}
  </div>
);
