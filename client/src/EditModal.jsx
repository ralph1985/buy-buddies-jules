import React, { useState, useEffect } from 'react';

function EditModal({ isOpen, onClose, itemData, onSave }) {
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  // When the modal opens, populate the form with the item's current data
  useEffect(() => {
    if (itemData) {
      setDescription(itemData.Descripción || '');
      setNotes(itemData.Notas || '');
      setUnitPrice(itemData['Precio unidad'] || '');
    }
  }, [itemData]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    // Pass all three values back to the parent
    onSave(itemData.rowIndex, description, notes, unitPrice);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Editar Producto</h2>
        <div className="form-group">
          <label htmlFor="description-input">Descripción</label>
          <input
            id="description-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="unitprice-input">Precio unidad</label>
          <input
            id="unitprice-input"
            type="text" // Use text to allow for currency symbols or commas
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="notes-textarea">Notas</label>
          <textarea
            id="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-textarea"
            rows="4"
          />
        </div>
        <div className="form-actions">
          <button onClick={handleSave} className="form-save-button">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
