import { Link } from 'react-router-dom';
import Brand from './Brand.jsx';
export default function AuthLayout({ children }) {
  return <div className="auth-shell">
    <section className="auth-brand-panel">
      <div>
        <Brand light />
      </div>
      <div>
        <div className="auth-eyebrow">PLATAFORMA DE GESTÃO</div>
        <h1>Gerencie sua academia<br />com inteligência.</h1>
        <p>Uma experiência simples para instrutores e alunos. Organize fichas, registre cargas e acompanhe sua evolução.</p>
        <div className="d-flex gap-3 flex-wrap mt-5">
          <div className="auth-highlight"><i className="bi bi-clipboard2-pulse" /> Treinos</div>
          <div className="auth-highlight"><i className="bi bi-bar-chart-line" /> Evolução</div>
          <div className="auth-highlight"><i className="bi bi-people" /> Gestão</div>
        </div>
      </div>
      <div className="small opacity-75">© {new Date().getFullYear()} FitManager • Projeto acadêmico</div>
    </section>
    <section className="auth-form-panel">
      <div className="auth-card">
        <div className="text-center d-lg-none mb-4">
          <Link to="/login" className="text-decoration-none">
            <Brand />
          </Link>
        </div>
        {children}
      </div>
    </section>
  </div>;
}
