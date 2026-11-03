import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import BarraLateral from './BarraLateral.jsx';
export default function PainelLayout({ items, active, onChange, title, tag, children }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  return <div className="app-shell">
    <BarraLateral user={user} items={items} active={active} onChange={onChange} onLogout={logout} open={open} onClose={() => setOpen(false)} />
    <div className="app-body">
      <header className="app-header">
        <button className="btn btn-light d-lg-none" onClick={() => setOpen(true)} aria-label="Abrir menu">
          <i className="bi bi-list fs-4" />
        </button>
        <h1>
          {title}
        </h1>
        <span className="header-tag ms-auto">
          {tag}
        </span>
      </header>
      <main className="app-main container-fluid">
        {children}
      </main>
    </div>
  </div>;
}
