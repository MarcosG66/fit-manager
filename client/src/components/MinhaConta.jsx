import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Feedback, Loading } from './Feedback.jsx';

/** Área compartilhada pelos três perfis: editar perfil e trocar senha. */
export default function MinhaConta() {
  const { user, refresh, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [password, setPassword] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });
  const [feedback, setFeedback] = useState({ error: '', success: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/auth/profile')
      .then(response => setProfile(response.data))
      .catch(error => setFeedback({ error: error.message, success: '' }));
  }, []);

  const update = (field, value) => setProfile(previous => ({ ...previous, [field]: value }));

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setFeedback({ error: '', success: '' });
    try {
      const body = { nome: profile.nome, email: profile.email };
      if (user.perfil === 'aluno') {
        body.objetivo = profile.objetivo || '';
        body.plano = profile.plano || '';
      }
      await api('/auth/profile', { method: 'PUT', body });
      await refresh();
      setFeedback({ error: '', success: 'Dados atualizados.' });
    } catch (error) {
      setFeedback({ error: error.message, success: '' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (password.novaSenha !== password.confirmar) {
      setFeedback({ error: 'A confirmação da senha não coincide.', success: '' });
      return;
    }
    setSaving(true);
    setFeedback({ error: '', success: '' });
    try {
      await api('/auth/password', {
        method: 'PUT', body: { senhaAtual: password.senhaAtual, novaSenha: password.novaSenha },
      });
      await logout();
      window.location.assign('/login');
    } catch (error) {
      setFeedback({ error: error.message, success: '' });
      setSaving(false);
    }
  }

  if (!profile) return <><Feedback {...feedback} /><Loading /></>;
  return (
    <div className="row g-3">
      <div className="col-12"><Feedback {...feedback} /></div>
      <div className="col-lg-6">
        <section className="surface-card h-100">
          <h2 className="section-title">Meu perfil</h2>
          <p className="small text-secondary">Conta do tipo: {user.perfil}</p>
          <form onSubmit={saveProfile}>
            <label className="form-label" htmlFor="meu-nome">Nome</label>
            <input id="meu-nome" className="form-control mb-3" required minLength={2} maxLength={130}
              value={profile.nome || ''} onChange={event => update('nome', event.target.value)} />
            <label className="form-label" htmlFor="meu-email">E-mail</label>
            <input id="meu-email" type="email" className="form-control mb-3" required
              value={profile.email || ''} onChange={event => update('email', event.target.value)} />
            {user.perfil === 'aluno' && <>
              <label className="form-label" htmlFor="meu-objetivo">Objetivo</label>
              <input id="meu-objetivo" className="form-control mb-3" maxLength={200}
                value={profile.objetivo || ''} onChange={event => update('objetivo', event.target.value)} />
              <label className="form-label" htmlFor="meu-plano">Plano</label>
              <input id="meu-plano" className="form-control mb-3" maxLength={100}
                value={profile.plano || ''} onChange={event => update('plano', event.target.value)} />
            </>}
            <button className="btn btn-primary" disabled={saving}>Salvar alterações</button>
          </form>
        </section>
      </div>
      <div className="col-lg-6">
        <section className="surface-card h-100">
          <h2 className="section-title">Alterar senha</h2>
          <form onSubmit={changePassword}>
            <label className="form-label" htmlFor="senha-atual">Senha atual</label>
            <input id="senha-atual" type="password" autoComplete="current-password"
              required className="form-control mb-3" value={password.senhaAtual}
              onChange={event => setPassword(previous => ({ ...previous, senhaAtual: event.target.value }))} />
            <label className="form-label" htmlFor="senha-nova">Nova senha</label>
            <input id="senha-nova" type="password" autoComplete="new-password"
              minLength={8} maxLength={72} required className="form-control mb-3" value={password.novaSenha}
              onChange={event => setPassword(previous => ({ ...previous, novaSenha: event.target.value }))} />
            <label className="form-label" htmlFor="senha-confirmacao">Confirmar nova senha</label>
            <input id="senha-confirmacao" type="password" autoComplete="new-password"
              required className="form-control mb-3" value={password.confirmar}
              onChange={event => setPassword(previous => ({ ...previous, confirmar: event.target.value }))} />
            <button className="btn btn-outline-primary" disabled={saving}>Alterar senha</button>
          </form>
          <p className="form-text mt-3">Após alterar a senha, todas as sessões anteriores serão invalidadas.</p>
        </section>
      </div>
    </div>
  );
}
