import { useState } from 'react';
import { Download, MoreVertical, PlusSquare, Share } from 'lucide-react';
import { isIOS, useInstall } from '../pwa.js';
import { useToast } from './Toast.jsx';
import Modal from './Modal.jsx';

// variant: 'card' (sidebar) | 'icon' (topbar mobile) | 'btn' (halaman profil)
export default function InstallButton({ variant = 'btn' }) {
  const { installed, install } = useInstall();
  const toast = useToast();
  const [help, setHelp] = useState(false);
  if (installed) return null;

  const click = async () => {
    const res = await install();
    if (res === 'manual') setHelp(true);
    else if (res === 'accepted') toast('Aplikasi sedang dipasang di perangkat Anda.');
    else toast('Pemasangan dibatalkan.', 'info');
  };

  const ios = isIOS();
  return (
    <>
      {variant === 'icon' && <button className="icon-btn" onClick={click} aria-label="Install aplikasi"><Download size={20} /></button>}
      {variant === 'card' && (
        <button className="install-card" onClick={click}>
          <span className="install-ico"><Download size={18} /></span>
          <span><strong>Install aplikasi</strong><small>Buka lebih cepat dari layar utama</small></span>
        </button>
      )}
      {variant === 'btn' && <button className="btn btn-primary" onClick={click}><Download size={18} /> Install aplikasi</button>}

      {help && (
        <Modal title="Install aplikasi" onClose={() => setHelp(false)}>
          <ol className="steps">
            {ios ? (
              <>
                <li><Share size={18} /> Ketuk tombol <b>Bagikan</b> di Safari.</li>
                <li><PlusSquare size={18} /> Pilih <b>Tambah ke Layar Utama</b>.</li>
              </>
            ) : (
              <>
                <li><MoreVertical size={18} /> Buka menu browser (titik tiga).</li>
                <li><Download size={18} /> Pilih <b>Install aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</li>
              </>
            )}
          </ol>
          <div className="form-actions"><button className="btn btn-primary" onClick={() => setHelp(false)}>Mengerti</button></div>
        </Modal>
      )}
    </>
  );
}
