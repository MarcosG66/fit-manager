import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loading, Feedback, EmptyState } from '../Feedback.jsx';
import { useResource } from '../../hooks/useResource.js';
import { brDate } from '../../utils/format.js';
export default function EvolucaoAluno() {
  const { data, loading, error } = useResource('/cargas/evolucao');
  const [exId, setExId] = useState('');
  const exercises = useMemo(() => Array.from(new Map(data.map(x => [x.exercicio_id, x.exercicio_nome])).entries()), [data]);
  useEffect(() => {
    if (exercises.length && !exercises.some(([id]) => String(id) === String(exId)))
      setExId(String(exercises[0][0]));
  }, [exercises, exId]);
  const history = data.filter(x => String(x.exercicio_id) === String(exId)).map(x => ({ semana: brDate(x.semana), carga: Number(x.carga_kg) }));
  return <section className="surface-card">
    <h2 className="h6 mb-3">Evolução semanal por exercício</h2>
    <Feedback error={error} />
    {loading ? <Loading /> : !exercises.length ? <EmptyState icon="bi-graph-up" title="Sem dados de evolução" detail="Registre cargas nos seus treinos para visualizar o gráfico." /> : <>
      <label className="form-label small">Exercício</label>
      <select className="form-select mb-4" value={exId} onChange={e => setExId(e.target.value)}>
        {exercises.map(([id, nome]) => <option key={id} value={id}>
          {nome}
        </option>)}
      </select>
      <div style={{ height: 280, width: '100%' }}>
        <ResponsiveContainer>
          <LineChart data={history} margin={{ top: 5, right: 16, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9eef8" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" kg" />
            <Tooltip formatter={v => [`${v} kg`, 'Maior carga da semana']} />
            <Line type="monotone" dataKey="carga" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="small text-secondary mt-3 mb-0">O gráfico mostra a maior carga registrada em cada semana, por exercício.</p>
    </>}
  </section>;
}
