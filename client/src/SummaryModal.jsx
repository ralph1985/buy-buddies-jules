import React from 'react';

function SummaryModal({ isOpen, onClose, summaryData, isLoading }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Resumen del Presupuesto</h2>
        {isLoading ? (
          <div className="loading">Cargando resumen...</div>
        ) : (
          <ul className="summary-list">
            {summaryData.map((item, index) => (
              <li key={index} className={`summary-item summary-item-${item.type}`}>
                <span className="summary-label">{item.label}</span>
                <span className="summary-value">{item.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SummaryModal;
