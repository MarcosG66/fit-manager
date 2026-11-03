import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Feedback } from '../components/Feedback.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const DASHBOARD_POR_PERFIL = {
  aluno: '/aluno',
  instrutor: '/instrutor',
  admin: '/admin',
};

/** O servidor identifica o perfil da conta; o login pede somente as credenciais. */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);
  const { login } = useAuth();
  const navegar = useNavigate();

  async function entrar(evento) {
    evento.preventDefault();
    setErro('');
    setEntrando(true);

    try {
      const usuario = await login({ email, senha });
      navegar(DASHBOARD_POR_PERFIL[usuario.perfil] || '/login', { replace: true });
    } catch (erroRequisicao) {
      setErro(erroRequisicao.message);
    } finally {
      setEntrando(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Bem-vindo de volta</h2>
      <p className="text-secondary mb-4">Entre com sua conta para continuar.</p>

      <form onSubmit={entrar}>
        <Feedback error={erro} />

        <label className="form-label" htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="form-control mb-3"
          value={email}
          onChange={evento => setEmail(evento.target.value)}
        />

        <div className="d-flex justify-content-between">
          <label className="form-label" htmlFor="senha">Senha</label>
          <Link to="/esqueci-senha" className="small">Esqueci minha senha</Link>
        </div>
        <div className="input-group mb-4">
          <input
            id="senha"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={senha}
            onChange={evento => setSenha(evento.target.value)}
            className="form-control"
            placeholder="Sua senha"
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setMostrarSenha(valor => !valor)}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <i className={`bi ${mostrarSenha ? 'bi-eye-slash' : 'bi-eye'}`} />
          </button>
        </div>

        <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={entrando}>
          {entrando ? 'Entrando...' : 'Entrar'}
          <i className="bi bi-arrow-right ms-2" />
        </button>
      </form>

      <p className="text-center mt-4 mb-0 small">
        Não tem uma conta? <Link to="/cadastro" className="fw-semibold">Criar conta</Link>
      </p>
    </AuthLayout>
  );
}
