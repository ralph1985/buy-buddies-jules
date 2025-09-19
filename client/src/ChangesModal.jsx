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
              <table className="changes-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                  </tr>
                </thead>
                <tbody>
                  {added.map(item => (
                    <tr key={item.rowIndex}>
                      <td>{item.Descripción}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {edited.length > 0 && (
            <div className="change-section">
              <h3>Productos Editados</h3>
              <table className="changes-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Campo</th>
                    <th>Valor Anterior</th>
                    <th>Valor Nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {edited.flatMap(item =>
                    item.changedFields.map((change, index) => (
                      <tr key={`${item.rowIndex}-${change.field}`}>
                        {index === 0 ? (
                          <td rowSpan={item.changedFields.length}>
                            <strong>{item.Descripción}</strong>
                          </td>
                        ) : null}
                        <td>{change.field}</td>
                        <td>"{change.from}"</td>
                        <td>"{change.to}"</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {deleted.length > 0 && (
            <div className="change-section">
              <h3>Productos Eliminados</h3>
              <table className="changes-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                  </tr>
                </thead>
                <tbody>
                  {deleted.map(item => (
                    <tr key={item.rowIndex}>
                      <td>{item.Descripción}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChangesModal;
