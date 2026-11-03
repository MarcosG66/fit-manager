import { useEffect } from 'react';
export default function Modal({ title, onClose, children, size = 'lg' }) {
  useEffect(() => {
    function key(e) {
      if (e.key === 'Escape')
        onClose();
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return <div className="modal-backdrop-custom" role="presentation" onMouseDown={e => {
    if (e.target === e.currentTarget)
      onClose();
  }}>
    <div className={`modal-panel modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-panel-header">
        <h2 className="h5 mb-0">
          {title}
        </h2>
        <button className="btn-close" aria-label="Fechar" onClick={onClose} />
      </header>
      <div className="modal-panel-content">
        {children}
      </div>
    </div>
  </div>;
}
