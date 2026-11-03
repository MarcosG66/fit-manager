// Abas fixas do painel do aluno: o componente pai controla qual está ativa.
const ABAS_ALUNO = [
  { id: 'treino', label: 'Treino', icon: 'bi-activity' },
  { id: 'metricas', label: 'Métricas', icon: 'bi-speedometer2' },
  { id: 'evolucao', label: 'Evolução', icon: 'bi-graph-up-arrow' },
  { id: 'instrutor', label: 'Instrutor', icon: 'bi-person-check' },
  { id: 'conta', label: 'Conta', icon: 'bi-person-circle' },
];

export default function BarraNavegacao({ current, onChange }) {
  return (
    <nav className="student-bottom-nav" aria-label="Navegação do aluno">
      {ABAS_ALUNO.map(aba => (
        <button
          key={aba.id}
          type="button"
          className={`student-bottom-button ${current === aba.id ? 'active' : ''}`}
          onClick={() => onChange(aba.id)}
          aria-current={current === aba.id ? 'page' : undefined}
        >
          <i className={`bi ${aba.icon} fs-5`} />
          <span>{aba.label}</span>
        </button>
      ))}
    </nav>
  );
}
