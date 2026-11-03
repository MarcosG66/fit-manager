import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Feedback, Loading } from './Feedback.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

/** Vincula alunos por código e permite que instrutores compartilhem seu código. */
export default function VinculoInstrutor() {
  const { user } = useAuth();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState({ error: '', success: '' });
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const response = await api('/vinculos/me');
      setConnection(response.data);
    } catch (error) {
      setFeedback({ error: error.message, success: '' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function action(path, method, body, confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    setFeedback({ error: '', success: '' });
    try {
      const response = await api(path, { method, ...(body ? { body } : {}) });
      await reload();
      setFeedback({ error: '', success: response.message || 'Atualizado com sucesso.' });
      setCode('');
    } catch (error) {
      setFeedback({ error: error.message, success: '' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (!connection) return (
    <div className="surface-card">
      <Feedback {...feedback} />
      <button type="button" className="btn btn-outline-primary" onClick={() => {
        setLoading(true);
        reload();
      }}>Tentar carregar o vínculo novamente</button>
    </div>
  );
  if (user.perfil === 'instrutor') {
    return <section className="surface-card">
      <h2 className="section-title">Meu código de instrutor</h2>
      <p className="text-secondary">Compartilhe este código com alunos que criarem a própria conta.</p>
      <Feedback {...feedback} />
      <div className="code-display mb-3" aria-label="Código de vínculo do instrutor">{connection.codigo}</div>
      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => navigator.clipboard?.writeText(connection.codigo)}>
          <i className="bi bi-clipboard me-2" />Copiar código
        </button>
        <button type="button" className="btn btn-outline-secondary" disabled={busy}
          onClick={() => action('/vinculos/codigo', 'POST', null, 'Gerar outro código e invalidar o anterior?')}>
          Gerar novo código
        </button>
      </div>
    </section>;
  }
  return <section className="surface-card">
    <h2 className="section-title">Meu instrutor</h2>
    <Feedback {...feedback} />
    {connection.instrutor_id ? <>
      <p><strong>{connection.instrutor_nome}</strong><br />
        <span className="text-secondary small">{connection.instrutor_email}</span></p>
      <button type="button" className="btn btn-outline-danger btn-sm" disabled={busy}
        onClick={() => action('/vinculos/me', 'DELETE', null, 'Desvincular este instrutor? Suas fichas serão mantidas.')}>
        Desvincular
      </button>
    </> : <p className="text-secondary">Você ainda não possui um instrutor vinculado.</p>}
    <form onSubmit={event => { event.preventDefault(); action('/vinculos/associar', 'POST', { codigo: code }); }}>
      <label className="form-label mt-3" htmlFor="codigo-vinculo">Código recebido do instrutor</label>
      <div className="input-group">
        <input id="codigo-vinculo" className="form-control text-uppercase" required
          minLength={12} maxLength={12} placeholder="12 caracteres" value={code}
          onChange={event => setCode(event.target.value.toUpperCase())} />
        <button type="submit" disabled={busy} className="btn btn-primary">Vincular</button>
      </div>
    </form>
    <p className="form-text mt-2">Apenas o instrutor atualmente vinculado poderá criar novas fichas para você.</p>
  </section>;
}
