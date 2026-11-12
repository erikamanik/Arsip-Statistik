import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useConfirm } from './Confirm.jsx';
import { useToast } from './Toast.jsx';

export default function useLogout() {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  return async () => {
    const ok = await confirm({ title: 'Keluar dari akun?', message: 'Anda perlu masuk lagi untuk mengakses arsip.', confirmText: 'Ya, keluar', tone: 'danger' });
    if (!ok) return;
    logout();
    navigate('/login');
    toast('Anda sudah keluar. Sampai jumpa lagi!', 'info');
  };
}
