import React, { useState, useEffect } from "react";

function EditModal({
  isOpen,
  onClose,
  itemData,
  onSave,
  typeOptions,
  whenOptions,
}) {
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [type, setType] = useState("");
  const [when, setWhen] = useState("");

  // When the modal opens or itemData changes, populate the form.
  // If itemData is null (for creating a new item), it resets the form.
  useEffect(() => {
    if (isOpen && itemData) {
      setDescription(itemData.Descripción || "");
      setNotes(itemData.Notas || "");
      setUnitPrice(itemData["Precio unidad"] || "");
      setType(itemData["Tipo de Elemento"] || "");
      setWhen(itemData["¿Cúando se compra?"] || "");
    } else {
      // Reset form for new product
      setDescription("");
      setNotes("");
      setUnitPrice("");
      setType("");
      setWhen("");
    }
  }, [isOpen, itemData]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    // Pass rowIndex if it exists (for edits), otherwise it's undefined (for adds)
    onSave({
      rowIndex: itemData?.rowIndex,
      newDescription: description,
      newNotes: notes,
      newUnitPrice: unitPrice,
      newType: type,
      newWhen: when,
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-button"
          onClick={onClose}
        >
          &times;
        </button>
        <h2>{itemData ? "Editar Producto" : "Añadir Nuevo Producto"}</h2>
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
          <label htmlFor="type-select">Tipo de Elemento</label>
          <select
            id="type-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="form-input"
          >
            <option value="">- Seleccionar tipo -</option>
            {typeOptions.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="when-select">¿Cuándo se compra?</label>
          <select
            id="when-select"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="form-input"
          >
            <option value="">- Seleccionar fecha -</option>
            {whenOptions.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="unitprice-input">Precio unidad</label>
          <input
            id="unitprice-input"
            type="text"
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
          <button
            onClick={handleSave}
            className="form-save-button"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
