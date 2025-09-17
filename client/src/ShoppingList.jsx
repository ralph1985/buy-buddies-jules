import React, { useState, useEffect, useCallback } from "react";
import SummaryModal from "./SummaryModal";
import EditModal from "./EditModal";

function Spinner() {
  return <div className="spinner"></div>;
}

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [whenFilter, setWhenFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("type"); // 'type' or 'when'

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [itemsData, statusOpts, summaryRes] = await Promise.all([
        fetch("/api").then((res) => res.json()),
        fetch("/api?action=get_options").then((res) => res.json()),
        fetch("/api?action=get_summary").then((res) => res.json()),
      ]);
      setItems(itemsData);
      setStatusOptions(statusOpts.sort());
      setSummaryData(summaryRes);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        "No se pudo cargar la lista de la compra. Inténtalo de nuevo más tarde."
      );
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
      await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      await fetchData();
    } catch (error) {
      console.error("Update failed:", error);
      alert(
        "Error: No se pudo realizar la actualización. Por favor, recarga la página."
      );
      setLoading(false);
    }
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item); // If item is null, it's for creation
    setIsEditModalOpen(true);
  };

  const handleSaveDetails = (payload) => {
    setIsEditModalOpen(false);
    // If rowIndex exists, it's an update; otherwise, it's an add.
    const action = payload.rowIndex ? "update_details" : "add_product";
    handleUpdate(action, payload);
  };

  const handleStatusChange = (rowIndex, newStatus) =>
    handleUpdate("update_status", { rowIndex, newStatus });
  const handleQuantityChange = (rowIndex, newQuantity) => {
    if (newQuantity === "" || isNaN(newQuantity)) return;
    handleUpdate("update_quantity", { rowIndex, newQuantity });
  };

  if (error) return <div className="error">{error}</div>;

  if (!Array.isArray(items)) {
    return <div className="loading">Cargando...</div>;
  }

  const filteredItems = items
    .filter((item) =>
      item.Descripción?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) => statusFilter === "all" || item.Estado === statusFilter)
    .filter(
      (item) => typeFilter === "all" || item["Tipo de Elemento"] === typeFilter
    )
    .filter(
      (item) =>
        whenFilter === "all" || item["¿Cuándo se compra?"] === whenFilter
    );

  const validItems = filteredItems.filter((item) => item.Descripción);

  const whenOptions = [
    ...new Set(items.map((item) => item["¿Cuándo se compra?"]).filter(Boolean)),
  ].sort();
  const typeOptions = [
    ...new Set(items.map((item) => item["Tipo de Elemento"]).filter(Boolean)),
  ].sort();

  const groupedItems = validItems.reduce((acc, item) => {
    let group;
    if (groupBy === "type") {
      group = item["Tipo de Elemento"] || "Otros";
    } else {
      // groupBy === 'when'
      group = item["¿Cuándo se compra?"] || "Sin fecha";
    }
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const totalPagado =
    summaryData.find((item) => item.label === "Total pagado")?.value || "N/A";
  const totalRestante =
    summaryData.find((item) => item.label === "Total restante")?.value || "N/A";
  const totalRestanteSabado =
    summaryData.find((item) => item.label === "Total restante sábado")
      ?.value || "N/A";

  return (
    <div className={`app-container ${loading ? "is-loading" : ""}`}>
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
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          disabled={loading}
        >
          <option value="all">Todos los estados</option>
          {statusOptions.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          disabled={loading}
        >
          <option value="all">Todos los tipos</option>
          {typeOptions.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={whenFilter}
          onChange={(e) => setWhenFilter(e.target.value)}
          disabled={loading}
        >
          <option value="all">Todas las fechas</option>
          {whenOptions.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <div className="grouping-container">
          <span className="grouping-label">Agrupar por:</span>
          <label>
            <input
              type="radio"
              name="groupBy"
              value="type"
              checked={groupBy === "type"}
              onChange={(e) => setGroupBy(e.target.value)}
              disabled={loading}
            />
            Tipo
          </label>
          <label>
            <input
              type="radio"
              name="groupBy"
              value="when"
              checked={groupBy === "when"}
              onChange={(e) => setGroupBy(e.target.value)}
              disabled={loading}
            />
            Fecha
          </label>
        </div>
      </div>

      <div className="main-summary-container">
        <div className="summary-item">
          <span className="summary-label">Total restante</span>
          <span className="summary-value">{totalRestante}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total pagado</span>
          <span className="summary-value">{totalPagado}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total restante sábado</span>
          <span className="summary-value">{totalRestanteSabado}</span>
        </div>
      </div>

      <div className="summary-link-container">
        <button
          onClick={() => setIsSummaryModalOpen(true)}
          className="summary-link-button"
          disabled={loading}
        >
          Ver Resumen Completo
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="loading">Cargando lista...</div>
      ) : Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([groupName, groupItems]) => {
          const groupTotal = groupItems.reduce(
            (sum, item) =>
              sum + (Number(String(item.Total).replace(",", ".")) || 0),
            0
          );
          return (
            <div
              key={groupName}
              className="group-container"
            >
              <h2 className="group-header">
                <span>{groupName}</span>
                <span className="group-total">
                  {groupTotal.toFixed(2).replace(".", ",")}€
                </span>
              </h2>
              <ul className="shopping-list">
                {groupItems.map((item) => (
                  <li
                    key={item.rowIndex}
                  className={`shopping-list-item status-${String(
                    item.Estado || ""
                  )
                    .toLowerCase()
                    .replace(/ /g, "-")}`}
                >
                  <div className="item-details">
                    <span
                      className="item-name"
                      onClick={() => handleOpenEditModal(item)}
                    >
                      {item.Descripción}
                    </span>
                    {item.Notas && (
                      <span className="item-notes">{item.Notas}</span>
                    )}
                    <input
                      type="number"
                      className="item-quantity-input"
                      defaultValue={item.Cantidad}
                      onBlur={(e) =>
                        handleQuantityChange(item.rowIndex, e.target.value)
                      }
                      aria-label="Cantidad"
                      disabled={loading}
                    />
                  </div>
                  <div className="item-pricing">
                    <span className="item-total">{item.Total}€</span>
                    {item["Precio unidad"] && (
                      <span className="item-unit-price">
                        ({item["Precio unidad"]}€/ud.)
                      </span>
                    )}
                    <select
                      className="item-status-select"
                      value={item.Estado || ""}
                      onChange={(e) =>
                        handleStatusChange(item.rowIndex, e.target.value)
                      }
                      disabled={loading}
                    >
                      <option value="">- Sin Estado -</option>
                      {item.Estado && !statusOptions.includes(item.Estado) && (
                        <option value={item.Estado}>{item.Estado}</option>
                      )}
                      {statusOptions.map((option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          );
        })
      ) : (
        <p>No se encontraron productos que coincidan con los filtros.</p>
      )}
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryData={summaryData}
        isLoading={false}
      />
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        itemData={editingItem}
        onSave={handleSaveDetails}
        typeOptions={typeOptions}
        whenOptions={whenOptions}
      />
      <button
        className="fab-add-button"
        onClick={() => handleOpenEditModal(null)}
        disabled={loading}
      >
        +
      </button>
    </div>
  );
}

export default ShoppingList;
