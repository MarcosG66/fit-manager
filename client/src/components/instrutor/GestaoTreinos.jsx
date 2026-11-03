import { useState } from 'react';
import { useResource } from '../../hooks/useResource.js';
import { Loading, Feedback, EmptyState } from '../Feedback.jsx';
import Modal from '../Modal.jsx';
import FormFicha from '../FormFicha.jsx';
import { api } from '../../services/api.js';
import { brDate, diaSemana } from '../../utils/format.js';
export default function GestaoTreinos({ alunos, initialAlunoId = null }) {
  const [alunoId, setAlunoId] = useState(initialAlunoId || ''), [editing, setEditing] = useState(undefined), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const selected = alunoId || alunos[0]?.id || '';
  const { data: fichas, loading, error: erroConsulta, reload } = useResource(selected ? `/fichas?aluno_id=${selected}` : null);
  async function remove(f) {
    if (!confirm(`Arquivar a ficha "${f.nome}"? O histórico de cargas será preservado.`))
      return; try {
        await api(`/fichas/${f.id}`, { method: 'DELETE' });
        reload();
        setSuccess('Ficha arquivada. O histórico foi preservado.');
      }
    catch (e) {
      setError(e.message);
    }
  }
  return <>
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
      <div>
        <h2 className="section-title">Fichas de treinamento</h2>
        <p className="small text-secondary mb-0">Crie planos personalizados para cada aluno</p>
      </div>
      <button className="btn btn-primary" disabled={!alunos.length} onClick={() => setEditing(null)}><i className="bi bi-plus-lg me-1" />Criar ficha</button>
    </div>
    <Feedback error={error || erroConsulta} success={success} />
    <div className="surface-card mb-3">
      <label className="form-label small fw-semibold">Selecionar aluno</label>
      <select className="form-select" disabled={!alunos.length} value={selected} onChange={e => setAlunoId(e.target.value)}>
        {!alunos.length && <option value="">Cadastre um aluno primeiro</option>}
        {alunos.map(a => <option value={a.id} key={a.id}>
          {a.nome}
        </option>)}
      </select>
    </div>
    {loading ? <Loading /> : !fichas.length ? <EmptyState title="Nenhuma ficha cadastrada" detail="Crie a primeira ficha de treino para este aluno." /> : <div className="row g-3">
      {fichas.map(f => <div className="col-md-6 col-xxl-4" key={f.id}>
        <div className="surface-card h-100 d-flex flex-column">
          <div className="d-flex justify-content-between gap-2">
            <div className="tag-soft">
              {diaSemana[f.dia_semana]}
            </div>
            <div className="small text-secondary">
              {brDate(f.criada_em)}
            </div>
          </div>
          <h3 className="h5 mt-3">
            {f.nome}
          </h3>
          <div className="small text-secondary mb-3">{f.itens.length} exercícios</div>
          <ul className="list-unstyled small flex-grow-1">
            {f.itens.map(it => <li className="py-1 border-bottom" key={it.id}><i className="bi bi-check2-circle text-primary me-1" />{it.exercicio_nome} · {it.series}×{it.repeticoes}</li>)}
          </ul>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => setEditing(f)}><i className="bi bi-pencil me-1" />Editar</button>
            <button className="btn btn-outline-danger btn-sm" onClick={() => remove(f)}><i className="bi bi-trash me-1" />Arquivar</button>
          </div>
        </div>
      </div>)}
    </div>}
    {editing !== undefined && <Modal title={editing ? 'Editar ficha' : 'Criar ficha'} onClose={() => setEditing(undefined)}>
      <FormFicha key={editing?.id || 'new'} ficha={editing} alunos={alunos} initialAlunoId={selected} onCancel={() => setEditing(undefined)} onSuccess={() => { setEditing(undefined); reload(); setSuccess('Ficha salva com sucesso.'); }} />
    </Modal>}
  </>;
}
