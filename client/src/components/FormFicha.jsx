import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useResource } from '../hooks/useResource.js';
import { diaSemana } from '../utils/format.js';
import { Feedback, Loading } from './Feedback.jsx';
// Valores iniciais usados ao incluir um exercício novo na ficha.
function criarItemVazio() {
  return {
    exercicio_id: '',
    series: 3,
    repeticoes: '12',
    descanso_seg: 60,
    carga_sugerida_kg: null,
    ordem: 0,
  };
}
export default function FormFicha({ ficha, alunos, initialAlunoId, onSuccess, onCancel }) {
  const { data: exercicios, loading } = useResource('/exercicios');
  const [alunoId, setAlunoId] = useState(ficha?.aluno_id || initialAlunoId || alunos[0]?.id || '');
  const [nome, setNome] = useState(ficha?.nome || '');
  const [dia, setDia] = useState(ficha?.dia_semana ?? new Date().getDay());
  const [items, setItems] = useState(
    ficha?.itens?.map(item => ({
      id: item.id,
      exercicio_id: item.exercicio_id,
      series: item.series,
      repeticoes: item.repeticoes,
      descanso_seg: item.descanso_seg,
      carga_sugerida_kg: item.carga_sugerida_kg,
      ordem: item.ordem,
    })) || [criarItemVazio()],
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!alunoId && alunos[0])
      setAlunoId(alunos[0].id);
  }, [alunos, alunoId]);
  function editItem(indice, campo, valor) {
    setItems(itensAtuais => itensAtuais.map((item, posicao) => (
      posicao === indice ? { ...item, [campo]: valor } : item
    )));
  }
  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (!items.length || items.some(it => !it.exercicio_id))
        throw new Error('Selecione um exercício em cada item.');
      // O React mantém os valores dos formulários como texto.
      // Antes do envio, convertemos os campos numéricos para o formato da API.
      const dadosFicha = {
        aluno_id: Number(alunoId),
        nome,
        dia_semana: Number(dia),
        itens: items.map((item, indice) => ({
          ...item,
          exercicio_id: Number(item.exercicio_id),
          series: Number(item.series),
          descanso_seg: Number(item.descanso_seg),
          carga_sugerida_kg: item.carga_sugerida_kg === '' || item.carga_sugerida_kg === null
            ? null
            : Number(item.carga_sugerida_kg),
          ordem: indice,
        })),
      };
      await api(ficha ? `/fichas/${ficha.id}` : '/fichas', {
        method: ficha ? 'PUT' : 'POST',
        body: dadosFicha,
      });
      onSuccess();
    }
    catch (e) {
      setError(e.message);
    }
    finally {
      setSaving(false);
    }
  }
  if (loading)
    return <Loading />;
  return <form onSubmit={submit}>
    <Feedback error={error} />
    <div className="row g-3 mb-4">
      <div className="col-md-5">
        <label className="form-label">Aluno</label>
        <select className="form-select" required disabled={Boolean(ficha)} value={alunoId} onChange={e => setAlunoId(e.target.value)}>
          {alunos.map(a => <option key={a.id} value={a.id}>
            {a.nome}
          </option>)}
        </select>
      </div>
      <div className="col-md-4">
        <label className="form-label">Nome da ficha</label>
        <input className="form-control" required minLength={2} value={nome} onChange={e => setNome(e.target.value)} placeholder="Treino A — Peito" />
      </div>
      <div className="col-md-3">
        <label className="form-label">Dia da semana</label>
        <select className="form-select" value={dia} onChange={e => setDia(e.target.value)}>
          {diaSemana.map((d, i) => <option key={i} value={i}>
            {d}
          </option>)}
        </select>
      </div>
    </div>
    <div className="d-flex align-items-center justify-content-between mb-2">
      <h3 className="h6 mb-0">Exercícios da ficha</h3>
      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setItems(prev => [...prev, criarItemVazio()])}><i className="bi bi-plus-lg me-1" />Adicionar exercício</button>
    </div>
    <div className="d-grid gap-2">
      {items.map((it, i) => <div className="item-editor" key={it.id || `new-${i}`}>
        <div className="d-flex justify-content-between mb-2">
          <strong className="small">Exercício {i + 1}</strong>
          <button type="button" className="btn btn-sm btn-outline-danger" disabled={items.length === 1} onClick={() => setItems(prev => prev.filter((_, k) => k !== i))} title="Remover item">
            <i className="bi bi-trash" />
          </button>
        </div>
        <div className="row g-2">
          <div className="col-12">
            <label className="form-label small">Exercício</label>
            <select required className="form-select" value={it.exercicio_id} onChange={e => editItem(i, 'exercicio_id', e.target.value)}>
              <option value="">Selecione...</option>
              {exercicios.map(x => <option key={x.id} value={x.id}>{x.nome} — {x.grupo_nome}</option>)}
            </select>
          </div>
          <div className="col-sm-3 col-6">
            <label className="form-label small">Séries</label>
            <input className="form-control" type="number" required min="1" max="20" value={it.series} onChange={e => editItem(i, 'series', e.target.value)} />
          </div>
          <div className="col-sm-3 col-6">
            <label className="form-label small">Repetições</label>
            <input className="form-control" required value={it.repeticoes} onChange={e => editItem(i, 'repeticoes', e.target.value)} />
          </div>
          <div className="col-sm-3 col-6">
            <label className="form-label small">Descanso (s)</label>
            <input className="form-control" type="number" required min="0" value={it.descanso_seg} onChange={e => editItem(i, 'descanso_seg', e.target.value)} />
          </div>
          <div className="col-sm-3 col-6">
            <label className="form-label small">Carga sugerida (kg)</label>
            <input className="form-control" type="number" min="0" step="0.5" value={it.carga_sugerida_kg ?? ''} onChange={e => editItem(i, 'carga_sugerida_kg', e.target.value)} />
          </div>
        </div>
      </div>)}
    </div>
    <div className="d-flex justify-content-end gap-2 mt-4">
      <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>
      <button className="btn btn-primary" disabled={saving || !alunos.length || !exercicios.length}>
        {saving ? 'Salvando...' : ficha ? 'Salvar ficha' : 'Criar ficha'}
      </button>
    </div>
  </form>;
}
