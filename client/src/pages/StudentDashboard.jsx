import { useState } from 'react';

import Brand from '../components/Brand.jsx';
import Perfil from '../components/Perfil.jsx';
import BarraNavegacao from '../components/BarraNavegacao.jsx';
import TreinosAluno from '../components/aluno/TreinosAluno.jsx';
import MetricasAluno from '../components/aluno/MetricasAluno.jsx';
import EvolucaoAluno from '../components/aluno/EvolucaoAluno.jsx';
import VinculoInstrutor from '../components/VinculoInstrutor.jsx';
import MinhaConta from '../components/MinhaConta.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const TITULOS_ABAS = {
  treino: {
    titulo: 'Meu Treino',
    subtitulo: 'Registre as cargas e acompanhe o treino do dia',
  },
  metricas: {
    titulo: 'Minhas Métricas',
    subtitulo: 'Acompanhe suas avaliações corporais',
  },
  evolucao: {
    titulo: 'Evolução de Cargas',
    subtitulo: 'Veja seu desempenho ao longo das semanas',
  },
  instrutor: { titulo: 'Meu Instrutor', subtitulo: 'Associe sua conta a um instrutor' },
  conta: { titulo: 'Minha Conta', subtitulo: 'Gerencie seus dados e sua senha' },
};

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState('treino');
  const cabecalho = TITULOS_ABAS[abaAtiva];

  function renderizarAba() {
    switch (abaAtiva) {
      case 'treino':
        return <TreinosAluno />;
      case 'metricas':
        return <MetricasAluno />;
      case 'evolucao':
        return <EvolucaoAluno />;
      case 'instrutor':
        return <VinculoInstrutor />;
      case 'conta':
        return <MinhaConta />;
      default:
        return null;
    }
  }

  return (
    <div className="student-shell">
      <header className="student-header">
        <div className="student-container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <Perfil user={user} compact />
            </div>
            <div className="d-flex gap-2">
              <div className="d-none d-sm-block">
                <Brand light />
              </div>
              <button
                type="button"
                className="btn student-exit"
                title="Sair"
                onClick={logout}
              >
                <i className="bi bi-box-arrow-right" />
              </button>
            </div>
          </div>
          <h1>{cabecalho.titulo}</h1>
          <p className="mb-0">{cabecalho.subtitulo}</p>
        </div>
      </header>

      <main className="student-container student-content">
        {renderizarAba()}
      </main>
      <BarraNavegacao current={abaAtiva} onChange={setAbaAtiva} />
    </div>
  );
}
