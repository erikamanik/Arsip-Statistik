import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.startsWith('/auth/login') || err.config?.url?.startsWith('/auth/register') || err.config?.url?.startsWith('/auth/google');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) =>
  err.response?.data?.message || 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.';

// Arsip baru ada di Vercel Blob (alamat penuh); arsip lama masih di folder uploads
export const fileUrl = (archive) => archive.fileUrl || `${API_URL}/uploads/${archive.filePath}`;

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default api;

export const formatDate = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export const timeAgo = (iso) => {
  const diff = (new Date(iso) - Date.now()) / 1000;
  if (Math.abs(diff) > 30 * 86400) return formatDate(iso);
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
  for (const [unit, sec] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return 'baru saja';
};