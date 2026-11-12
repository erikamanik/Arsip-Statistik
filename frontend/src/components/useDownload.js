import { useCallback, useState } from 'react';
import { downloadArchive } from '../api.js';
import { useToast } from './Toast.jsx';

// Unduh arsip dengan nama aslinya; beri tahu pengguna saat mulai dan jika harus memakai cara cadangan.
export function useDownload({ quiet = false } = {}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const download = useCallback(async (a) => {
    setBusy(true);
    const ok = await downloadArchive(a);
    setBusy(false);
    if (ok) { if (!quiet) toast(`"${a.title}" diunduh.`, 'success', { duration: 2500 }); }
    else toast('Unduhan dibuka di tab baru.', 'info');
  }, [toast, quiet]);
  return { download, busy };
}
