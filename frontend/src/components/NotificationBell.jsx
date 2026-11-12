import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { timeAgo } from '../api.js';
import { useIndex } from '../searchIndex.js';

const KEY = 'notif-seen';
const readSeen = () => {
  try {
    const v = Number(localStorage.getItem(KEY));
    if (v) return v;
    localStorage.setItem(KEY, String(Date.now())); // pertama kali: hanya unggahan setelah ini yang dianggap baru
  } catch { /* abaikan */ }
  return Date.now();
};

// Notifikasi dalam aplikasi: unggahan terbaru dari pengguna lain, dihitung dari indeks arsip.
export default function NotificationBell() {
  const { user } = useAuth();
  const { items } = useIndex({ delay: 1500 });
  const [seen, setSeen] = useState(readSeen);
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  const others = (items || []).filter((a) => a.uploadedBy?.email !== user.email).slice(0, 12);
  const unread = others.filter((a) => new Date(a.createdAt).getTime() > seen).length;

  const markRead = () => {
    const now = Date.now();
    try { localStorage.setItem(KEY, String(now)); } catch { /* abaikan */ }
    setSeen(now);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="bell" ref={wrap}>
      <button
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={20} />
        {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="region" aria-label="Notifikasi">
          <div className="notif-head">
            <h3>Notifikasi</h3>
            {unread > 0 && <button className="link-btn" onClick={markRead}>Tandai sudah dibaca</button>}
          </div>
          {others.length === 0 ? (
            <div className="notif-empty"><BellOff size={22} /><p>Belum ada unggahan baru dari anggota lain.</p></div>
          ) : (
            <ul className="notif-list">
              {others.map((a) => {
                const isNew = new Date(a.createdAt).getTime() > seen;
                return (
                  <li key={a._id}>
                    <Link to={`/kelompok/${a.group._id}`} className={`notif-item ${isNew ? 'unread' : ''}`} onClick={() => { setOpen(false); markRead(); }}>
                      <span className="notif-text">
                        <b>{a.uploadedBy?.name || a.uploadedBy?.email || 'Seseorang'}</b> mengunggah <b>{a.title}</b>
                        <small>{a.group.name} · {timeAgo(a.createdAt)}</small>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
