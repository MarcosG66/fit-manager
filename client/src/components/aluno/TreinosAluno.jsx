import { useEffect, useState } from 'react';
import CardExercicio from '../CardExercicio.jsx';
import { Loading, Feedback, EmptyState } from '../Feedback.jsx';
import { useResource } from '../../hooks/useResource.js';
import { diaSemana, weekdayInAcademyTimezone } from '../../utils/format.js';
export default function TreinosAluno() {
  const { data: fichas, loading, error, reload } = useResource('/fichas');
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    if (fichas.length && !fichas.some(f => f.id === selected))
      setSelected(fichas.find(f => f.dia_semana === weekdayInAcademyTimezone())?.id || fichas[0].id);
  }, [fichas, selected]);
  const ficha = fichas.find(f => f.id === selected);
  const total = ficha?.itens.length || 0, done = ficha?.itens.filter(i => Boolean(i.concluido_hoje)).length || 0;
  const pct = total ? Math.round(done / total * 100) : 0;
  if (loading)
    return <Loading />;
  return <>
    <Feedback error={error} />
    {!fichas.length ? <EmptyState icon="bi-calendar-x" title="Nenhum treino atribuído" detail="Peça ao instrutor para criar sua ficha de exercícios." /> : <>
      <section className="surface-card mb-3">
        <div className="d-flex justify-content-between mb-2">
          <strong>Progresso de hoje</strong>
          <span className="fw-bold text-primary">{done}/{total}</span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        {pct === 100 && <div className="text-success text-center small mt-2">Parabéns! Você concluiu todos os exercícios.</div>}
      </section>
      <div className="workout-tabs mb-3">
        {fichas.map(f => <button className={`workout-pill ${f.id === selected ? 'active' : ''}`} key={f.id} onClick={() => setSelected(f.id)}>
          {f.nome}
        </button>)}
      </div>
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <div className="text-secondary small">{diaSemana[ficha?.dia_semana]} · {total} exercícios</div>
          <h2 className="h5 mb-0">
            {ficha?.nome}
          </h2>
        </div>
        <span className="small text-secondary">{pct}% completo</span>
      </div>
      <div className="d-grid gap-3">
        {ficha?.itens.map(item => <CardExercicio key={item.id} item={item} onUpdated={reload} />)}
      </div>
    </>}
  </>;
}
