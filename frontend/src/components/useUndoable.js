import { errorMessage } from '../api.js';
import { useToast } from './Toast.jsx';

// Hapus tanpa dialog: item langsung disembunyikan, toast menawarkan "Urungkan".
// Penghapusan ke server baru dijalankan setelah toast habis/ditutup. Gagal -> item dikembalikan.
export default function useUndoable() {
  const toast = useToast();
  return ({ message, hide, restore, commit, duration = 6000 }) => {
    let undone = false;
    hide();
    toast(message, 'info', {
      duration,
      action: { label: 'Urungkan', onClick: () => { undone = true; restore(); } },
      onClose: async () => {
        if (undone) return;
        try {
          await commit();
        } catch (e) {
          restore();
          toast(errorMessage(e), 'error');
        }
      },
    });
  };
}
