import { useState } from 'react';
import { Loading, Feedback, EmptyState } from '../Feedback.jsx';
import { useResource } from '../../hooks/useResource.js';
import { api } from '../../services/api.js';
import { brDate, decimals } from '../../utils/format.js';
export default function MetricasAluno() {
  const { data: metrics, loading, error, reload } = useResource('/avaliacoes');
  const [weight, setWeight] = useState(''), [height, setHeight] = useState(''), [working, setWorking] = useState(false), [formError, setFormError] = useState(''), [success, setSuccess] = useState('');
  async function save(e) {
    e.preventDefault();
    setWorking(true);
    setFormError('');
    setSuccess('');
    try {
      await api('/avaliacoes', { method: 'POST', body: { peso_kg: Number(weight), altura_m: Number(height) } });
      setWeight('');
      setHeight('');
      setSuccess('Avaliação registrada com sucesso.');
      reload();
    }
    catch (e) {
      setFormError(e.message);
    }
    finally {
      setWorking(false);
    }
  }
  async function remove(id) {
    if (!confirm('Excluir esta avaliação?'))
      return;
    try {
      await api(`/avaliacoes/${id}`, { method: 'DELETE' });
      reload();
    }
    catch (e) {
      setFormError(e.message);
    }
  }
  const latest = metrics[0];
  return <>
    <section className="surface-card mb-3">
      <h2 className="h6 mb-3"><i className="bi bi-plus-circle text-primary me-2" />Registrar avaliação</h2>
      <Feedback error={error || formError} success={success} />
      <form onSubmit={save}>
        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small">Peso (kg)</label>
            <input type="number" step="0.1" min="10" max="500" required className="form-control" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70,5" />
          </div>
          <div className="col-6">
            <label className="form-label small">Altura (m)</label>
            <input type="number" step="0.01" min="0.8" max="2.5" required className="form-control" value={height} onChange={e => setHeight(e.target.value)} placeholder="1,75" />
          </div>
        </div>
        <button className="btn btn-primary w-100 mt-3" disabled={working}>
          {working ? 'Salvando...' : 'Salvar avaliação'}
        </button>
      </form>
    </section>
    {latest && <section className="row g-2 mb-3">
      <div className="col-4">
        <div className="metric-stat">
          <small>Peso</small>
          <strong>
            {decimals(latest.peso_kg)}
            <small> kg</small>
          </strong>
        </div>
      </div>
      <div className="col-4">
        <div className="metric-stat">
          <small>Altura</small>
          <strong>
            {decimals(latest.altura_m, 2)}
            <small> m</small>
          </strong>
        </div>
      </div>
      <div className="col-4">
        <div className="metric-stat">
          <small>IMC</small>
          <strong>
            {decimals(latest.imc)}
          </strong>
        </div>
      </div>
    </section>}
    <section className="surface-card">
      <h2 className="h6 mb-3">Histórico de avaliações</h2>
      {loading ? <Loading /> : metrics.length ? metrics.map(m => <div className="metric-row" key={m.id}>
        <div>
          <strong>
            {brDate(m.data_avaliacao)}
          </strong>
          <div className="small text-secondary">{decimals(m.peso_kg)} kg · {decimals(m.altura_m, 2)} m · IMC {decimals(m.imc)}</div>
        </div>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(m.id)} title="Excluir avaliação">
          <i className="bi bi-trash" />
        </button>
      </div>) : <EmptyState title="Ainda não há avaliações" />}
    </section>
  </>;
}
