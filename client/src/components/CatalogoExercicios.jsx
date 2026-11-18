import { useState } from 'react';

import { useResource } from '../hooks/useResource.js';
import { api, qs } from '../services/api.js';
import { EmptyState, Feedback, Loading } from './Feedback.jsx';
import Modal from './Modal.jsx';

/**
 * Ponto único de consulta e manutenção do catálogo para instrutores e administradores.
 * As mesmas rotas /exercicios e /grupos continuam sendo utilizadas nas fichas de treino.
 */
export default function CatalogoExercicios() {
  const [busca, setBusca] = useState('');
  const [grupoSelecionado, setGrupoSelecionado] = useState('');
  const [exercicioEmEdicao, setExercicioEmEdicao] = useState(null);
  const [modalExercicioAberto, setModalExercicioAberto] = useState(false);
  const [modalGruposAberto, setModalGruposAberto] = useState(false);
  const [mensagem, setMensagem] = useState({ error: '', success: '' });

  const {
    data: grupos,
    error: erroGrupos,
    reload: recarregarGrupos,
  } = useResource('/grupos');

  const {
    data: exercicios,
    loading: carregandoExercicios,
    error: erroExercicios,
    reload: recarregarExercicios,
  } = useResource(`/exercicios${qs({ busca, grupo_id: grupoSelecionado })}`);

  function abrirCadastroExercicio() {
    setExercicioEmEdicao(null);
    setModalExercicioAberto(true);
    setMensagem({ error: '', success: '' });
  }

  async function excluirExercicio(exercicio) {
    if (!window.confirm(`Excluir o exercício "${exercicio.nome}" do catálogo?`)) return;

    setMensagem({ error: '', success: '' });
    try {
      await api(`/exercicios/${exercicio.id}`, { method: 'DELETE' });
      await recarregarExercicios();
      setMensagem({ error: '', success: 'Exercício excluído do catálogo.' });
    } catch (error) {
      setMensagem({ error: error.message, success: '' });
    }
  }

  async function aposSalvarExercicio() {
    setModalExercicioAberto(false);
    await recarregarExercicios();
    setMensagem({ error: '', success: 'Exercício salvo no catálogo.' });
  }

  async function atualizarGrupos(grupoRemovidoId) {
    // Evita manter um filtro apontando para um grupo que acabou de ser excluído.
    if (String(grupoSelecionado) === String(grupoRemovidoId)) {
      setGrupoSelecionado('');
    }
    await Promise.all([recarregarGrupos(), recarregarExercicios()]);
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h2 className="section-title">Catálogo de Exercícios</h2>
          <p className="text-secondary small mb-0">
            Consulte, cadastre e organize exercícios por grupo muscular em um só lugar.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setModalGruposAberto(true)}
          >
            <i className="bi bi-folder-plus me-2" aria-hidden="true" />
            Gerenciar grupos
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={grupos.length === 0}
            title={grupos.length === 0 ? 'Cadastre um grupo muscular antes de adicionar exercícios.' : ''}
            onClick={abrirCadastroExercicio}
          >
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Novo exercício
          </button>
        </div>
      </div>

      <Feedback
        error={erroGrupos || erroExercicios || mensagem.error}
        success={mensagem.success}
      />
      {grupos.length === 0 && !erroGrupos && (
        <p className="alert alert-info" role="status">
          Para cadastrar um exercício, primeiro crie um grupo em <strong>Gerenciar grupos</strong>.
        </p>
      )}

      <section className="surface-card mb-3" aria-label="Filtros do catálogo">
        <div className="row g-2">
          <div className="col-md-8">
            <label htmlFor="catalogo-busca" className="form-label">Buscar exercício</label>
            <input
              id="catalogo-busca"
              className="form-control"
              value={busca}
              onChange={event => setBusca(event.target.value)}
              placeholder="Pesquise pelo nome do exercício"
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="catalogo-grupo" className="form-label">Grupo muscular</label>
            <select
              id="catalogo-grupo"
              className="form-select"
              value={grupoSelecionado}
              onChange={event => setGrupoSelecionado(event.target.value)}
            >
              <option value="">Todos os grupos</option>
              {grupos.map(grupo => (
                <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {carregandoExercicios ? (
        <Loading />
      ) : exercicios.length === 0 ? (
        <EmptyState title="Nenhum exercício encontrado" />
      ) : (
        <div className="row g-3">
          {exercicios.map(exercicio => (
            <div key={exercicio.id} className="col-md-6 col-xl-4">
              <article className="catalog-card h-100">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <span className="exercise-icon" aria-hidden="true">
                    <i className="bi bi-dumbbell" />
                  </span>
                  <span className="tag-soft">{exercicio.grupo_nome}</span>
                </div>
                <h3 className="h6 mt-3 mb-2">{exercicio.nome}</h3>
                <p className="small text-secondary flex-grow-1">
                  {exercicio.descricao || 'Sem descrição cadastrada.'}
                </p>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      setExercicioEmEdicao(exercicio);
                      setModalExercicioAberto(true);
                    }}
                  >
                    <i className="bi bi-pencil me-1" aria-hidden="true" />Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => excluirExercicio(exercicio)}
                  >
                    <i className="bi bi-trash me-1" aria-hidden="true" />Excluir
                  </button>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}

      {modalExercicioAberto && (
        <Modal
          title={exercicioEmEdicao ? 'Editar exercício' : 'Cadastrar exercício'}
          onClose={() => setModalExercicioAberto(false)}
        >
          <FormularioExercicio
            key={exercicioEmEdicao?.id ?? 'novo'}
            exercicio={exercicioEmEdicao}
            grupos={grupos}
            onCancel={() => setModalExercicioAberto(false)}
            onSuccess={aposSalvarExercicio}
          />
        </Modal>
      )}

      {modalGruposAberto && (
        <Modal title="Gerenciar grupos musculares" onClose={() => setModalGruposAberto(false)}>
          <GerenciadorGrupos grupos={grupos} onChange={atualizarGrupos} />
        </Modal>
      )}
    </>
  );
}

function FormularioExercicio({ exercicio, grupos, onCancel, onSuccess }) {
  const [nome, setNome] = useState(exercicio?.nome ?? '');
  const [descricao, setDescricao] = useState(exercicio?.descricao ?? '');
  const [grupoId, setGrupoId] = useState(exercicio?.grupo_id ?? grupos[0]?.id ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar(event) {
    event.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErro('');

    try {
      await api(exercicio ? `/exercicios/${exercicio.id}` : '/exercicios', {
        method: exercicio ? 'PUT' : 'POST',
        body: { nome: nome.trim(), descricao: descricao.trim(), grupo_id: Number(grupoId) },
      });
      await onSuccess();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar}>
      <Feedback error={erro} />
      <label className="form-label" htmlFor="exercicio-nome">Nome do exercício</label>
      <input
        id="exercicio-nome"
        required
        minLength={2}
        maxLength={160}
        className="form-control mb-3"
        value={nome}
        onChange={event => setNome(event.target.value)}
      />
      <label className="form-label" htmlFor="exercicio-grupo">Grupo muscular</label>
      <select
        id="exercicio-grupo"
        className="form-select mb-3"
        required
        value={grupoId}
        onChange={event => setGrupoId(event.target.value)}
      >
        {grupos.map(grupo => <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>)}
      </select>
      <label className="form-label" htmlFor="exercicio-descricao">Descrição e orientações</label>
      <textarea
        id="exercicio-descricao"
        className="form-control mb-4"
        rows={4}
        maxLength={5000}
        value={descricao}
        onChange={event => setDescricao(event.target.value)}
      />
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={salvando || !grupoId}>
          {salvando ? 'Salvando...' : 'Salvar exercício'}
        </button>
      </div>
    </form>
  );
}

/** As operações de grupos continuam utilizando a API REST já existente. */
function GerenciadorGrupos({ grupos, onChange }) {
  const [novoNome, setNovoNome] = useState('');
  const [grupoEmEdicao, setGrupoEmEdicao] = useState(null);
  const [nomeEmEdicao, setNomeEmEdicao] = useState('');
  const [mensagem, setMensagem] = useState({ error: '', success: '' });
  const [salvando, setSalvando] = useState(false);

  async function criarGrupo(event) {
    event.preventDefault();
    if (salvando) return;
    const nome = novoNome.trim();
    if (nome.length < 2) return;

    setSalvando(true);
    setMensagem({ error: '', success: '' });
    try {
      await api('/grupos', { method: 'POST', body: { nome } });
      await onChange(null);
      setNovoNome('');
      setMensagem({ error: '', success: 'Grupo muscular adicionado.' });
    } catch (error) {
      setMensagem({ error: error.message, success: '' });
    } finally {
      setSalvando(false);
    }
  }

  async function renomearGrupo(event) {
    event.preventDefault();
    if (salvando || !grupoEmEdicao) return;
    const nome = nomeEmEdicao.trim();
    if (nome.length < 2) return;

    setSalvando(true);
    setMensagem({ error: '', success: '' });
    try {
      await api(`/grupos/${grupoEmEdicao}`, { method: 'PUT', body: { nome } });
      await onChange(null);
      setGrupoEmEdicao(null);
      setMensagem({ error: '', success: 'Grupo muscular atualizado.' });
    } catch (error) {
      setMensagem({ error: error.message, success: '' });
    } finally {
      setSalvando(false);
    }
  }

  async function excluirGrupo(grupo) {
    if (salvando || !window.confirm(`Excluir o grupo "${grupo.nome}"?`)) return;

    setSalvando(true);
    setMensagem({ error: '', success: '' });
    try {
      await api(`/grupos/${grupo.id}`, { method: 'DELETE' });
      await onChange(grupo.id);
      setMensagem({ error: '', success: 'Grupo muscular excluído.' });
    } catch (error) {
      setMensagem({ error: error.message, success: '' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <p className="text-secondary small">
        Cadastre ou renomeie grupos para classificar os exercícios. Grupos que já possuem exercícios
        não podem ser excluídos.
      </p>
      <Feedback error={mensagem.error} success={mensagem.success} />
      <form onSubmit={criarGrupo} className="mb-4">
        <label htmlFor="novo-grupo" className="form-label">Novo grupo muscular</label>
        <div className="d-flex flex-wrap gap-2">
          <input
            id="novo-grupo"
            className="form-control flex-grow-1"
            style={{ flexBasis: '180px' }}
            placeholder="Ex.: Pernas"
            required
            minLength={2}
            maxLength={100}
            value={novoNome}
            onChange={event => setNovoNome(event.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={salvando || novoNome.trim().length < 2}>
            <i className="bi bi-folder-plus me-1" aria-hidden="true" />Adicionar grupo
          </button>
        </div>
      </form>
      <h3 className="h6">Grupos cadastrados ({grupos.length})</h3>
      <div className="list-group catalog-groups-list">
        {grupos.map(grupo => (
          <div className="list-group-item" key={grupo.id}>
            {grupoEmEdicao === grupo.id ? (
              <form onSubmit={renomearGrupo} className="d-flex gap-2 flex-wrap">
                <input
                  aria-label={`Novo nome para ${grupo.nome}`}
                  className="form-control flex-grow-1"
                  style={{ flexBasis: '150px' }}
                  required
                  minLength={2}
                  maxLength={100}
                  value={nomeEmEdicao}
                  onChange={event => setNomeEmEdicao(event.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={salvando || nomeEmEdicao.trim().length < 2}>Salvar</button>
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled={salvando} onClick={() => setGrupoEmEdicao(null)}>Cancelar</button>
              </form>
            ) : (
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span>{grupo.nome}</span>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={salvando}
                    onClick={() => {
                      setGrupoEmEdicao(grupo.id);
                      setNomeEmEdicao(grupo.nome);
                      setMensagem({ error: '', success: '' });
                    }}
                  >Editar</button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={salvando}
                    onClick={() => excluirGrupo(grupo)}
                  >Excluir</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
