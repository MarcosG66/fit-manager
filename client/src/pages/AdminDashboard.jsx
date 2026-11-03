import { useMemo, useState } from 'react';
import PainelLayout from '../components/PainelLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import CatalogoExercicios from '../components/CatalogoExercicios.jsx';
import MinhaConta from '../components/MinhaConta.jsx';
import { useResource } from '../hooks/useResource.js';
import { Feedback, EmptyState, Loading } from '../components/Feedback.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';
import { brDate } from '../utils/format.js';

const MENU = [
  { id: 'usuarios', label: 'Usuários', icon: 'bi-people' },
  { id: 'catalogo', label: 'Catálogo de Exercícios', icon: 'bi-dumbbell' },
  { id: 'conta', label: 'Minha Conta', icon: 'bi-person-circle' },
];
const TITLES = { usuarios: 'Gestão de Usuários', catalogo: 'Catálogo de Exercícios', conta: 'Minha Conta' };

export default function AdminDashboard() {
  const [section, setSection] = useState('usuarios');
  return <PainelLayout items={MENU} active={section} onChange={setSection}
    title={TITLES[section]} tag="Painel do Administrador">
    {section === 'usuarios' ? <UserManagement /> : section === 'catalogo'
      ? <CatalogoExercicios editable /> : <MinhaConta />}
  </PainelLayout>;
}

function UserManagement() {
  const { user } = useAuth();
  const { data: users, loading, error, reload } = useResource('/usuarios');
  const { data: totals } = useResource('/usuarios/totais');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState({ error: '', success: '' });
  const [workingId, setWorkingId] = useState(null);

  const filtered = useMemo(() => users.filter(item =>
    (!role || item.perfil === role) &&
    `${item.nome} ${item.email}`.toLowerCase().includes(search.toLowerCase()),
  ), [users, role, search]);

  async function toggleAccount(target) {
    const nextActive = !Boolean(target.ativo);
    if (!window.confirm(`${nextActive ? 'Ativar' : 'Desativar'} a conta de ${target.nome}?`)) return;
    setWorkingId(target.id);
    setMessage({ error: '', success: '' });
    try {
      const response = await api(`/usuarios/${target.id}/ativo`, {
        method: 'PATCH', body: { ativo: nextActive },
      });
      await reload();
      setMessage({ error: '', success: response.message });
    } catch (requestError) {
      setMessage({ error: requestError.message, success: '' });
    } finally {
      setWorkingId(null);
    }
  }

  return <>
    <div className="row g-3 mb-4">
      <div className="col-sm-6 col-xl-3"><StatCard label="Usuários" value={users.length} icon="bi-people" /></div>
      <div className="col-sm-6 col-xl-3"><StatCard label="Alunos" value={totals.aluno ?? 0} icon="bi-person" tone="green" /></div>
      <div className="col-sm-6 col-xl-3"><StatCard label="Instrutores" value={totals.instrutor ?? 0} icon="bi-person-workspace" tone="orange" /></div>
      <div className="col-sm-6 col-xl-3"><StatCard label="Administradores" value={totals.admin ?? 0} icon="bi-shield" tone="purple" /></div>
    </div>
    <section className="surface-card">
      <h2 className="section-title">Contas cadastradas</h2>
      <p className="small text-secondary">Consulte usuários por nome, e-mail ou perfil e gerencie o acesso.</p>
      <Feedback error={error || message.error} success={message.success} />
      <div className="row g-2 mb-3">
        <div className="col-md-8"><input className="form-control" aria-label="Buscar usuário"
          placeholder="Nome ou e-mail" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <div className="col-md-4"><select className="form-select" aria-label="Filtrar perfil"
          value={role} onChange={event => setRole(event.target.value)}>
          <option value="">Todos os perfis</option><option value="aluno">Aluno</option>
          <option value="instrutor">Instrutor</option><option value="admin">Administrador</option>
        </select></div>
      </div>
      {loading ? <Loading /> : filtered.length === 0
        ? <EmptyState title="Nenhum usuário encontrado" />
        : <div className="table-responsive"><table className="table app-table align-middle">
          <thead><tr><th>Usuário</th><th>Perfil</th><th>Status</th><th>Cadastro</th><th>Ação</th></tr></thead>
          <tbody>{filtered.map(item => <tr key={item.id}>
            <td><strong>{item.nome}</strong><div className="small text-secondary">{item.email}</div></td>
            <td><span className="tag-soft text-capitalize">{item.perfil}</span></td>
            <td><span className={`status-pill ${item.ativo ? 'ativo' : 'inativo'}`}>
              {item.ativo ? 'Conta ativa' : 'Conta desativada'}
            </span>
              {item.perfil === 'aluno' && item.status === 'inativo' && (
                <div className="text-secondary small mt-1">Aluno inativado pelo instrutor</div>
              )}</td>
            <td>{brDate(item.criado_em)}</td>
            <td><button type="button" className="btn btn-outline-secondary btn-sm"
              disabled={workingId === item.id || item.id === user.id}
              onClick={() => toggleAccount(item)}>
              {item.ativo ? 'Desativar' : 'Ativar'}
            </button></td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </>;
}
