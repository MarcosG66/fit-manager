import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Feedback } from '../components/Feedback.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
const roles = [{ label: 'Aluno', icon: 'bi-person', role: 'aluno' }, { label: 'Instrutor', icon: 'bi-person-badge', role: 'instrutor' }, { label: 'Administrador', icon: 'bi-shield-check', role: 'admin' }];
export default function LoginPage() {
  const [email, setEmail] = useState(''), [senha, setSenha] = useState(''), [role, setRole] = useState('aluno'), [show, setShow] = useState(false), [error, setError] = useState(''), [working, setWorking] = useState(false);
  const { login } = useAuth(), nav = useNavigate();
  async function submit(e) {
    e.preventDefault(); setError(''); setWorking(true); try {
      const user = await login({ email, senha });
      nav(user.perfil === 'aluno' ? '/aluno' : user.perfil === 'instrutor' ? '/instrutor' : '/admin', { replace: true });
    }
    catch (e) {
      setError(e.message);
    }
    finally {
      setWorking(false);
    }
  }
  return <AuthLayout>
    <h2 className="auth-title">Bem-vindo de volta</h2>
    <p className="text-secondary mb-4">Entre com sua conta para continuar</p>
    <div className="form-label small fw-semibold">Perfil de acesso</div><div className="role-select mb-4">
      {roles.map(x => <button type="button" key={x.role} onClick={() => setRole(x.role)} className={`role-chip ${x.role === role ? 'selected' : ''}`}>
        <i className={`bi ${x.icon} d-block fs-5`} />
        {x.label}
      </button>)}
    </div>
    <form onSubmit={submit}>
      <Feedback error={error} />
      <label className="form-label" htmlFor="email">E-mail</label>
      <input id="email" type="email" required autoComplete="email" placeholder="seu@email.com" className="form-control mb-3" value={email} onChange={e => setEmail(e.target.value)} />
      <div className="d-flex justify-content-between">
        <label className="form-label" htmlFor="senha">Senha</label>
        <Link to="/esqueci-senha" className="small">Esqueci minha senha</Link>
      </div><div className="input-group mb-4">
        <input id="senha" type={show ? 'text' : 'password'} autoComplete="current-password" required value={senha} onChange={e => setSenha(e.target.value)} className="form-control" placeholder="Sua senha" />
        <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(!show)} aria-label="Mostrar ou ocultar senha">
          <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
        </button>
      </div>
      <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={working}>
        {working ? 'Entrando...' : 'Entrar'}
        <i className="bi bi-arrow-right ms-2" />
      </button>
    </form>
    <p className="text-center mt-4 mb-0 small">Não tem uma conta? <Link to="/cadastro" className="fw-semibold">Criar conta</Link></p><p className="tiny-note text-center mt-3">O perfil é identificado pela sua conta no servidor. A seleção acima apenas organiza a interface.</p>
  </AuthLayout>;
}
