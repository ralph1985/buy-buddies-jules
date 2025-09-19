import React, { useState, useEffect, useCallback, useRef } from "react";
import CryptoJS from "crypto-js";
import SummaryModal from "./SummaryModal";
import EditModal from "./EditModal";
import { validateDecimal } from "./utils/validation";

function Spinner() {
  return <div className="spinner"></div>;
}

function Skeleton({ type = "input" }) {
  // type can be 'input' or 'select'
  return <div className={`skeleton skeleton-${type}`}></div>;
}

const processSummaryData = (data) => {
  const boldLabels = [
    "Total presupuesto",
    "Total gastos estimado",
    "Total pagado",
    "Total restante",
  ];

  return data.map((item) => ({
    ...item,
    type: boldLabels.includes(item.label) ? "bold" : "italic",
  }));
};

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [updatingField, setUpdatingField] = useState(null); // { rowIndex, field }
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

      // Create a hash of the items data and store it
      const dataString = JSON.stringify(itemsData);
      const newHash = CryptoJS.SHA256(dataString).toString();
      sessionStorage.setItem("dataHash", newHash);

      setItems(itemsData);
      setStatusOptions(statusOpts.sort());
      setSummaryData(processSummaryData(summaryRes));
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        "No se pudo cargar la lista de la compra. Inténtalo de nuevo más tarde."
      );
    } finally {
      setPageLoading(false);
      setUpdatingField(null);
    }
  }, []);

  useEffect(() => {
    setPageLoading(true);
    fetchData();
  }, [fetchData]);

  // Effect for polling for changes
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("/api?action=get_hash");
        const { hash: newHash } = await response.json();
        const oldHash = sessionStorage.getItem("dataHash");

        if (oldHash && newHash !== oldHash) {
          console.log("Change detected, reloading page...");
          window.location.reload();
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const handleUpdate = async (action, payload, field = null) => {
    // For inline edits, we set the specific field being updated.
    // For modal edits (add/update details), we show the full spinner.
    if (field) {
      setUpdatingField({ rowIndex: payload.rowIndex, field });
    } else {
      setPageLoading(true);
    }

    try {
      await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      await fetchData(); // Refreshes all data
    } catch (error) {
      console.error("Update failed:", error);
      alert(
        "Error: No se pudo realizar la actualización. Por favor, recarga la página."
      );
      // Reset loading states on failure
      if (field) {
        setUpdatingField(null);
      } else {
        setPageLoading(false);
      }
    }
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item); // If item is null, it's for creation
    setIsEditModalOpen(true);
  };

  const handleSaveDetails = (payload) => {
    setIsEditModalOpen(false);
    const action = payload.rowIndex ? "update_details" : "add_product";
    handleUpdate(action, payload); // This will use the full page spinner
  };

  const handleStatusChange = (rowIndex, newStatus) =>
    handleUpdate("update_status", { rowIndex, newStatus }, "status");
  const [quantityValues, setQuantityValues] = useState({});
  const [quantityErrors, setQuantityErrors] = useState({});
  const [unitPriceValues, setUnitPriceValues] = useState({});
  const [unitPriceErrors, setUnitPriceErrors] = useState({});

  useEffect(() => {
    if (items.length > 0) {
      const initialQuantities = {};
      const initialUnitPrices = {};
      items.forEach((item) => {
        initialQuantities[item.rowIndex] = item.Cantidad;
        initialUnitPrices[item.rowIndex] = item["Precio unidad"];
      });
      setQuantityValues(initialQuantities);
      setUnitPriceValues(initialUnitPrices);
    }
  }, [items]);

  const handleQuantityValidation = (
    rowIndex,
    currentValue,
    originalQuantity
  ) => {
    const formattedValue = String(currentValue).replace(".", ",");

    if (formattedValue === "" || !validateDecimal(formattedValue)) {
      const errorMessage = `Valor "${currentValue}" no es válido. Ej: 1,99`;
      setQuantityErrors((prev) => ({ ...prev, [rowIndex]: errorMessage }));
      setTimeout(() => {
        setQuantityValues((prev) => ({
          ...prev,
          [rowIndex]: originalQuantity,
        }));
        setQuantityErrors((prev) => ({ ...prev, [rowIndex]: null }));
      }, 1500);
    } else {
      setQuantityErrors((prev) => ({ ...prev, [rowIndex]: null }));
      if (formattedValue !== originalQuantity) {
        handleUpdate(
          "update_quantity",
          { rowIndex, newQuantity: formattedValue },
          "quantity"
        );
      }
      // Update display to show the comma-separated value
      setQuantityValues((prev) => ({ ...prev, [rowIndex]: formattedValue }));
    }
  };

  const handleUnitPriceValidation = (
    rowIndex,
    currentValue,
    originalPrice
  ) => {
    const formattedValue = String(currentValue).replace(".", ",");

    if (formattedValue === "" || !validateDecimal(formattedValue)) {
      const errorMessage = `Valor "${currentValue}" no es válido. Ej: 1,99`;
      setUnitPriceErrors((prev) => ({ ...prev, [rowIndex]: errorMessage }));
      setTimeout(() => {
        setUnitPriceValues((prev) => ({ ...prev, [rowIndex]: originalPrice }));
        setUnitPriceErrors((prev) => ({ ...prev, [rowIndex]: null }));
      }, 1500);
    } else {
      setUnitPriceErrors((prev) => ({ ...prev, [rowIndex]: null }));
      if (formattedValue !== originalPrice) {
        handleUpdate(
          "update_unit_price",
          { rowIndex, newUnitPrice: formattedValue },
          "unitPrice"
        );
      }
      // Update display to show the comma-separated value
      setUnitPriceValues((prev) => ({ ...prev, [rowIndex]: formattedValue }));
    }
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
  const totalPagadoSabado =
    summaryData.find((item) => item.label === "Total pagado sábado")?.value ||
    "N/A";
  const totalRestanteSabado =
    summaryData.find((item) => item.label === "Total restante sábado")
      ?.value || "N/A";

  return (
    <div className={`app-container ${pageLoading ? "is-loading" : ""}`}>
      {pageLoading && <Spinner />}
      <h1>Lista de la Compra 2025</h1>
      <div className="filters-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={pageLoading}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          disabled={pageLoading}
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
          disabled={pageLoading}
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
          disabled={pageLoading}
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
              disabled={pageLoading}
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
              disabled={pageLoading}
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
          <span className="summary-label">Total pagado sábado</span>
          <span className="summary-value">{totalPagadoSabado}</span>
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
          disabled={pageLoading}
        >
          Ver Resumen Completo
        </button>
      </div>

      {pageLoading && items.length === 0 ? (
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
                {groupItems.map((item) => {
                  const isUpdating =
                    updatingField && updatingField.rowIndex === item.rowIndex;
                  return (
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
                        <div className="item-actions">
                          <div className="editable-field">
                            <label
                              htmlFor={`quantity-${item.rowIndex}`}
                              className="editable-field-label"
                            >
                              Cantidad:
                            </label>
                            {isUpdating &&
                            updatingField.field === "quantity" ? (
                              <Skeleton type="input" />
                            ) : (
                              <input
                                id={`quantity-${item.rowIndex}`}
                                type="text"
                                inputMode="decimal"
                                className={`editable-input ${
                                  quantityErrors[item.rowIndex]
                                    ? "input-error"
                                    : ""
                                }`}
                                value={quantityValues[item.rowIndex] || ""}
                                onChange={(e) =>
                                  setQuantityValues({
                                    ...quantityValues,
                                    [item.rowIndex]: e.target.value,
                                  })
                                }
                                onBlur={(e) =>
                                  handleQuantityValidation(
                                    item.rowIndex,
                                    e.target.value,
                                    item.Cantidad
                                  )
                                }
                                aria-label="Cantidad"
                                disabled={pageLoading || updatingField}
                              />
                            )}
                            {quantityErrors[item.rowIndex] && (
                              <span className="item-error-message">
                                {quantityErrors[item.rowIndex]}
                              </span>
                            )}
                          </div>
                          <div className="editable-field">
                            <label
                              htmlFor={`unit-price-${item.rowIndex}`}
                              className="editable-field-label"
                            >
                              €/ud:
                            </label>
                            {isUpdating &&
                            updatingField.field === "unitPrice" ? (
                              <Skeleton type="input" />
                            ) : (
                              <input
                                id={`unit-price-${item.rowIndex}`}
                                type="text"
                                inputMode="decimal"
                                className={`editable-input ${
                                  unitPriceErrors[item.rowIndex]
                                    ? "input-error"
                                    : ""
                                }`}
                                value={unitPriceValues[item.rowIndex] || ""}
                                onChange={(e) =>
                                  setUnitPriceValues({
                                    ...unitPriceValues,
                                    [item.rowIndex]: e.target.value,
                                  })
                                }
                                onBlur={(e) =>
                                  handleUnitPriceValidation(
                                    item.rowIndex,
                                    e.target.value,
                                    item["Precio unidad"]
                                  )
                                }
                                aria-label="Precio por unidad"
                                disabled={pageLoading || updatingField}
                              />
                            )}
                            {unitPriceErrors[item.rowIndex] && (
                              <span className="item-error-message">
                                {unitPriceErrors[item.rowIndex]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="item-pricing">
                        <span className="item-total">{item.Total}€</span>
                        {isUpdating && updatingField.field === "status" ? (
                          <Skeleton type="select" />
                        ) : (
                          <select
                            className="item-status-select"
                            value={item.Estado || ""}
                            onChange={(e) =>
                              handleStatusChange(item.rowIndex, e.target.value)
                            }
                            disabled={pageLoading || updatingField}
                          >
                            <option value="">- Sin Estado -</option>
                            {item.Estado &&
                              !statusOptions.includes(item.Estado) && (
                                <option value={item.Estado}>
                                  {item.Estado}
                                </option>
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
                        )}
                      </div>
                    </li>
                  );
                })}
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
        disabled={pageLoading}
      >
        +
      </button>
    </div>
  );
}
// No changes needed in the final block, but keeping it for context
export default ShoppingList;
