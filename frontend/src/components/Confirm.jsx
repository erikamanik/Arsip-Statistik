import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from './Modal.jsx';

const ConfirmContext = createContext(async () => true);

// confirm({ title, message, confirmText, tone: 'danger' | 'primary' }) -> Promise<boolean>
// Pakai hanya untuk aksi yang berdampak besar; aksi biasa cukup toast.
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const resolver = useRef(null);

  const confirm = useCallback((opts) => new Promise((resolve) => { resolver.current = resolve; setLeaving(false); setState(opts); }), []);
  const close = useCallback((ok) => {
    resolver.current?.(ok);
    resolver.current = null;
    setLeaving(true);
    setTimeout(() => { setState(null); setLeaving(false); }, 170);
  }, []);

  const danger = state?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <Modal title={state.title || 'Lanjutkan?'} onClose={() => close(false)} closing={leaving}>
          {(closeModal) => (
            <>
              <div className="confirm">
                <span className={`confirm-icon ${danger ? '' : 'info'}`}>{danger ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}</span>
                <p>{state.message}</p>
              </div>
              <div className="form-actions">
                {/* Pada aksi berbahaya, fokus awal ke "Batal" supaya Enter tidak langsung mengeksekusi */}
                <button autoFocus={danger} className="btn btn-ghost" onClick={closeModal}>Batal</button>
                <button autoFocus={!danger} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
                  {state.confirmText || 'Ya, lanjutkan'}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
