import React from 'react';

function SummaryModal({ isOpen, onClose, summaryData, isLoading, pinnedSummaryItems, onPinnedChange }) {
  if (!isOpen) {
    return null;
  }

  const handleCheckboxChange = (e, label) => {
    if (onPinnedChange) {
      onPinnedChange(label, e.target.checked);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Resumen del Presupuesto</h2>
        <p className="summary-instructions">
          Selecciona los elementos que quieres ver en el resumen principal.
        </p>
        {isLoading ? (
          <div className="loading">Cargando resumen...</div>
        ) : (
          <ul className="summary-list">
            {summaryData.map((item, index) => (
              <li key={index} className={`summary-item summary-item-${item.type}`}>
                <input
                  type="checkbox"
                  className="summary-pin-checkbox"
                  checked={pinnedSummaryItems.includes(item.label)}
                  onChange={(e) => handleCheckboxChange(e, item.label)}
                  id={`summary-item-${index}`}
                />
                <label htmlFor={`summary-item-${index}`} className="summary-item-content">
                  <span className="summary-label">{item.label}</span>
                  <span className="summary-value">{item.value}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SummaryModal;
