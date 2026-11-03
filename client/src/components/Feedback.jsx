export function Feedback({ error, success }) {
  return <>
    {error && <div className="alert alert-danger py-2 small" role="alert">
      {error}
    </div>}
    {success && <div className="alert alert-success py-2 small" role="status">
      {success}
    </div>}
  </>;
}
export function EmptyState({ icon = 'bi-inbox', title = 'Nenhum resultado', detail }) {
  return <div className="empty-state">
    <i className={`bi ${icon} fs-1 d-block mb-2`} />
    <strong>
      {title}
    </strong>
    {detail && <div className="small mt-1">
      {detail}
    </div>}
  </div>;
}
export function Loading() {
  return <div className="text-center py-5">
    <div className="spinner-border text-primary" role="status" aria-label="Carregando" />
  </div>;
}
