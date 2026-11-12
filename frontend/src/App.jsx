import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Categories from './pages/Categories.jsx';
import Groups from './pages/Groups.jsx';
import Archives from './pages/Archives.jsx';
import Search from './pages/Search.jsx';
import Users from './pages/Users.jsx';
import Profile from './pages/Profile.jsx';

// Layout dipasang sekali sebagai layout route agar sidebar tetap hidup antar halaman (indikator bisa bergeser mulus)
function RequireAuth() {
  const { user } = useAuth();
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

function RequireAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tahun/:yearId" element={<Categories />} />
        <Route path="/kategori/:categoryId" element={<Groups />} />
        <Route path="/kelompok/:groupId" element={<Archives />} />
        <Route path="/cari" element={<Search />} />
        <Route path="/profil" element={<Profile />} />
        <Route element={<RequireAdmin />}>
          <Route path="/pengguna" element={<Users />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
