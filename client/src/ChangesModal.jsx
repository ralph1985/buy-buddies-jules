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
        <p className="modal-subtitle">La lista ha sido actualizada por otra persona. Revisa los cambios.</p>
        <div className="changes-summary">
          {added.length > 0 && (
            <div className="change-section">
              <h3>Productos Añadidos</h3>
              <ul className="changes-list">
                {added.map(item => <li key={item.rowIndex}>{item.Descripción}</li>)}
              </ul>
            </div>
          )}
          {edited.length > 0 && (
            <div className="change-section">
              <h3>Productos Editados</h3>
              <ul className="changes-list">
                {edited.map(item => (
                  <li key={item.rowIndex}>
                    <strong className="edited-item-name">{item.Descripción}</strong>
                    <ul className="edited-fields-list">
                      {item.changedFields.map(change => (
                        <li key={change.field}>
                          <span className="field-name">{change.field}:</span>
                          <span className="field-change">de "{change.from}" a "{change.to}"</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {deleted.length > 0 && (
            <div className="change-section">
              <h3>Productos Eliminados</h3>
              <ul className="changes-list">
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
