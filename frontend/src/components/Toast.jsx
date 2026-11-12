import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(() => {});
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const MAX = 4;

function ToastItem({ t, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(t.duration);
  const startedAt = useRef(0);
  const Icon = ICONS[t.type] || Info;

  // Timer berhenti saat di-hover/difokus, lanjut dengan sisa waktu
  useEffect(() => {
    if (paused || t.leaving) return undefined;
    startedAt.current = Date.now();
    const id = setTimeout(() => onDismiss(t.id, 'timeout'), remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, t.leaving, t.id, onDismiss]);

  return (
    <div
      className={`toast toast-${t.type} ${t.leaving ? 'leaving' : ''} ${paused ? 'paused' : ''}`}
      role={t.type === 'error' ? 'alert' : undefined}
      style={{ '--dur': `${t.duration}ms` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon size={20} />
      <span className="toast-msg">{t.message}</span>
      {t.action && (
        <button className="toast-action" onClick={() => { t.action.onClick(); onDismiss(t.id, 'action'); }}>
          {t.action.label}
        </button>
      )}
      <button className="toast-x" onClick={() => onDismiss(t.id, 'dismiss')} aria-label="Tutup notifikasi"><X size={16} /></button>
      <span className="toast-bar" aria-hidden="true" />
    </div>
  );
}

// toast(pesan, 'success' | 'error' | 'info', { action: { label, onClick }, duration, onClose(reason) })
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const closers = useRef(new Map());

  const dismiss = useCallback((id, reason = 'dismiss') => {
    const cb = closers.current.get(id);
    if (cb) {
      closers.current.delete(id);
      cb(reason);
    }
    setItems((p) => p.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 220);
  }, []);

  const toast = useCallback((message, type = 'success', opts = {}) => {
    const id = Date.now() + Math.random();
    const duration = opts.duration || (type === 'error' ? 5500 : opts.action ? 6000 : 3800);
    if (opts.onClose) closers.current.set(id, opts.onClose);
    setItems((p) => {
      const live = p.filter((t) => !t.leaving);
      live.slice(0, Math.max(0, live.length - (MAX - 1))).forEach((t) => setTimeout(() => dismiss(t.id, 'overflow'), 0));
      return [...p, { id, message, type, duration, action: opts.action }];
    });
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {items.map((t) => <ToastItem key={t.id} t={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
