import React from 'react';

function ChangesModal({ isOpen, onClose, changes }) {
  if (!isOpen) {
    return null;
  }

  const { added, edited, deleted } = changes;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Resumen de Cambios</h2>
        <div className="changes-summary">
          {added.length > 0 && (
            <div className="change-section">
              <h3>Productos Añadidos</h3>
              <ul>
                {added.map(item => <li key={item.rowIndex}>{item.Descripción}</li>)}
              </ul>
            </div>
          )}
          {edited.length > 0 && (
            <div className="change-section">
              <h3>Productos Editados</h3>
              <ul>
                {edited.map(item => <li key={item.rowIndex}>{item.Descripción}</li>)}
              </ul>
            </div>
          )}
          {deleted.length > 0 && (
            <div className="change-section">
              <h3>Productos Eliminados</h3>
              <ul>
                {deleted.map(item => <li key={item.rowIndex}>{item.Descripción}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChangesModal;
