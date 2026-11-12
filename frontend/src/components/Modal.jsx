import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

// Tumpukan modal: hanya modal paling atas yang merespons Escape/Tab; scroll body dikunci selama ada modal.
const stack = [];
const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
const EXIT_MS = 160;

// children boleh berupa fungsi: (close) => node, dengan close() menutup modal lewat animasi keluar.
// locked: blokir penutupan oleh pengguna (Esc, klik luar, tombol X) selama proses berjalan.
export default function Modal({ title, onClose, children, closing: closingProp = false, locked = false }) {
  const titleId = useId();
  const box = useRef(null);
  const closeRef = useRef(onClose);
  const lockedRef = useRef(locked);
  const closingRef = useRef(false);
  const timer = useRef();
  const downOnOverlay = useRef(false);
  const [closing, setClosing] = useState(false);
  closeRef.current = onClose;
  lockedRef.current = locked;

  const requestClose = useCallback((force = false) => {
    if (closingRef.current || (lockedRef.current && !force)) return;
    closingRef.current = true;
    setClosing(true);
    timer.current = setTimeout(() => closeRef.current(), EXIT_MS);
  }, []);

  useEffect(() => {
    const id = {};
    stack.push(id);
    const previous = document.activeElement;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === 'Escape') { requestClose(); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const els = [...box.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0];
      const last = els[els.length - 1];
      const inside = box.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    if (box.current && !box.current.contains(document.activeElement)) box.current.focus();

    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(id), 1);
      if (stack.length === 0) document.body.style.overflow = '';
      if (previous && document.contains(previous) && typeof previous.focus === 'function') previous.focus();
    };
  }, [requestClose]);

  return (
    <div
      className={`overlay ${closing || closingProp ? 'closing' : ''}`}
      onMouseDown={(e) => { downOnOverlay.current = e.target === e.currentTarget; }}
      onClick={(e) => {
        // Tutup hanya jika tekan dan lepas keduanya di overlay (seret pilihan teks dari input tidak menutup form)
        if (downOnOverlay.current && e.target === e.currentTarget) requestClose();
        downOnOverlay.current = false;
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={box} tabIndex={-1}>
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          <button className="icon-btn" onClick={() => requestClose()} aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="modal-body">{typeof children === 'function' ? children(() => requestClose(true)) : children}</div>
      </div>
    </div>
  );
}
