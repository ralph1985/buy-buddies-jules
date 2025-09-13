import React, { useState, useEffect } from 'react';

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api').then(res => res.json()),
      fetch('/api?action=get_options').then(res => res.json())
    ])
    .then(([itemsData, optionsData]) => {
      setItems(itemsData);
      setStatusOptions(optionsData);
      setLoading(false);
    })
    .catch(err => {
      console.error("Fetch error:", err);
      setError("No se pudo cargar la lista de la compra. Inténtalo de nuevo más tarde.");
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (rowIndex, newStatus) => {
    const originalItems = [...items];
    const updatedItems = items.map(item =>
      item.rowIndex === rowIndex ? { ...item, Estado: newStatus } : item
    );
    setItems(updatedItems);

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex, newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status in Google Sheet.');
      }
    } catch (error) {
      console.error('Update failed:', error);
      setItems(originalItems);
      alert('Error: No se pudo actualizar el estado. Por favor, recarga la página.');
    }
  };

  if (loading) {
    return <div className="loading">Cargando lista...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Filter items based on the search term before grouping
  const filteredItems = items.filter(item =>
    item.Descripción?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validItems = filteredItems.filter(item => item.Descripción);
  const groupedItems = validItems.reduce((acc, item) => {
    const group = item['Tipo de Elemento'] || 'Otros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div>
      <h1>Lista de la Compra 2025</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <div key={groupName} className="group-container">
            <h2 className="group-header">{groupName}</h2>
            <ul className="shopping-list">
              {groupItems.map(item => (
                <li key={item.rowIndex} className={`shopping-list-item status-${item.Estado?.toLowerCase().replace(' ', '-')}`}>
                  <div className="item-details">
                    <span className="item-name">{item.Descripción}</span>
                    <span className="item-quantity">Cantidad: {item.Cantidad || 'N/A'}</span>
                  </div>
                  <div className="item-pricing">
                    <span className="item-total">{item.Total}€</span>
                    <select
                      className="item-status-select"
                      value={item.Estado}
                      onChange={(e) => handleStatusChange(item.rowIndex, e.target.value)}
                    >
                      {item.Estado && !statusOptions.includes(item.Estado) && (
                        <option value={item.Estado}>{item.Estado}</option>
                      )}
                      {statusOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No se encontraron productos.</p>
      )}
    </div>
  );
}

export default ShoppingList;
