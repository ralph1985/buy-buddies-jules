import React, { useState, useEffect } from "react";

function BulkEditModal({
  isOpen,
  onClose,
  items,
  onSave,
  typeOptions,
  assignedToOptions,
  statusOptions,
  locationOptions,
}) {
  const [type, setType] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("");
  const [lugarDeCompra, setLugarDeCompra] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset fields when modal opens
      setType("");
      setAssignedTo("");
      setStatus("");
      setLugarDeCompra("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave({
      newType: type,
      newAssignedTo: assignedTo,
      newStatus: status,
      newLugarDeCompra: lugarDeCompra,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Editar {items.length} Productos en Lote</h2>

        <div className="bulk-edit-summary">
          <h3>Productos Seleccionados:</h3>
          <ul>
            {items.map((item) => (
              <li key={item.rowIndex}>{item.Descripción}</li>
            ))}
          </ul>
        </div>

        <div className="form-group">
          <label htmlFor="bulk-type-select">Tipo de Elemento</label>
          <select
            id="bulk-type-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="form-input"
          >
            <option value="">- Cambiar tipo -</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="bulk-assigned-to-select">Asignado a</label>
          <select
            id="bulk-assigned-to-select"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="form-input"
          >
            <option value="">- Cambiar asignado -</option>
            {assignedToOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="bulk-status-select">Estado</label>
          <select
            id="bulk-status-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-input"
          >
            <option value="">- Cambiar estado -</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="bulk-lugarDeCompra-input">Lugar de Compra</label>
          <select
            id="bulk-lugarDeCompra-input"
            value={lugarDeCompra}
            onChange={(e) => setLugarDeCompra(e.target.value)}
            className="form-input"
          >
            <option value="">- Cambiar lugar -</option>
            {locationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button onClick={handleSave} className="form-save-button">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkEditModal;
