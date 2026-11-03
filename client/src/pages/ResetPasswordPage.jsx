import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Feedback } from '../components/Feedback.jsx';
import { api } from '../services/api.js';
export default function ResetPasswordPage() {
  const location = useLocation(), nav = useNavigate();
  const [email, setEmail] = useState(location.state?.email || ''), [codigo, setCodigo] = useState(''), [novaSenha, setNovaSenha] = useState(''), [confirmar, setConfirmar] = useState(''), [error, setError] = useState(''), [success, setSuccess] = useState(''), [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); if (novaSenha !== confirmar)
      return setError('As senhas não coincidem.'); setLoading(true); setError(''); try {
        const response = await api('/auth/reset-password', { method: 'POST', body: { email, codigo, novaSenha } });
        setSuccess(response.message);
      }
    catch (e) {
      setError(e.message);
    }
    finally {
      setLoading(false);
    }
  }
  return <AuthLayout>
    <div className="auth-illustration">
      <i className="bi bi-shield-lock" />
    </div>
    <h2 className="auth-title">Redefinir senha</h2>
    <p className="text-secondary">Digite o código de 8 dígitos enviado ao seu e-mail e escolha uma nova senha.</p>
    <Feedback error={error} success={success} />
    {!success ? <form onSubmit={submit}>
      <label className="form-label">E-mail</label>
      <input required type="email" className="form-control mb-3" value={email} onChange={e => setEmail(e.target.value)} />
      <label className="form-label">Código (8 dígitos)</label>
      <input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} required className="form-control reset-code mb-3" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000000" />
      <label className="form-label">Nova senha</label>
      <input required type="password" minLength={8} className="form-control mb-3" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
      <label className="form-label">Confirmar nova senha</label>
      <input required type="password" minLength={8} className="form-control mb-4" value={confirmar} onChange={e => setConfirmar(e.target.value)} />
      <button className="btn btn-primary btn-lg w-100" disabled={loading}>
        {loading ? 'Salvando...' : 'Redefinir senha'}
      </button>
    </form> : <button className="btn btn-primary btn-lg w-100" onClick={() => nav('/login')}>Ir para o login</button>}
    <p className="text-center mt-4 small">
      <Link to="/esqueci-senha">Solicitar outro código</Link>
    </p>
  </AuthLayout>;
}
