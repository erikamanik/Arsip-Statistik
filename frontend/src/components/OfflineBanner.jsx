import { useEffect, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useToast } from './Toast.jsx';

export default function OfflineBanner() {
  const toast = useToast();
  const [online, setOnline] = useState(() => navigator.onLine);
  const first = useRef(true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (online) toast('Koneksi tersambung kembali.', 'success');
  }, [online, toast]);

  return (
    <div className={`offline-banner ${online ? '' : 'show'}`} role="status" aria-hidden={online}>
      <WifiOff size={16} /> Anda sedang offline. Data terbaru belum bisa dimuat.
    </div>
  );
}
