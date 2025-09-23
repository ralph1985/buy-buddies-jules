import React from 'react';

function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cerrar Sesión</h2>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <p>¿Seguro que quieres cerrar sesión?</p>
        <div className="form-actions">
          <button className="summary-link-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="form-save-button" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;
