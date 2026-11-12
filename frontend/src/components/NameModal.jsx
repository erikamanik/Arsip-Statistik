import { useId, useState } from 'react';
import Modal from './Modal.jsx';

// Form satu kolom (tahun, kategori, kelompok). onSubmit mengembalikan true bila berhasil, atau string pesan galat.
export default function NameModal({ title, label, placeholder, type = 'text', initial = '', submitText = 'Simpan', onSubmit, onClose }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const errId = useId();

  const submit = async (e, close) => {
    e.preventDefault();
    const v = String(value).trim();
    if (!v) return setError(`${label} wajib diisi.`);
    if (type === 'number' && (Number(v) < 1990 || Number(v) > 2100)) return setError('Tahun harus antara 1990 dan 2100.');
    setBusy(true);
    setError('');
    const res = await onSubmit(v);
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
        <form onSubmit={(e) => submit(e, close)} className="form" noValidate>
          <label className="field">
            <span>{label}</span>
            <input
              autoFocus
              type={type}
              value={value}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errId : undefined}
              onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
            />
            {error && <small id={errId} className="field-error" role="alert">{error}</small>}
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={close}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : submitText}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
