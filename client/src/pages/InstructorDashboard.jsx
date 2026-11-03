import { useState } from 'react';

import PainelLayout from '../components/PainelLayout.jsx';
import { Loading, Feedback } from '../components/Feedback.jsx';
import CatalogoExercicios from '../components/CatalogoExercicios.jsx';
import ListaAlunos from '../components/instrutor/ListaAlunos.jsx';
import GestaoTreinos from '../components/instrutor/GestaoTreinos.jsx';
import VinculoInstrutor from '../components/VinculoInstrutor.jsx';
import MinhaConta from '../components/MinhaConta.jsx';
import { useResource } from '../hooks/useResource.js';

// Cada opção representa uma seção que o instrutor pode abrir.
const ITENS_MENU = [
  { id: 'alunos', label: 'Meus Alunos', icon: 'bi-people' },
  { id: 'treinos', label: 'Criar / Gerenciar Treinos', icon: 'bi-clipboard2-pulse' },
  { id: 'exercicios', label: 'Banco de Exercícios', icon: 'bi-journal-text' },
  { id: 'catalogo', label: 'Catálogo de Exercícios', icon: 'bi-dumbbell' },
  { id: 'vinculos', label: 'Meu Código', icon: 'bi-link-45deg' },
  { id: 'conta', label: 'Minha Conta', icon: 'bi-person-circle' },
];

const TITULOS_SECOES = {
  alunos: 'Meus Alunos',
  treinos: 'Fichas de Treino',
  exercicios: 'Banco de Exercícios',
  catalogo: 'Catálogo de Exercícios',
  vinculos: 'Vincular Alunos',
  conta: 'Minha Conta',
};

export default function InstructorDashboard() {
  const [secaoAtiva, setSecaoAtiva] = useState('alunos');
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  // Lista de alunos consultada uma vez e compartilhada com a gestão de treinos.
  const {
    data: alunos,
    reload: recarregarAlunos,
    loading: carregandoAlunos,
    error: erroAlunos,
  } = useResource('/alunos');

  function renderizarSecao() {
    if (carregandoAlunos) return <Loading />;

    switch (secaoAtiva) {
      case 'alunos':
        return (
          <ListaAlunos
            alunos={alunos}
            reload={recarregarAlunos}
            goToTreinos={idAluno => {
              setAlunoSelecionado(idAluno);
              setSecaoAtiva('treinos');
            }}
          />
        );
      case 'treinos':
        return <GestaoTreinos alunos={alunos} initialAlunoId={alunoSelecionado} />;
      case 'exercicios':
        return <CatalogoExercicios editable={false} />;
      case 'catalogo':
        return <CatalogoExercicios editable />;
      case 'vinculos':
        return <VinculoInstrutor />;
      case 'conta':
        return <MinhaConta />;
      default:
        return null;
    }
  }

  return (
    <PainelLayout
      items={ITENS_MENU}
      active={secaoAtiva}
      onChange={setSecaoAtiva}
      title={TITULOS_SECOES[secaoAtiva]}
      tag="Painel do Instrutor"
    >
      <Feedback error={erroAlunos} />
      {renderizarSecao()}
    </PainelLayout>
  );
}
