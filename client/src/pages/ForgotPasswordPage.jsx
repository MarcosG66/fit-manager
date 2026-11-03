import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Feedback } from '../components/Feedback.jsx';
import { api } from '../services/api.js';
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false), [message, setMessage] = useState('');
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault(); setLoading(true); setError(''); try {
      const result = await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setMessage(result.message);
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
      <i className="bi bi-envelope-at" />
    </div>
    <h2 className="auth-title">Esqueceu sua senha?</h2>
    <p className="text-secondary mb-4">Informe seu e-mail para receber um código de 8 dígitos válido por 10 minutos.</p>
    <Feedback error={error} success={message} />
    <form onSubmit={submit}>
      <label className="form-label">E-mail</label>
      <input autoFocus required className="form-control mb-3" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
      <button className="btn btn-primary w-100 btn-lg" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar código'}
      </button>
    </form>
    <button className="btn btn-outline-primary w-100 mt-3" onClick={() => nav('/redefinir-senha', { state: { email } })}>Já tenho o código</button><div className="text-center small mt-4">
      <Link to="/login">Voltar ao login</Link>
    </div>
  </AuthLayout>;
}
