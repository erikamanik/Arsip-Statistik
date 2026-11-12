import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';

// onConfirm harus mengembalikan true bila berhasil, atau string pesan galat bila gagal
export default function ConfirmModal({ title = 'Hapus data?', message, confirmText = 'Ya, hapus', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (close) => {
    setBusy(true);
    setError('');
    const res = await onConfirm();
    if (res === true) {
      close();
    } else {
      setBusy(false);
      setError(typeof res === 'string' ? res : 'Terjadi kesalahan. Coba lagi.');
    }
  };

  return (
    <Modal title={title} onClose={onClose} locked={busy}>
      {(close) => (
        <>
          <div className="confirm">
            <span className="confirm-icon"><AlertTriangle size={26} /></span>
            <p>{message}</p>
          </div>
          {error && <div className="alert" role="alert" style={{ marginTop: 14 }}>{error}</div>}
          <div className="form-actions">
            <button autoFocus className="btn btn-ghost" disabled={busy} onClick={close}>Batal</button>
            <button className="btn btn-danger" disabled={busy} onClick={() => run(close)}>{busy ? 'Menghapus…' : confirmText}</button>
          </div>
        </>
      )}
    </Modal>
  );
}
