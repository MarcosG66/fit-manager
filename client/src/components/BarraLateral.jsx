import Brand from './Brand.jsx';
import Perfil from './Perfil.jsx';
export default function BarraLateral({ user, items, active, onChange, onLogout, open, onClose }) {
  return <>
    <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={onClose} />
    <aside className={`app-sidebar ${open ? 'show' : ''}`}>
      <div className="sidebar-brand">
        <Brand />
      </div>
      <div className="p-3 flex-grow-1">
        <div className="sidebar-caption">MENU</div>
        <nav className="d-grid gap-1">
          {items.map(item => <button key={item.id} type="button" className={`sidebar-link ${item.id === active ? 'active' : ''}`} onClick={() => { onChange(item.id); onClose(); }}>
            <i className={`bi ${item.icon}`} />
            {item.label}
          </button>)}
        </nav>
      </div>
      <div className="sidebar-footer">
        <Perfil user={user} />
        <button onClick={onLogout} className="btn-logout" title="Encerrar sessão" aria-label="Sair">
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </aside>
  </>;
}
