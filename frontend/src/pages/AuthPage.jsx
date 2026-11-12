import { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Clock, Eye, EyeOff, FolderTree, KeyRound, Lock, Mail, Search, User as UserIcon } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { BrandMark } from '../components/Layout.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Field({ icon, label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-icon">
        {icon}
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
        {isPassword && (
          <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={show}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </label>
  );
}

export default function AuthPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('login'); // login | register
  const [role, setRole] = useState('user'); // user | admin
  const [form, setForm] = useState({ name: '', email: '', password: '', adminCode: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const switchMode = (m) => {
    setMode(m);
    setRole('user');
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } =
        mode === 'login'
          ? await api.post('/auth/login', { email: form.email, password: form.password })
          : await api.post('/auth/register', { ...form, role });
      login(data);
      toast(mode === 'login' ? `Berhasil masuk. Selamat datang, ${data.user.name}!` : 'Akun berhasil dibuat.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async (res) => {
    setError('');
    try {
      const { data } = await api.post('/auth/google', { credential: res.credential });
      login(data);
      toast(`Berhasil masuk. Selamat datang, ${data.user.name}!`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="hero-inner">
          <BrandMark size={56} />
          <h1>Arsip Kegiatan Statistik</h1>
          <p>Simpan, kelompokkan, dan temukan kembali arsip kegiatan statistik per tahun dalam bentuk file, gambar, maupun tautan.</p>
        </div>
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <BrandMark size={40} />
            <strong>Arsip Statistik</strong>
          </div>

          <h2>{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}</h2>
          <p className="muted">{mode === 'login' ? 'Masuk untuk mengakses arsip.' : 'Daftar untuk mulai menyimpan arsip.'}</p>

          <div className="tabs">
            <button className={mode === 'login' ? 'on' : ''} onClick={() => switchMode('login')} type="button">Masuk</button>
            <button className={mode === 'register' ? 'on' : ''} onClick={() => switchMode('register')} type="button">Daftar</button>
          </div>


          <form onSubmit={submit} className="form">
            {mode === 'register' && (
              <Field icon={<UserIcon size={18} />} label="Nama" value={form.name} onChange={set('name')} placeholder="Nama lengkap" autoComplete="name" />
            )}
            <Field icon={<Mail size={18} />} label="Email" type="email" value={form.email} onChange={set('email')} placeholder="nama@email.com" autoComplete="email" />
            <Field
              icon={<Lock size={18} />}
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Minimal 6 karakter"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {mode === 'register' && (
              <button type="button" className="link-btn" onClick={() => setRole((r) => (r === 'admin' ? 'user' : 'admin'))}>
                {role === 'admin' ? 'Batal, daftar sebagai User' : 'Punya kode admin?'}
              </button>
            )}
            {mode === 'register' && role === 'admin' && (
              <Field icon={<KeyRound size={18} />} label="Kode Admin" type="password" value={form.adminCode} onChange={set('adminCode')} placeholder="Kode rahasia admin" />
            )}

            {error && <div className="alert" role="alert">{error}</div>}

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : `Daftar sebagai ${role === 'admin' ? 'Admin' : 'User'}`}
            </button>
          </form>

          <div className="divider"><span>atau</span></div>

          <div className="google-wrap">
            {GOOGLE_CLIENT_ID ? (
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={onGoogle}
                  onError={() => setError('Login Google dibatalkan atau gagal.')}
                  text={mode === 'login' ? 'signin_with' : 'signup_with'}
                  shape="pill"
                  width="320"
                />
              </GoogleOAuthProvider>
            ) : (
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setError('Isi VITE_GOOGLE_CLIENT_ID di frontend/.env untuk mengaktifkan login Google.')}>
                Masuk dengan Google
              </button>
            )}
          </div>
          {mode === 'register' && <p className="hint">Login Google selalu terdaftar sebagai User.</p>}
        </div>
      </section>
    </div>
  );
}
