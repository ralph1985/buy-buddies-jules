import React from 'react';

function HelpModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ayuda de la Aplicación</h2>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="help-content">
          <h4>¿Cómo funciona?</h4>
          <p>Esta aplicación te permite gestionar una lista de la compra de forma colaborativa y en tiempo real.</p>

          <h4>Permisos de Usuario</h4>
          <p><strong>Sin iniciar sesión:</strong> Puedes ver la lista de productos y usar los filtros, pero no puedes añadir, editar o eliminar productos.</p>
          <p><strong>Con la sesión iniciada:</strong> Tienes acceso completo para añadir, editar y eliminar productos, así como para realizar ediciones múltiples.</p>

          <h4>Filtros</h4>
          <p>Puedes filtrar los productos por nombre, estado, tipo, lugar de compra o persona asignada. Usa el menú de filtros para acotar tu búsqueda. También puedes agrupar los productos por diferentes criterios para una mejor visualización.</p>

          <h4>Editar y Añadir Productos (con sesión iniciada)</h4>
          <p>Para añadir un nuevo producto, pulsa el botón `+` flotante. Para editar un producto existente, haz clic sobre su nombre. También puedes editar rápidamente la cantidad y el precio por unidad directamente en la lista.</p>

          <h4>Edición Múltiple (con sesión iniciada)</h4>
          <p>Selecciona varios productos marcando las casillas de verificación a la izquierda. Aparecerá un botón de edición (✏️) que te permitirá modificar todos los productos seleccionados a la vez.</p>

          <h4>Resumen</h4>
          <p>Haz clic en "Ver Resumen Completo" para obtener un desglose de los gastos. Puedes fijar las categorías que más te interesen para tenerlas siempre a la vista en el panel principal.</p>

          <h4>Sincronización</h4>
          <p>La lista se actualiza automáticamente cada 30 segundos. También puedes forzar una actualización con el botón "Actualizar".</p>
        </div>
        <div className="form-actions">
          <button className="summary-link-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
