import { useState } from 'react';
import { api } from '../services/api.js';
import { Feedback } from './Feedback.jsx';
export default function FormAluno({ aluno, onSuccess, onCancel }) {
  const [data, setData] = useState({ nome: aluno?.nome || '', email: aluno?.email || '', objetivo: aluno?.objetivo || '', plano: aluno?.plano || '', status: aluno?.status || 'ativo', senha: '' });
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { senha, ...b } = data;
      await api(aluno ? `/alunos/${aluno.id}` : '/alunos', { method: aluno ? 'PUT' : 'POST', body: aluno ? b : { ...b, ...(senha ? { senha } : {}) } });
      onSuccess();
    }
    catch (e) {
      setError(e.message);
    }
    finally {
      setSaving(false);
    }
  }
  return <form onSubmit={submit}>
    <Feedback error={error} />
    <div className="row g-3">
      <div className="col-sm-6">
        <label className="form-label">Nome completo</label>
        <input required minLength={2} className="form-control" value={data.nome} onChange={e => set('nome', e.target.value)} />
      </div>
      <div className="col-sm-6">
        <label className="form-label">E-mail</label>
        <input required type="email" className="form-control" value={data.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div className="col-sm-6">
        <label className="form-label">Objetivo</label>
        <input className="form-control" placeholder="Ex.: Hipertrofia" value={data.objetivo} onChange={e => set('objetivo', e.target.value)} />
      </div>
      <div className="col-sm-3">
        <label className="form-label">Plano</label>
        <input className="form-control" placeholder="Mensal" value={data.plano} onChange={e => set('plano', e.target.value)} />
      </div>
      <div className="col-sm-3">
        <label className="form-label">Status</label>
        <select className="form-select" value={data.status} onChange={e => set('status', e.target.value)}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>
      {!aluno && <div className="col-12">
        <label className="form-label">Senha inicial (opcional)</label>
        <input className="form-control" type="password" minLength={8} value={data.senha} onChange={e => set('senha', e.target.value)} placeholder="Deixe em branco para o aluno definir via recuperação por e-mail" />
        <div className="form-text">Se omitir, o aluno precisará usar “Esqueci minha senha”. O SMTP deve estar configurado.</div>
      </div>}
    </div><div className="d-flex justify-content-end gap-2 mt-4">
      <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>
      <button disabled={saving} className="btn btn-primary">
        {saving ? 'Salvando...' : aluno ? 'Salvar alterações' : 'Cadastrar aluno'}
      </button>
    </div>
  </form>;
}
