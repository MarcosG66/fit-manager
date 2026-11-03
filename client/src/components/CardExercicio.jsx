import { useState } from 'react';

import { api } from '../services/api.js';
import { Feedback } from './Feedback.jsx';
import { decimals } from '../utils/format.js';

/**
 * Cartão de um exercício na ficha do aluno.
 * Permite registrar a carga e marcar o exercício como concluído no dia.
 */
export default function CardExercicio({ item, onUpdated }) {
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [carga, setCarga] = useState(
    item.ultima_carga ?? item.carga_sugerida_kg ?? '',
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [concluido, setConcluido] = useState(Boolean(item.concluido_hoje));

  async function salvarCarga() {
    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      await api('/cargas', {
        method: 'POST',
        body: {
          item_ficha_id: item.id,
          carga_kg: Number(carga),
        },
      });
      setSucesso('Carga registrada no histórico!');
      onUpdated?.();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function alternarConclusao() {
    setSalvando(true);
    setErro('');

    try {
      const novoStatus = !concluido;

      await api('/cargas/conclusao', {
        method: 'PUT',
        body: {
          item_ficha_id: item.id,
          concluido: novoStatus,
        },
      });

      setConcluido(novoStatus);
      onUpdated?.();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <article className={`exercise-card ${concluido ? 'is-done' : ''}`}>
      <button
        type="button"
        className="exercise-head"
        onClick={() => setDetalhesAbertos(!detalhesAbertos)}
        aria-expanded={detalhesAbertos}
      >
        <div className="exercise-icon">
          <i className="bi bi-dumbbell" />
        </div>
        <div className="text-start flex-grow-1">
          <div className="fw-semibold">{item.exercicio_nome}</div>
          <div className="small text-secondary">
            {item.series} séries · {item.repeticoes} repetições · {item.grupo_nome}
          </div>
        </div>
        <i className={`bi ${
          concluido
            ? 'bi-check-circle-fill text-success'
            : detalhesAbertos ? 'bi-chevron-up' : 'bi-chevron-down'
        }`} />
      </button>

      {detalhesAbertos && (
        <div className="exercise-details">
          <p className="small text-secondary mb-2">
            {item.exercicio_descricao || 'Siga as orientações do seu instrutor.'}
          </p>

          <div className="small mb-3">
            <i className="bi bi-clock me-1" />
            Descanso: {item.descanso_seg}s
            {item.ultima_carga !== null && (
              <span className="ms-3">
                Última carga: {decimals(item.ultima_carga)} kg
              </span>
            )}
          </div>

          <Feedback error={erro} success={sucesso} />
          <label htmlFor={`load-${item.id}`} className="form-label small fw-semibold">
            Carga utilizada (kg)
          </label>
          <div className="input-group mb-3">
            <input
              id={`load-${item.id}`}
              className="form-control"
              type="number"
              min="0"
              max="9999"
              step="0.5"
              value={carga}
              onChange={event => setCarga(event.target.value)}
            />
            <span className="input-group-text">kg</span>
            <button
              className="btn btn-primary"
              disabled={salvando || carga === '' || Number(carga) < 0}
              onClick={salvarCarga}
            >
              Salvar carga
            </button>
          </div>

          <button
            type="button"
            className={`btn btn-sm w-100 ${concluido ? 'btn-outline-success' : 'btn-outline-primary'}`}
            disabled={salvando}
            onClick={alternarConclusao}
          >
            <i className={`bi ${concluido ? 'bi-check-circle-fill' : 'bi-circle'} me-2`} />
            {concluido ? 'Concluído — desmarcar' : 'Marcar exercício como concluído'}
          </button>
        </div>
      )}
    </article>
  );
}
