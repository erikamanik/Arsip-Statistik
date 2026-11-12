import { LogOut, Mail, Monitor, Moon, ShieldCheck, Smartphone, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import useLogout from '../components/useLogout.js';
import InstallButton from '../components/InstallButton.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { Avatar } from '../components/Layout.jsx';
import { useInstall } from '../pwa.js';
import { useTheme } from '../theme.js';

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const logout = useLogout();
  const { installed } = useInstall();
  const { pref, setPref } = useTheme();

  return (
    <>
      <PageHeader crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Profil' }]} title="Profil Saya" subtitle="Informasi akun dan pengaturan aplikasi." />

      <section className="profile-hero">
        <Avatar user={user} size="xl" />
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className={`badge ${isAdmin ? 'badge-admin' : ''}`}>{isAdmin && <ShieldCheck size={12} />} {isAdmin ? 'Admin' : 'User'}</span>
        </div>
      </section>

      <div className="profile-grid">
        <div className="profile-col">
        <section className="panel">
          <h3>Informasi akun</h3>
          <dl className="info">
            <div><dt><UserRound size={16} /> Nama</dt><dd>{user.name}</dd></div>
            <div><dt><Mail size={16} /> Email</dt><dd>{user.email}</dd></div>
            <div><dt><ShieldCheck size={16} /> Peran</dt><dd>{isAdmin ? 'Admin' : 'User'}</dd></div>
          </dl>
          <p className="muted small">{isAdmin ? 'Admin dapat mengedit, menghapus data, dan mengatur peran pengguna.' : 'User dapat melihat dan menambah arsip. Edit dan hapus hanya untuk admin.'}</p>
        </section>
        </div>

        <div className="profile-col">
        <section className="panel">
          <h3>Tampilan</h3>
          <p className="muted small">Pilih tema warna aplikasi. &ldquo;Sistem&rdquo; mengikuti pengaturan perangkat Anda.</p>
          <div className="seg" role="group" aria-label="Tema">
            {[['system', 'Sistem', Monitor], ['light', 'Terang', Sun], ['dark', 'Gelap', Moon]].map(([k, label, Icon]) => (
              <button type="button" key={k} className={pref === k ? 'on' : ''} aria-pressed={pref === k} onClick={() => setPref(k)}><Icon size={17} /> {label}</button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Aplikasi</h3>
          <p className="muted small"><Smartphone size={15} /> {installed ? 'Aplikasi sudah terpasang di perangkat ini.' : 'Pasang di layar utama agar bisa dibuka seperti aplikasi biasa.'}</p>
          <div className="panel-actions">
            <InstallButton variant="btn" />
            <button className="btn btn-danger-soft" onClick={logout}><LogOut size={18} /> Keluar</button>
          </div>
        </section>
        </div>
      </div>
    </>
  );
}
