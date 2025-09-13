import React, { useState, useEffect } from 'react';

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError("No se pudo cargar la lista de la compra. Inténtalo de nuevo más tarde.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Cargando lista...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Filter out empty rows where 'Descripción' is missing, as these are separators in the sheet
  const validItems = items.filter(item => item.Descripción);

  // Group items by "Tipo de Elemento"
  const groupedItems = validItems.reduce((acc, item) => {
    const group = item['Tipo de Elemento'] || 'Otros'; // Default to 'Otros' if type is missing
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div>
      <h1>Lista de la Compra 2025</h1>
      {Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <div key={groupName} className="group-container">
            <h2 className="group-header">{groupName}</h2>
            <ul className="shopping-list">
              {groupItems.map((item, index) => (
                <li key={index} className={`shopping-list-item status-${item.Estado?.toLowerCase().replace(' ', '-')}`}>
                  <div className="item-details">
                    <span className="item-name">{item.Descripción}</span>
                    <span className="item-quantity">Cantidad: {item.Cantidad || 'N/A'}</span>
                  </div>
                  <div className="item-pricing">
                    <span className="item-total">{item.Total}€</span>
                    <span className="item-status">{item.Estado}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>La lista de la compra está vacía.</p>
      )}
    </div>
  );
}

export default ShoppingList;
