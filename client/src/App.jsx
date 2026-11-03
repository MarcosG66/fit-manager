import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { Loading } from './components/Feedback.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import InstructorDashboard from './pages/InstructorDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// Cada perfil só pode abrir seu respectivo painel.
const PAGINA_INICIAL_POR_PERFIL = {
  aluno: '/aluno',
  instrutor: '/instrutor',
  admin: '/admin',
};

/** Bloqueia páginas internas para visitantes não autenticados. */
function PrivateRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.perfil !== role) {
    return <Navigate to={PAGINA_INICIAL_POR_PERFIL[user.perfil]} replace />;
  }

  return children;
}

/** Evita mostrar login/cadastro para quem já está autenticado. */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (user) return <Navigate to={PAGINA_INICIAL_POR_PERFIL[user.perfil]} replace />;

  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;

  const destino = user ? PAGINA_INICIAL_POR_PERFIL[user.perfil] : '/login';
  return <Navigate to={destino} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Páginas públicas: cadastro, login e recuperação de senha. */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/cadastro" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/esqueci-senha" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/redefinir-senha" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* Páginas privadas: a API verifica as mesmas permissões no servidor. */}
      <Route path="/aluno" element={<PrivateRoute role="aluno"><StudentDashboard /></PrivateRoute>} />
      <Route path="/instrutor" element={<PrivateRoute role="instrutor"><InstructorDashboard /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
