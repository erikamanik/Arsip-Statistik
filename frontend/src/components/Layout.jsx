import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { History, LayoutDashboard, LogOut, Search, UserRound, Users } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { useRecents } from '../recents.js';
import useLogout from './useLogout.js';
import InstallButton from './InstallButton.jsx';
import NotificationBell from './NotificationBell.jsx';
import OfflineBanner from './OfflineBanner.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export function BrandMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0B2A4A" />
      <rect x="7" y="16" width="5" height="9" rx="1.5" fill="#1B64B8" />
      <rect x="13.5" y="8" width="5" height="17" rx="1.5" fill="#F08A24" />
      <rect x="20" y="13" width="5" height="12" rx="1.5" fill="#2FA36B" />
    </svg>
  );
}

function Brand() {
  return (
    <Link to="/" className="brand">
      <BrandMark />
      <span className="brand-text"><strong>Arsip Statistik</strong><small>Distribusi dan Jasa</small></span>
    </Link>
  );
}

export function Avatar({ user, size = '' }) {
  const pic = user.picture || user.avatar || user.photo;
  return (
    <span className={`avatar ${size}`}>
      {pic ? <img src={pic} alt="" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = 'none')} /> : null}
      <span>{user.name.charAt(0).toUpperCase()}</span>
    </span>
  );
}

const NAV = [
  { key: 'home', to: '/', label: 'Dashboard', icon: LayoutDashboard, match: (p) => p === '/' || /^\/(tahun|kategori|kelompok)\//.test(p) },
  { key: 'search', to: '/cari', label: 'Cari', sidebarLabel: 'Pencarian', icon: Search, match: (p) => p.startsWith('/cari'), hint: true },
  { key: 'users', to: '/pengguna', label: 'Pengguna', sidebarLabel: 'Kelola Pengguna', icon: Users, admin: true, match: (p) => p.startsWith('/pengguna') },
  { key: 'profile', to: '/profil', label: 'Profil', sidebarLabel: 'Profil Saya', icon: UserRound, match: (p) => p.startsWith('/profil') },
];

export default function Layout() {
  const { user, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();
  const recents = useRecents();

  const items = NAV.filter((it) => !it.admin || isAdmin);
  const activeIndex = items.findIndex((it) => it.match(pathname));
  const hidden = activeIndex < 0;
  const idx = hidden ? 0 : activeIndex;

  // Halaman baru selalu mulai dari atas
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  // Pintasan Ctrl/Cmd + K -> pencarian
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/cari');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  const link = (it, size, text) => (
    <Link key={it.key} to={it.to} className="nav-item" aria-current={it.match(pathname) ? 'page' : undefined}>
      <it.icon size={size} />
      {text}
      {it.hint && <kbd className="kbd">Ctrl K</kbd>}
    </Link>
  );

  return (
    <div className="app-shell">
      <OfflineBanner />

      <aside className="sidebar">
        <div className="side-head">
          <Brand />
          <NotificationBell />
        </div>

        <nav className="nav" aria-label="Menu utama" style={{ '--i': idx }}>
          <span className="nav-indicator" data-hidden={hidden} aria-hidden="true" />
          {items.map((it) => link(it, 19, it.sidebarLabel || it.label))}
        </nav>

        <div className="side-section">
          {recents.length > 0 && (
            <>
              <p className="side-title">Terakhir dibuka</p>
              <ul className="side-list">
                {recents.slice(0, 4).map((r) => (
                  <li key={r.to}>
                    <Link to={r.to} className="side-link" title={r.sub ? `${r.title} · ${r.sub}` : r.title}>
                      <History size={15} />
                      <span className="side-link-text"><span className="ellipsis">{r.title}</span>{r.sub && <small className="ellipsis">{r.sub}</small>}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="side-foot">
          <ThemeToggle variant="row" />
          <InstallButton variant="card" />
        </div>
        <div className="userbox">
          <Link to="/profil" className="userbox-link" aria-label="Buka profil">
            <Avatar user={user} />
            <span className="userbox-info">
              <strong title={user.name}>{user.name}{isAdmin && <em className="role-chip">Admin</em>}</strong>
              <small title={user.email}>{user.email}</small>
            </span>
          </Link>
          <button className="icon-btn" onClick={logout} title="Keluar" aria-label="Keluar"><LogOut size={18} /></button>
        </div>
      </aside>

      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <ThemeToggle />
          <InstallButton variant="icon" />
          <NotificationBell />
        </div>
      </header>

      <main className="content">
        <div key={pathname} className="page"><Outlet /></div>
      </main>

      <nav className="bottom-nav" aria-label="Navigasi utama">
        <div className="bn-track" style={{ '--i': idx, '--n': items.length }}>
          <span className="bn-indicator" data-hidden={hidden} aria-hidden="true" />
          {items.map((it) => link(it, 22, <span>{it.label}</span>))}
        </div>
      </nav>
    </div>
  );
}
