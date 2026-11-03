import { useMemo, useState } from 'react';
import StatCard from '../StatCard.jsx';
import { Feedback, EmptyState } from '../Feedback.jsx';
import Modal from '../Modal.jsx';
import FormAluno from '../FormAluno.jsx';
import { api } from '../../services/api.js';
export default function ListaAlunos({ alunos, reload, goToTreinos }) {
  const [busca, setBusca] = useState(''), [status, setStatus] = useState(''), [editing, setEditing] = useState(undefined), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const filtered = useMemo(() => alunos.filter(a => (!status || a.status === status) && (`${a.nome} ${a.email}`.toLowerCase().includes(busca.toLowerCase()))), [alunos, busca, status]);
  const stats = { total: alunos.length, active: alunos.filter(a => a.status === 'ativo').length, inactive: alunos.filter(a => a.status === 'inativo').length, fichas: alunos.reduce((s, a) => s + Number(a.total_fichas), 0) };
  async function remove(a) {
    if (!confirm(`Excluir permanentemente o aluno ${a.nome}, suas fichas e histórico?`))
      return; setError(''); try {
        await api(`/alunos/${a.id}`, { method: 'DELETE' });
        setSuccess('Aluno excluído.');
        reload();
      }
    catch (e) {
      setError(e.message);
    }
  }
  async function toggleStatus(a) {
    try {
      await api(`/alunos/${a.id}/status`, { method: 'PATCH', body: { status: a.status === 'ativo' ? 'inativo' : 'ativo' } });
      reload();
    }
    catch (e) {
      setError(e.message);
    }
  }
  return <>
    <div className="row g-3 mb-4">
      <div className="col-sm-6 col-xl-3">
        <StatCard label="Total de Alunos" value={stats.total} icon="bi-people" />
      </div>
      <div className="col-sm-6 col-xl-3">
        <StatCard label="Ativos" value={stats.active} icon="bi-person-check" tone="green" />
      </div>
      <div className="col-sm-6 col-xl-3">
        <StatCard label="Inativos" value={stats.inactive} icon="bi-person-dash" tone="orange" />
      </div>
      <div className="col-sm-6 col-xl-3">
        <StatCard label="Fichas Criadas" value={stats.fichas} icon="bi-journal-check" tone="purple" />
      </div>
    </div>
    <div className="surface-card">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="section-title">Alunos cadastrados</h2>
          <p className="small text-secondary mb-0">Gerencie os alunos da sua academia</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(null)}><i className="bi bi-person-plus me-2" />Novo aluno</button>
      </div>
      <Feedback error={error} success={success} />
      <div className="row g-2 mb-3">
        <div className="col-md-8">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search" />
            </span>
            <input className="form-control" placeholder="Buscar por nome ou e-mail" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
        <div className="col-md-4">
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      </div>
      {filtered.length === 0 ? <EmptyState title="Nenhum aluno encontrado" /> : <div className="table-responsive">
        <table className="table app-table align-middle">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Objetivo</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Fichas</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => <tr key={a.id}>
              <td>
                <strong>
                  {a.nome}
                </strong>
                <div className="small text-secondary">
                  {a.email}
                </div>
              </td>
              <td>
                {a.objetivo || '—'}
              </td>
              <td>
                {a.plano || '—'}
              </td>
              <td>
                <span className={`status-pill ${a.status}`}>
                  {a.status}
                </span>
              </td>
              <td>
                {a.total_fichas}
              </td>
              <td>
                <div className="d-flex justify-content-end gap-1">
                  <button className="icon-btn" title="Editar aluno" onClick={() => setEditing(a)}>
                    <i className="bi bi-pencil" />
                  </button>
                  <button className="icon-btn" title="Ativar / inativar" onClick={() => toggleStatus(a)}>
                    <i className="bi bi-person-gear" />
                  </button>
                  <button className="icon-btn" title="Fichas de treino" onClick={() => goToTreinos(a.id)}>
                    <i className="bi bi-clipboard2-pulse" />
                  </button>
                  <button className="icon-btn danger" title="Excluir aluno" onClick={() => remove(a)}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </div>
    {editing !== undefined && <Modal title={editing ? 'Editar aluno' : 'Cadastrar aluno'} onClose={() => setEditing(undefined)}>
      <FormAluno key={editing?.id || 'new'} aluno={editing} onCancel={() => setEditing(undefined)} onSuccess={() => { setEditing(undefined); reload(); setSuccess('Aluno salvo com sucesso.'); }} />
    </Modal>}
  </>;
}
