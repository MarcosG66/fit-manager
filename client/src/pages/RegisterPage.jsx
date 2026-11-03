import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Feedback } from '../components/Feedback.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const INITIAL_DATA = {
  nome: '', email: '', senha: '', confirmar: '', perfil: 'aluno',
  objetivo: '', plano: '', codigoInstrutor: '', codigoAdmin: '',
};

const START_PAGES = { aluno: '/aluno', instrutor: '/instrutor', admin: '/admin' };

/** Cadastro unificado: cada perfil cria sua própria conta. */
export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_DATA);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field, value) => setForm(previous => ({ ...previous, [field]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.senha !== form.confirmar) {
      setError('As senhas informadas não coincidem.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { confirmar, ...registration } = form;
      const user = await register(registration);
      navigate(START_PAGES[user.perfil], { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Criar conta</h2>
      <p className="text-secondary">Escolha seu perfil e comece a utilizar o FitManager.</p>
      <form onSubmit={handleSubmit}>
        <Feedback error={error} />
        <label className="form-label" htmlFor="perfil">Perfil</label>
        <select id="perfil" className="form-select mb-3" value={form.perfil}
          onChange={event => update('perfil', event.target.value)}>
          <option value="aluno">Aluno</option>
          <option value="instrutor">Instrutor</option>
          <option value="admin">Administrador</option>
        </select>

        <label className="form-label" htmlFor="nome">Nome completo</label>
        <input id="nome" className="form-control mb-3" required minLength={2} maxLength={130}
          autoComplete="name" value={form.nome} onChange={event => update('nome', event.target.value)} />

        <label className="form-label" htmlFor="email">E-mail</label>
        <input id="email" type="email" className="form-control mb-3" required
          autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} />

        {form.perfil === 'aluno' && (
          <>
            <label className="form-label" htmlFor="objetivo">Objetivo</label>
            <input id="objetivo" className="form-control mb-3" maxLength={200}
              placeholder="Ex.: Hipertrofia" value={form.objetivo}
              onChange={event => update('objetivo', event.target.value)} />
            <label className="form-label" htmlFor="plano">Plano</label>
            <input id="plano" className="form-control mb-3" maxLength={100}
              placeholder="Ex.: Mensal" value={form.plano}
              onChange={event => update('plano', event.target.value)} />
            <label className="form-label" htmlFor="codigoInstrutor">Código do instrutor (opcional)</label>
            <input id="codigoInstrutor" className="form-control mb-2 text-uppercase"
              maxLength={12} placeholder="12 caracteres" value={form.codigoInstrutor}
              onChange={event => update('codigoInstrutor', event.target.value)} />
            <p className="form-text mb-3">Se não tiver o código, poderá vinculá-lo depois no seu painel.</p>
          </>
        )}

        {form.perfil === 'admin' && (
          <>
            <label className="form-label" htmlFor="codigoAdmin">Código de convite administrativo</label>
            <input id="codigoAdmin" type="password" className="form-control mb-2"
              autoComplete="off" required maxLength={200} value={form.codigoAdmin}
              onChange={event => update('codigoAdmin', event.target.value)} />
            <p className="form-text mb-3">Por segurança, solicite esse código ao responsável técnico.</p>
          </>
        )}

        <label className="form-label" htmlFor="senha">Senha (mínimo 8 caracteres)</label>
        <input id="senha" type="password" className="form-control mb-3" required minLength={8}
          maxLength={72} autoComplete="new-password" value={form.senha}
          onChange={event => update('senha', event.target.value)} />

        <label className="form-label" htmlFor="confirmar">Confirmar senha</label>
        <input id="confirmar" type="password" className="form-control mb-4" required
          autoComplete="new-password" value={form.confirmar}
          onChange={event => update('confirmar', event.target.value)} />

        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar minha conta'}
        </button>
      </form>
      <p className="text-center small mt-4">Já tem conta? <Link to="/login">Entrar</Link></p>
    </AuthLayout>
  );
}
