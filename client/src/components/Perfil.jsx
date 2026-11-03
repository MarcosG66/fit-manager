import { firstName } from '../utils/format.js';
const roleLabels = { aluno: 'Aluno', instrutor: 'Instrutor', admin: 'Administrador' };
export default function Perfil({ user, compact = false }) {
  if (!user)
    return null;
  const initials = user.nome.trim().split(/\s+/).slice(0, 2).map(v => v[0]?.toUpperCase()).join('');
  return <div className="d-flex align-items-center gap-3 min-width-0">
    <div className="avatar">
      {initials}
    </div>
    <div className="min-width-0">
      <div className="fw-semibold text-truncate">
        {compact ? firstName(user.nome) : user.nome}
      </div>
      <div className="small text-secondary">
        {roleLabels[user.perfil]}
      </div>
    </div>
  </div>;
}
