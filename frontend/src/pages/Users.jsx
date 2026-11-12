import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import api, { errorMessage, formatDateTime } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { Loading } from '../components/States.jsx';

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState(null);

  const load = () =>
    api
      .get('/auth/users')
      .then((r) => setUsers(r.data))
      .catch((e) => {
        toast(errorMessage(e), 'error');
        setUsers([]);
      });

  useEffect(() => {
    load();
  }, []);

  const toggle = async (u) => {
    const role = u.role === 'admin' ? 'user' : 'admin';
    const ok = await confirm({ title: 'Ubah peran?', message: `${u.name} akan dijadikan ${role === 'admin' ? 'Admin' : 'User'}.`, confirmText: 'Ya, ubah' });
    if (!ok) return;
    try {
      await api.patch(`/auth/users/${u.id}/role`, { role });
      toast(`${u.name} sekarang ${role === 'admin' ? 'Admin' : 'User'}.`);
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <>
      <PageHeader title="Kelola Pengguna" subtitle="Atur siapa saja yang menjadi admin." />
      {users === null ? (
        <Loading variant="list" />
      ) : (
        <div className="archive-list">
          {users.map((u, i) => (
            <article className="archive" key={u.id} style={{ '--i': i }}>
              <div className="avatar lg">{u.name.charAt(0).toUpperCase()}</div>
              <div className="archive-main">
                <h4>{u.name} {u.id === me.id && <span className="muted">(Anda)</span>}</h4>
                <p className="archive-sub"><span className="ellipsis">{u.email}</span></p>
                <p className="archive-by"><span>Bergabung {formatDateTime(u.createdAt)}</span></p>
              </div>
              <div className="archive-actions">
                <span className={`badge ${u.role === 'admin' ? 'badge-admin' : ''}`}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                {u.id !== me.id && (
                  <button className="btn btn-soft sm" onClick={() => toggle(u)}>
                    {u.role === 'admin' ? <><ShieldOff size={15} /> Jadikan User</> : <><ShieldCheck size={15} /> Jadikan Admin</>}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
