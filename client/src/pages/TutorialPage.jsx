import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Brand from '../components/Brand.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const PAINEIS = { aluno: '/aluno', instrutor: '/instrutor', admin: '/admin' };

// Os passos acompanham as funcionalidades disponíveis nos painéis reais.
const GUIAS = {
  aluno: {
    rotulo: 'Aluno',
    icone: 'bi-person',
    resumo: 'Acesse seus treinos, registre seu desempenho e acompanhe a evolução.',
    passos: [
      { titulo: 'Crie sua conta e entre', descricao: 'No cadastro, selecione Aluno. Informe seus dados, defina uma senha e faça login com seu e-mail.' },
      { titulo: 'Conecte-se ao instrutor', descricao: 'Peça o código de 12 caracteres ao seu instrutor. Informe-o no cadastro ou na seção Meu Instrutor depois de entrar.' },
      { titulo: 'Consulte o treino', descricao: 'Na aba Treino, escolha uma ficha. Toque em um exercício para conferir séries, repetições e descanso.' },
      { titulo: 'Registre cargas e conclusão', descricao: 'Informe a carga utilizada em quilogramas, salve o registro e marque os exercícios realizados. A barra mostra o progresso do dia.' },
      { titulo: 'Acompanhe suas métricas', descricao: 'Em Métricas, registre peso em kg e altura em metros. O sistema calcula o IMC e guarda o histórico das avaliações.' },
      { titulo: 'Veja a evolução', descricao: 'Na aba Evolução, escolha um exercício para consultar o gráfico com a maior carga registrada em cada semana.' },
    ],
    observacao: 'Se nenhuma ficha aparecer, confirme o vínculo com o instrutor e solicite que ele atribua um treino.',
  },
  instrutor: {
    rotulo: 'Instrutor',
    icone: 'bi-person-workspace',
    resumo: 'Organize seus alunos, monte fichas e mantenha o catálogo de exercícios.',
    passos: [
      { titulo: 'Crie uma conta de instrutor', descricao: 'No cadastro, selecione Instrutor. Após entrar, você será encaminhado ao seu painel de gerenciamento.' },
      { titulo: 'Compartilhe seu código', descricao: 'A seção Meu Código mostra o código de vínculo de 12 caracteres. Compartilhe-o com os alunos que se cadastrarem sozinhos.' },
      { titulo: 'Gerencie seus alunos', descricao: 'Em Meus Alunos, consulte a lista, pesquise por nome ou e-mail, cadastre e edite os registros e gerencie o status de cada aluno.' },
      { titulo: 'Crie uma ficha', descricao: 'Em Criar / Gerenciar Treinos, selecione o aluno, clique em Criar ficha e informe nome, dia da semana, exercícios, séries, repetições e descanso.' },
      { titulo: 'Edite ou arquive treinos', descricao: 'Consulte as fichas do aluno e escolha Editar ou Arquivar. Arquivar retira a ficha ativa, mas preserva o histórico de cargas já registrado.' },
      { titulo: 'Consulte e gerencie exercícios', descricao: 'Em Catálogo de Exercícios, pesquise e filtre os exercícios, cadastre novos itens e gerencie os grupos musculares. As alterações ficam disponíveis ao montar fichas de treino.' },
    ],
    observacao: 'Um aluno cadastrado sem vínculo pode informar seu código na seção Meu Instrutor. O vínculo é necessário para criar novas fichas para ele.',
  },
  admin: {
    rotulo: 'Administrador',
    icone: 'bi-shield-check',
    resumo: 'Gerencie contas e mantenha o catálogo de exercícios da plataforma.',
    passos: [
      { titulo: 'Solicite o convite administrativo', descricao: 'No cadastro, selecione Administrador e informe o código de convite fornecido pelo responsável técnico. O código não é necessário nos próximos logins.' },
      { titulo: 'Consulte os indicadores', descricao: 'No painel Usuários, visualize os totais de alunos, instrutores, administradores e contas cadastradas.' },
      { titulo: 'Localize usuários', descricao: 'Use a busca por nome ou e-mail e o filtro de perfil para encontrar contas específicas.' },
      { titulo: 'Gerencie o acesso', descricao: 'Use Ativar ou Desativar para controlar o acesso às contas, respeitando as proteções do sistema para administradores.' },
      { titulo: 'Atualize o catálogo', descricao: 'Na seção Catálogo de Exercícios, consulte, cadastre, edite ou exclua exercícios e utilize Gerenciar grupos para criar, renomear ou remover grupos musculares sem exercícios vinculados.' },
      { titulo: 'Cuide da própria conta', descricao: 'Na seção Minha Conta, atualize seus dados e altere a senha. Use Sair ao finalizar.' },
    ],
    observacao: 'O código de convite administrativo concede acesso privilegiado: mantenha-o privado e solicite sua troca se for divulgado.',
  },
};

const DUVIDAS = [
  { pergunta: 'Preciso escolher o perfil na tela de login?', resposta: 'Não. O login solicita apenas e-mail e senha. O próprio servidor identifica seu perfil e abre o painel correspondente.' },
  { pergunta: 'Esqueci minha senha. O que faço?', resposta: 'Na tela de login, clique em Esqueci minha senha. O sistema pode enviar um código de oito dígitos por e-mail quando o serviço de envio estiver configurado.' },
  { pergunta: 'O que acontece ao arquivar uma ficha?', resposta: 'Ela deixa de integrar os treinos ativos, mas as cargas registradas anteriormente permanecem no histórico. Isso é diferente da remoção permanente de um aluno.' },
  { pergunta: 'Posso usar o FitManager no celular?', resposta: 'Sim. A interface é responsiva e o painel do aluno foi estruturado para navegação em smartphones.' },
];

export default function TutorialPage() {
  const { user } = useAuth();
  const [perfilSelecionado, setPerfilSelecionado] = useState(
    GUIAS[user?.perfil] ? user.perfil : 'aluno',
  );
  // Quando a sessão é recuperada após abrir /tutorial, seleciona o guia correto.
  useEffect(() => {
    if (user?.perfil && GUIAS[user.perfil]) setPerfilSelecionado(user.perfil);
  }, [user?.perfil]);

  const guia = GUIAS[perfilSelecionado];
  const destino = PAINEIS[user?.perfil] || '/login';

  return (
    <div className="tutorial-page">
      <header className="tutorial-topbar">
        <Link className="tutorial-brand-link" to={destino} aria-label="Voltar ao FitManager">
          <Brand />
        </Link>
        <nav aria-label="Acesso ao sistema" className="tutorial-top-actions">
          {!user && <Link to="/cadastro" className="btn btn-outline-primary btn-sm">Criar conta</Link>}
          <Link to={destino} className="btn btn-primary btn-sm">
            <i className="bi bi-arrow-left me-2" aria-hidden="true" />
            {user ? 'Meu painel' : 'Entrar'}
          </Link>
        </nav>
      </header>

      <main className="tutorial-container" id="conteudo">
        <section className="tutorial-hero" aria-labelledby="tutorial-titulo">
          <div className="tutorial-eyebrow"><i className="bi bi-journal-check me-2" />CENTRAL DE AJUDA</div>
          <h1 id="tutorial-titulo">Como usar o FitManager</h1>
          <p>Um guia rápido para começar a utilizar a plataforma. Escolha seu perfil e siga as etapas na ordem.</p>
          <a href="#passo-a-passo" className="btn btn-light btn-sm tutorial-hero-link">Ver passo a passo <i className="bi bi-arrow-down ms-2" /></a>
        </section>

        <section className="tutorial-overview" aria-labelledby="tutorial-primeiros-passos">
          <div>
            <h2 id="tutorial-primeiros-passos">Antes de começar</h2>
            <p>Crie sua conta na opção <strong>Criar conta</strong> ou entre com e-mail e senha. O painel exibido depende do perfil salvo na sua conta, não de uma escolha durante o login.</p>
          </div>
          <div className="tutorial-overview-icon" aria-hidden="true"><i className="bi bi-lightbulb" /></div>
        </section>

        <section id="passo-a-passo" aria-labelledby="tutorial-perfil">
          <div className="tutorial-section-heading">
            <div>
              <p className="tutorial-section-kicker">PASSO A PASSO</p>
              <h2 id="tutorial-perfil">Selecione seu perfil</h2>
            </div>
            <span className="tutorial-steps-count">6 passos por perfil</span>
          </div>
          <div className="tutorial-profile-selector" role="group" aria-label="Selecionar perfil para o tutorial">
            {Object.entries(GUIAS).map(([perfil, opcoes]) => (
              <button key={perfil} type="button"
                className={`tutorial-profile-button ${perfilSelecionado === perfil ? 'active' : ''}`}
                aria-pressed={perfilSelecionado === perfil}
                onClick={() => setPerfilSelecionado(perfil)}>
                <i className={`bi ${opcoes.icone}`} aria-hidden="true" />
                {opcoes.rotulo}
              </button>
            ))}
          </div>
          <div className="tutorial-guide-intro">
            <h3>Guia do {guia.rotulo.toLowerCase()}</h3>
            <p>{guia.resumo}</p>
          </div>
          <ol className="tutorial-steps">
            {guia.passos.map((passo, indice) => (
              <li key={`${perfilSelecionado}-${indice}`} className="tutorial-step">
                <span className="tutorial-step-number" aria-hidden="true">{indice + 1}</span>
                <div>
                  <h4>{passo.titulo}</h4>
                  <p>{passo.descricao}</p>
                </div>
              </li>
            ))}
          </ol>
          <aside className="tutorial-tip" aria-label="Dica para este perfil">
            <i className="bi bi-info-circle" aria-hidden="true" />
            <p><strong>Dica:</strong> {guia.observacao}</p>
          </aside>
        </section>

        <section className="tutorial-faq" aria-labelledby="tutorial-duvidas">
          <div className="tutorial-section-heading">
            <div>
              <p className="tutorial-section-kicker">AJUDA RÁPIDA</p>
              <h2 id="tutorial-duvidas">Dúvidas frequentes</h2>
            </div>
          </div>
          <div className="tutorial-faq-list">
            {DUVIDAS.map(duvida => (
              <details key={duvida.pergunta} className="tutorial-faq-item">
                <summary>{duvida.pergunta} <i className="bi bi-chevron-down" aria-hidden="true" /></summary>
                <p>{duvida.resposta}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="tutorial-finish">
          <div>
            <h2>Pronto para começar?</h2>
            <p>Volte ao seu painel e experimente as funcionalidades explicadas acima.</p>
          </div>
          <Link to={destino} className="btn btn-primary">{user ? 'Voltar ao meu painel' : 'Ir para o login'} <i className="bi bi-arrow-right ms-2" /></Link>
        </section>
      </main>
      <footer className="tutorial-footer">FitManager • Projeto acadêmico • Guia de utilização</footer>
    </div>
  );
}
