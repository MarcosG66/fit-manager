import { useState } from 'react';
import { useResource } from '../hooks/useResource.js';
import { api, qs } from '../services/api.js';
import { EmptyState, Feedback, Loading } from './Feedback.jsx';
import Modal from './Modal.jsx';
export default function CatalogoExercicios({ editable = true }) {
  const [busca, setBusca] = useState(''), [grupo, setGrupo] = useState(''), [editing, setEditing] = useState(null), [open, setOpen] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const { data: grupos, reload: reloadGrupos } = useResource('/grupos');
  const { data: exercicios, loading, reload } = useResource(`/exercicios${qs({ busca, grupo_id: grupo })}`);
  async function remove(x) {
    if (!confirm(`Excluir ${x.nome}?`))
      return;
    try {
      await api(`/exercicios/${x.id}`, { method: 'DELETE' });
      setSuccess('Exercício excluído.');
      reload();
    }
    catch (e) {
      setError(e.message);
    }
  }
  async function createGroup() {
    const name = prompt('Nome do novo grupo muscular:');
    if (!name)
      return;
    try {
      await api('/grupos', { method: 'POST', body: { nome: name } });
      reloadGrupos();
      setSuccess('Grupo adicionado.');
    }
    catch (e) {
      setError(e.message);
    }
  }
  return <>
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
      <div>
        <h2 className="section-title">Catálogo de exercícios</h2>
        <p className="text-secondary small mb-0">Exercícios organizados por grupo muscular</p>
      </div>
      {editable && <div className="d-flex gap-2">
        <button className="btn btn-outline-primary" onClick={createGroup}><i className="bi bi-folder-plus me-1" />Grupo</button>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><i className="bi bi-plus-lg me-1" />Novo exercício</button>
      </div>}
    </div>
    <Feedback error={error} success={success} /><div className="surface-card mb-3">
      <div className="row g-2">
        <div className="col-md-8">
          <input className="form-control" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar exercícios..." aria-label="Buscar exercícios" />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={grupo} onChange={e => setGrupo(e.target.value)}>
            <option value="">Todos os grupos</option>
            {grupos.map(g => <option key={g.id} value={g.id}>
              {g.nome}
            </option>)}
          </select>
        </div>
      </div>
    </div>
    {loading ? <Loading /> : !exercicios.length ? <EmptyState title="Nenhum exercício encontrado" /> : <div className="row g-3">
      {exercicios.map(x => <div key={x.id} className="col-md-6 col-xl-4">
        <article className="catalog-card h-100">
          <div className="d-flex align-items-start justify-content-between gap-2">
            <div className="exercise-icon">
              <i className="bi bi-dumbbell" />
            </div>
            <span className="tag-soft">
              {x.grupo_nome}
            </span>
          </div>
          <h3 className="h6 mt-3 mb-2">
            {x.nome}
          </h3>
          <p className="small text-secondary flex-grow-1">
            {x.descricao || 'Sem descrição cadastrada.'}
          </p>
          {editable && <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-primary" onClick={() => { setEditing(x); setOpen(true); }}><i className="bi bi-pencil me-1" />Editar</button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => remove(x)}><i className="bi bi-trash me-1" />Excluir</button>
          </div>}
        </article>
      </div>)}
    </div>}
    {open && <Modal title={editing ? 'Editar exercício' : 'Cadastrar exercício'} onClose={() => setOpen(false)}>
      <ExercicioForm key={editing?.id || 'new'} data={editing} grupos={grupos} onCancel={() => setOpen(false)} onSuccess={() => { setOpen(false); reload(); setSuccess('Catálogo atualizado.'); }} />
    </Modal>}
  </>;
}
function ExercicioForm({ data, grupos, onCancel, onSuccess }) {
  const [nome, setNome] = useState(data?.nome || ''), [descricao, setDescricao] = useState(data?.descricao || ''), [grupo, setGrupo] = useState(data?.grupo_id || grupos[0]?.id || ''), [error, setError] = useState(''), [working, setWorking] = useState(false);
  async function save(e) {
    e.preventDefault();
    setWorking(true);
    setError('');
    try {
      await api(data ? `/exercicios/${data.id}` : '/exercicios', { method: data ? 'PUT' : 'POST', body: { nome, descricao, grupo_id: Number(grupo) } });
      onSuccess();
    }
    catch (e) {
      setError(e.message);
    }
    finally {
      setWorking(false);
    }
  }
  return <form onSubmit={save}>
    <Feedback error={error} />
    <label className="form-label">Nome</label>
    <input required className="form-control mb-3" value={nome} onChange={e => setNome(e.target.value)} />
    <label className="form-label">Grupo muscular</label>
    <select className="form-select mb-3" required value={grupo} onChange={e => setGrupo(e.target.value)}>
      {grupos.map(g => <option value={g.id} key={g.id}>
        {g.nome}
      </option>)}
    </select>
    <label className="form-label">Descrição e orientações</label>
    <textarea className="form-control mb-4" rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} />
    <div className="d-flex justify-content-end gap-2">
      <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>
      <button className="btn btn-primary" disabled={working || !grupo}>Salvar exercício</button>
    </div>
  </form>;
}
