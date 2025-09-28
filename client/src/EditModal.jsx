import React, { useState, useEffect } from "react";
import { validateDecimal } from "./utils/validation";

function EditModal({
  isOpen,
  onClose,
  itemData,
  onSave,
  typeOptions,
  assignedToOptions,
}) {
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [lugarDeCompra, setLugarDeCompra] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (itemData) {
        setDescription(itemData.Descripción || "");
        setNotes(itemData.Notas || "");
        setUnitPrice(itemData["Precio unidad"] || "");
        setQuantity(itemData.Cantidad || "1");
        setType(itemData["Tipo de Elemento"] || "");
        setAssignedTo(itemData["Asignado a"] || "");
        setLugarDeCompra(itemData["Lugar de Compra"] || "");
      } else {
        setDescription("");
        setNotes("");
        setUnitPrice("");
        setQuantity("1");
        setType("");
        setAssignedTo("");
        setLugarDeCompra("");
      }
      setErrors({}); // Reset errors when modal opens
    }
  }, [isOpen, itemData]);

  if (!isOpen) {
    return null;
  }

  const validateField = (name, value) => {
    if (value !== "" && !validateDecimal(value)) {
      setErrors((prev) => ({
        ...prev,
        [name]: `Formato inválido. Ej: 1, 1,99.`,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSave = () => {
    // Final validation before saving
    const finalErrors = {};
    if (unitPrice !== "" && !validateDecimal(unitPrice)) {
      finalErrors.unitPrice = "Formato de precio inválido.";
    }
    if (quantity !== "" && !validateDecimal(quantity)) {
      finalErrors.quantity = "Formato de cantidad inválido.";
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    onSave({
      rowIndex: itemData?.rowIndex,
      newDescription: description,
      newNotes: notes,
      newUnitPrice: unitPrice,
      newQuantity: quantity,
      newType: type,
      newAssignedTo: assignedTo,
      newLugarDeCompra: lugarDeCompra,
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
            required
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
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="assigned-to-select">Asignado a</label>
          <select
            id="assigned-to-select"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="form-input"
          >
            <option value="">- Asignar a -</option>
            {assignedToOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="lugarDeCompra-input">Lugar de Compra</label>
          <input
            id="lugarDeCompra-input"
            type="text"
            value={lugarDeCompra}
            onChange={(e) => setLugarDeCompra(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="quantity-input">Cantidad</label>
          <input
            id="quantity-input"
            type="text"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={(e) => validateField("quantity", e.target.value)}
            className={`form-input ${errors.quantity ? "input-error" : ""}`}
          />
          {errors.quantity && (
            <span className="item-error-message">{errors.quantity}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="unitprice-input">Precio unidad</label>
          <input
            id="unitprice-input"
            type="text"
            inputMode="decimal"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            onBlur={(e) => validateField("unitPrice", e.target.value)}
            className={`form-input ${errors.unitPrice ? "input-error" : ""}`}
          />
          {errors.unitPrice && (
            <span className="item-error-message">{errors.unitPrice}</span>
          )}
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
            disabled={!description || errors.quantity || errors.unitPrice}
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
