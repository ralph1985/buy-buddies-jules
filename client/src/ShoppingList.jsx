import React, { useState, useEffect } from 'react';

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // The API endpoint is relative, which will be correctly proxied by Vite's dev server
    // and handled by Vercel's rewrites in production.
    fetch('/api')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Assuming the data is an array of objects from the Google Sheet
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError("No se pudo cargar la lista de la compra. Inténtalo de nuevo más tarde.");
        setLoading(false);
      });
  }, []); // The empty dependency array ensures this effect runs only once on mount

  if (loading) {
    return <div className="loading">Cargando lista...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <h1>Lista de la Compra 2025</h1>
      <ul className="shopping-list">
        {items.length > 0 ? items.map((item, index) => (
          // Assuming the sheet has 'Producto' and 'Cantidad' columns.
          // Using index as a key is okay here because the list is read-only.
          <li key={index} className="shopping-list-item">
            <span className="item-name">{item.Producto || 'Sin nombre'}</span>
            <span className="item-quantity">{item.Cantidad || ''}</span>
          </li>
        )) : (
          <p>La lista de la compra está vacía.</p>
        )}
      </ul>
    </div>
  );
}

export default ShoppingList;
