import React, { useState, useEffect, useCallback } from 'react';
import SummaryModal from './SummaryModal';

function Spinner() {
  return <div className="spinner"></div>;
}

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [itemsData, optionsData, summaryRes] = await Promise.all([
        fetch('/api').then(res => res.json()),
        fetch('/api?action=get_options').then(res => res.json()),
        fetch('/api?action=get_summary').then(res => res.json())
      ]);
      setItems(itemsData);
      setStatusOptions(optionsData.sort());
      setSummaryData(summaryRes);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("No se pudo cargar la lista de la compra. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (action, payload) => {
    setLoading(true);
    try {
      await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      await fetchData();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Error: No se pudo realizar la actualización. Por favor, recarga la página.');
      setLoading(false);
    }
  };

  const handleStatusChange = (rowIndex, newStatus) => handleUpdate('update_status', { rowIndex, newStatus });
  const handleQuantityChange = (rowIndex, newQuantity) => {
    if (newQuantity === '' || isNaN(newQuantity)) return;
    handleUpdate('update_quantity', { rowIndex, newQuantity });
  };

  if (error) return <div className="error">{error}</div>;

  // Safety check to ensure items is an array before proceeding
  if (!Array.isArray(items)) {
    return <div className="loading">Cargando...</div>;
  }

  const filteredItems = items
    .filter(item => item.Descripción?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(item => statusFilter === 'all' || item.Estado === statusFilter);

  const validItems = filteredItems.filter(item => item.Descripción);
  const groupedItems = validItems.reduce((acc, item) => {
    const group = item['Tipo de Elemento'] || 'Otros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const totalPagado = summaryData.find(item => item.label === 'Total pagado')?.value || 'N/A';
  const totalRestante = summaryData.find(item => item.label === 'Total restante')?.value || 'N/A';

  return (
    <div className={`app-container ${loading ? 'is-loading' : ''}`}>
      {loading && <Spinner />}
      <h1>Lista de la Compra 2025</h1>
      <div className="filters-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
        <select
          className="status-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          disabled={loading}
        >
          <option value="all">Todos los estados</option>
          {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>

      <div className="main-summary-container">
        <div className="main-summary-item">
          <span className="main-summary-label">Total Pagado</span>
          <span className="main-summary-value">{totalPagado}</span>
        </div>
        <div className="main-summary-item">
          <span className="main-summary-label">Total Restante</span>
          <span className="main-summary-value">{totalRestante}</span>
        </div>
      </div>

      <div className="summary-link-container">
        <button onClick={() => setIsModalOpen(true)} className="summary-link-button" disabled={loading}>
          Ver Resumen Completo
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="loading">Cargando lista...</div>
      ) : Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <div key={groupName} className="group-container">
            <h2 className="group-header">{groupName}</h2>
            <ul className="shopping-list">
              {groupItems.map(item => (
                <li key={item.rowIndex} className={`shopping-list-item status-${String(item.Estado || '').toLowerCase().replace(/ /g, '-')}`}>
                  <div className="item-details">
                    <span className="item-name">{item.Descripción}</span>
                    <input
                      type="number"
                      className="item-quantity-input"
                      defaultValue={item.Cantidad}
                      onBlur={(e) => handleQuantityChange(item.rowIndex, e.target.value)}
                      aria-label="Cantidad"
                      disabled={loading}
                    />
                  </div>
                  <div className="item-pricing">
                    <span className="item-total">{item.Total}€</span>
                    <select
                      className="item-status-select"
                      value={item.Estado || ''}
                      onChange={(e) => handleStatusChange(item.rowIndex, e.target.value)}
                      disabled={loading}
                    >
                      <option value="">- Sin Estado -</option>
                      {item.Estado && !statusOptions.includes(item.Estado) && (
                        <option value={item.Estado}>{item.Estado}</option>
                      )}
                      {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No se encontraron productos que coincidan con los filtros.</p>
      )}
      <SummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summaryData={summaryData}
        isLoading={false}
      />
    </div>
  );
}

export default ShoppingList;
