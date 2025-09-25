import React, { useState, useEffect, useCallback, useRef } from "react";
import CryptoJS from "crypto-js";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import SummaryModal from "./SummaryModal";
import EditModal from "./EditModal";
import BulkEditModal from "./BulkEditModal";
import ChangesModal from "./ChangesModal";
import LogoutModal from "./LogoutModal";
import HelpModal from "./HelpModal"; // Import the new modal
import { trackEvent } from './analytics';
import { validateDecimal } from "./utils/validation";
import { usePrevious } from './hooks/usePrevious';

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

function ShoppingList({ user, onLogout, onLoginRedirect, onOpenCookieSettings }) {
  const [items, setItems] = useState([]);
  const [pageTitle, setPageTitle] = useState("Lista de la Compra");
  const [statusOptions, setStatusOptions] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [updatingField, setUpdatingField] = useState(null); // { rowIndex, field }
  const [error, setError] = useState(null);
  const [searchTags, setSearchTags] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [assignedToFilter, setAssignedToFilter] = useState([]);
  const [locationFilter, setLocationFilter] = useState([]);
  const [groupBy, setGroupBy] = useState("assignedTo"); // 'type', 'assignedTo', 'status', 'place'
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [pinnedSummaryItems, setPinnedSummaryItems] = useState(() => {
    const saved = localStorage.getItem("pinnedSummaryItems");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      "Total presupuesto",
      "Total restante",
    ];
  });

  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false); // State for help modal
  const [changes, setChanges] = useState({ added: [], edited: [], deleted: [] });
  const isLocalUpdate = useRef(false);
  const isInitialRender = useRef(true);
  const urlFiltersApplied = useRef(false);
  const prevUser = usePrevious(user);

  const fetchData = useCallback(async () => {
    try {
      const [itemsData, statusOpts, summaryRes, titleRes] = await Promise.all([
        fetch("/api").then((res) => res.json()),
        fetch("/api?action=get_options").then((res) => res.json()),
        fetch("/api?action=get_summary").then((res) => res.json()),
        fetch("/api?action=get_sheet_title").then((res) => res.json()),
      ]);

      setPageTitle(titleRes.title || "Lista de la Compra");

      const oldItems = JSON.parse(localStorage.getItem("items") || "[]");

      if (!isLocalUpdate.current && oldItems.length > 0) {
        const newItems = itemsData;
        const oldItemsMap = new Map(oldItems.map(item => [item.rowIndex, item]));
        const newItemsMap = new Map(newItems.map(item => [item.rowIndex, item]));

        const added = newItems.filter(item => !oldItemsMap.has(item.rowIndex));
        const deleted = oldItems.filter(item => !newItemsMap.has(item.rowIndex));
        const edited = newItems
          .map(newItem => {
            if (!oldItemsMap.has(newItem.rowIndex)) return null;

            const oldItem = oldItemsMap.get(newItem.rowIndex);
            const changedFields = [];

            // We can add fields to ignore in the comparison
            const fieldsToIgnore = ["rowIndex", "Total"];

            const allKeys = new Set([...Object.keys(oldItem), ...Object.keys(newItem)]);

            allKeys.forEach(key => {
              if (fieldsToIgnore.includes(key)) return;

              const oldValue = oldItem[key] || "";
              const newValue = newItem[key] || "";

              if (String(oldValue) !== String(newValue)) {
                changedFields.push({
                  field: key,
                  from: oldValue,
                  to: newValue,
                });
              }
            });

            if (changedFields.length > 0) {
              return {
                ...newItem,
                changedFields,
              };
            }

            return null;
          })
          .filter(Boolean);

        if (added.length > 0 || deleted.length > 0 || edited.length > 0) {
          setChanges({ added, edited, deleted });
          setIsChangesModalOpen(true);
          trackEvent('Modal', 'Open', 'Detected Changes');
        }
      } else {
        // If it's a local update or first load, just update localStorage
        localStorage.setItem("items", JSON.stringify(itemsData));
      }

      // Create a hash of the items data and store it
      const dataString = JSON.stringify(itemsData);
      const newHash = CryptoJS.SHA256(dataString).toString();
      localStorage.setItem("dataHash", newHash);

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
      isLocalUpdate.current = false; // Reset the flag
    }
  }, []);

  useEffect(() => {
    setPageLoading(true);
    fetchData();
  }, [fetchData]);

  // Load filters from URL on initial render
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const status = params.get('status');
    const type = params.get('type');
    const assignedTo = params.get('assignedTo');
    const location = params.get('location');
    const groupByParam = params.get('groupBy');

    if (search || status || type || assignedTo || location || groupByParam) {
      if (search) setSearchTags(search.split(',').map(val => ({ label: val, value: val })));
      if (status) setStatusFilter(status.split(',').map(val => ({ label: val, value: val })));
      if (type) setTypeFilter(type.split(',').map(val => ({ label: val, value: val })));
      if (assignedTo) setAssignedToFilter(assignedTo.split(',').map(val => ({ label: val, value: val })));
      if (location) setLocationFilter(location.split(',').map(val => ({ label: val, value: val })));
      if (groupByParam) setGroupBy(groupByParam);
      urlFiltersApplied.current = true;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to apply default user filter on login
  useEffect(() => {
    if (user && user['Filtro por defecto'] && !urlFiltersApplied.current) {
      try {
        const defaultFilter = JSON.parse(user['Filtro por defecto']);

        // Explicitly set each filter based on the default settings or reset it.
        // This avoids race conditions from clearing and then setting state.

        setGroupBy(defaultFilter['Agrupado por'] || 'assignedTo');

        const assignedTo = defaultFilter['Asignar a'];
        setAssignedToFilter(assignedTo ? [{ value: assignedTo, label: assignedTo }] : []);

        const status = defaultFilter['Estado'];
        setStatusFilter(status ? [{ value: status, label: status }] : []);

        const type = defaultFilter['Tipo de Elemento'];
        setTypeFilter(type ? [{ value: type, label: type }] : []);

        const location = defaultFilter['Lugar de Compra'];
        setLocationFilter(location ? [{ value: location, label: location }] : []);

        // Always reset search tags as they are not part of the default filter
        setSearchTags([]);

      } catch (e) {
        console.error("Failed to parse or apply default filter:", e);
        // If parsing fails, just clear all filters to ensure a clean state.
        handleClearFilters();
      }
    } else if (!user && prevUser) {
      // If user logs out, clear all filters.
      handleClearFilters();
    }
  }, [user, prevUser]); // This effect runs when the user logs in or out

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const filters = {
      search: searchTags.map(t => t.value).join(','),
      status: statusFilter.map(f => f.value).join(','),
      type: typeFilter.map(f => f.value).join(','),
      assignedTo: assignedToFilter.map(f => f.value).join(','),
      location: locationFilter.map(f => f.value).join(','),
    };

    const changedFilters = Object.entries(filters)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    if (changedFilters) {
      trackEvent('Interaction', 'Apply Filter', changedFilters);
    }

    const params = new URLSearchParams();
    if (searchTags.length > 0) params.set('search', searchTags.map(t => t.value).join(','));
    if (statusFilter.length > 0) params.set('status', statusFilter.map(f => f.value).join(','));
    if (typeFilter.length > 0) params.set('type', typeFilter.map(f => f.value).join(','));
    if (assignedToFilter.length > 0) params.set('assignedTo', assignedToFilter.map(f => f.value).join(','));
    if (locationFilter.length > 0) params.set('location', locationFilter.map(f => f.value).join(','));
    if (groupBy) params.set('groupBy', groupBy);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
    // Note: Clearing filters is tracked in its own handler for accuracy.
  }, [searchTags, statusFilter, typeFilter, assignedToFilter, locationFilter, groupBy]);


  // Effect for polling for changes
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          // When countdown reaches zero, check for hash changes
          (async () => {
            try {
              const response = await fetch("/api?action=get_hash");
              const { hash: newHash } = await response.json();
              const oldHash = localStorage.getItem("dataHash");

              if (oldHash && newHash !== oldHash) {
                console.log("Change detected, refreshing data...");
                isLocalUpdate.current = false; // This is an external change
                await fetchData(); // Soft refresh
              }
            } catch (error) {
              console.error("Polling error:", error);
            }
          })();
          return 30; // Reset countdown
        }
        return prevCountdown - 1;
      });
    }, 1000); // Tick every second

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchData]);

  const handleUpdate = async (action, payload, field = null) => {
    if (!user) return; // Do not allow updates if not logged in
    isLocalUpdate.current = true;
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
        body: JSON.stringify({ action, ...payload, user: user['Miembro'] }),
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

  const handleManualRefresh = async () => {
    trackEvent('Interaction', 'Click', 'Manual Refresh');
    setPageLoading(true);
    await fetchData();
    setCountdown(30); // Reset countdown on manual refresh
  };

  const handleClearFilters = () => {
    trackEvent('Interaction', 'Click', 'Clear Filters');
    setSearchTags([]);
    setStatusFilter([]);
    setTypeFilter([]);
    setAssignedToFilter([]);
    setLocationFilter([]);
    setGroupBy("assignedTo");
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item); // If item is null, it's for creation
    setIsEditModalOpen(true);
    trackEvent('Modal', 'Open', item ? 'Edit Item' : 'Create Item');
  };

  const handleOpenBulkEditModal = () => {
    setIsBulkEditModalOpen(true);
    trackEvent('Modal', 'Open', 'Bulk Edit');
  };

  const handleSelectItem = (rowIndex) => {
    setSelectedItems((prev) =>
      prev.includes(rowIndex)
        ? prev.filter((id) => id !== rowIndex)
        : [...prev, rowIndex]
    );
  };

  const handleSelectGroup = (groupItems, isSelected) => {
    const groupRowIndexes = groupItems.map((item) => item.rowIndex);
    if (isSelected) {
      setSelectedItems((prev) => [...new Set([...prev, ...groupRowIndexes])]);
    } else {
      setSelectedItems((prev) =>
        prev.filter((rowIndex) => !groupRowIndexes.includes(rowIndex))
      );
    }
  };

  const handleSaveDetails = (payload) => {
    setIsEditModalOpen(false);
    const action = payload.rowIndex ? "update_details" : "add_product";
    handleUpdate(action, payload); // This will use the full page spinner
  };

  const handleBulkUpdate = (payload) => {
    setIsBulkEditModalOpen(false);
    handleUpdate("bulk_update", { ...payload, rowIndexes: selectedItems });
    setSelectedItems([]);
  };

  const handlePinnedSummaryChange = (label, isPinned) => {
    const newPinnedItems = isPinned
      ? [...pinnedSummaryItems, label]
      : pinnedSummaryItems.filter((itemLabel) => itemLabel !== label);
    setPinnedSummaryItems(newPinnedItems);
    localStorage.setItem("pinnedSummaryItems", JSON.stringify(newPinnedItems));
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

  const handleUnitPriceValidation = (rowIndex, currentValue, originalPrice) => {
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

  const renderFilterMenu = () => (
    <>
      <div
        className={`filter-menu-overlay ${isFilterMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsFilterMenuOpen(false)}
      ></div>
      <div className={`filter-menu ${isFilterMenuOpen ? "is-open" : ""}`}>
        <div className="filters-container">
          <CreatableSelect
            isMulti
            isClearable
            placeholder="Buscar productos..."
          className="filter-select"
          classNamePrefix="select"
          onChange={setSearchTags}
          value={searchTags}
          isDisabled={pageLoading}
          styles={customStyles}
          noOptionsMessage={() => "Escribe para añadir un producto"}
          formatCreateLabel={(inputValue) => `Añadir "${inputValue}"`}
        />
        <Select
          isMulti
          options={statusOptionsFormatted}
          className="filter-select"
          classNamePrefix="select"
          placeholder="Todos los estados"
          onChange={setStatusFilter}
          value={statusFilter}
          isDisabled={pageLoading}
          styles={customStyles}
        />

        <Select
          isMulti
          options={typeOptions}
          className="filter-select"
          classNamePrefix="select"
          placeholder="Todos los tipos"
          onChange={setTypeFilter}
          value={typeFilter}
          isDisabled={pageLoading}
          styles={customStyles}
        />

        <Select
          isMulti
          options={locationOptions}
          className="filter-select"
          classNamePrefix="select"
          placeholder="Todos los lugares"
          onChange={setLocationFilter}
          value={locationFilter}
          isDisabled={pageLoading}
          styles={customStyles}
        />

        <Select
          isMulti
          options={assignedToOptions}
          className="filter-select"
          classNamePrefix="select"
          placeholder="Asignar a"
          onChange={setAssignedToFilter}
          value={assignedToFilter}
          isDisabled={pageLoading}
          styles={customStyles}
        />

        <div className="grouping-container">
          <span className="grouping-label">Agrupar por:</span>
          <label>
            <input
              type="radio"
              name="groupBy"
              value="status"
              checked={groupBy === "status"}
              onChange={(e) => {
                setGroupBy(e.target.value);
                trackEvent('Interaction', 'Group By', e.target.value);
              }}
              disabled={pageLoading}
              className="custom-form-control"
            />
            Estado
          </label>
          <label>
            <input
              type="radio"
              name="groupBy"
              value="type"
              checked={groupBy === "type"}
              onChange={(e) => {
                setGroupBy(e.target.value);
                trackEvent('Interaction', 'Group By', e.target.value);
              }}
              disabled={pageLoading}
              className="custom-form-control"
            />
            Tipo
          </label>
          <label>
            <input
              type="radio"
              name="groupBy"
              value="place"
              checked={groupBy === "place"}
              onChange={(e) => {
                setGroupBy(e.target.value);
                trackEvent('Interaction', 'Group By', e.target.value);
              }}
              disabled={pageLoading}
              className="custom-form-control"
            />
            Lugar
          </label>
          <label>
            <input
              type="radio"
              name="groupBy"
              value="assignedTo"
              checked={groupBy === "assignedTo"}
              onChange={(e) => {
                setGroupBy(e.target.value);
                trackEvent('Interaction', 'Group By', e.target.value);
              }}
              disabled={pageLoading}
              className="custom-form-control"
            />
            Asignado a
          </label>
        </div>
        </div>
        <div className="filter-menu-actions">
          <div className="clear-filters-container">
            <button onClick={handleClearFilters} className="summary-link-button">
              Limpiar filtros
            </button>
          </div>
          <div className="cookie-settings-container desktop-only">
            <button onClick={onOpenCookieSettings} className="summary-link-button">
              Configurar cookies
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsFilterMenuOpen(false)}
          className="close-menu-button"
        >
          Cerrar
        </button>
      </div>
    </>
  );

  if (error) return <div className="error">{error}</div>;

  if (!Array.isArray(items)) {
    return <div className="loading">Cargando...</div>;
  }

  const filteredItems = items
    .filter((item) => {
      if (searchTags.length === 0) return true;
      return searchTags.some((tag) =>
        item.Descripción?.toLowerCase().includes(tag.value.toLowerCase())
      );
    })
    .filter(
      (item) =>
        statusFilter.length === 0 ||
        statusFilter.some((filter) => filter.value === item.Estado)
    )
    .filter(
      (item) =>
        typeFilter.length === 0 ||
        typeFilter.some((filter) => filter.value === item["Tipo de Elemento"])
    )
    .filter(
      (item) =>
        assignedToFilter.length === 0 ||
        assignedToFilter.some((filter) => filter.value === item["Asignado a"])
    )
    .filter(
      (item) =>
        locationFilter.length === 0 ||
        locationFilter.some(
          (filter) => filter.value === item["Lugar de Compra"]
        )
    );

  const validItems = filteredItems.filter((item) => item.Descripción);

  const assignedToOptions = [
    ...new Set(items.map((item) => item["Asignado a"]).filter(Boolean)),
  ].sort().map(option => ({ value: option, label: option }));

  const typeOptions = [
    ...new Set(items.map((item) => item["Tipo de Elemento"]).filter(Boolean)),
  ].sort().map(option => ({ value: option, label: option }));

  const locationOptions = [
    ...new Set(items.map((item) => item["Lugar de Compra"]).filter(Boolean)),
  ].sort().map(option => ({ value: option, label: option }));

  const statusOptionsFormatted = statusOptions.map(option => ({ value: option, label: option }));

  const groupedItems = validItems.reduce((acc, item) => {
    let group;
    if (groupBy === "type") {
      group = item["Tipo de Elemento"] || "Otros";
    } else if (groupBy === "status") {
      group = item.Estado || "Sin estado";
    } else if (groupBy === "place") {
      group = item["Lugar de Compra"] || "Lugar sin especificar";
    } else {
      // groupBy === 'assignedTo'
      group = item["Asignado a"] || "Sin asignar";
    }
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#2c2c2c',
      borderColor: state.isFocused ? '#ffa500' : '#555',
      boxShadow: state.isFocused ? '0 0 0 1px #ffa500' : 'none',
      '&:hover': {
        borderColor: '#ffa500',
      },
      marginBottom: '0.5rem',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#2c2c2c',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#ffa500' : state.isFocused ? '#444' : '#2c2c2c',
      color: state.isSelected ? '#1a1a1a' : 'white',
      '&:active': {
        backgroundColor: '#ffa500',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#444',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#ccc',
      '&:hover': {
        backgroundColor: '#ffa500',
        color: 'white',
      },
    }),
    input: (provided) => ({
      ...provided,
      color: 'white',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#ccc',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white',
    }),
  };

  return (
    <div className={`app-container ${pageLoading ? "is-loading" : ""}`}>
      {pageLoading && <Spinner />}
      <div className="header-container">
        <div className="header-left">
          <img
            src="/logo.png"
            alt="Logo"
            className="header-logo"
          />
          <h1>{pageTitle}</h1>
        </div>
        <div className="user-info">
          {user ? (
            <>
              {/* Display the member's name from the user object */}
              <span>{user['Miembro']}</span>
              <button onClick={() => setIsLogoutModalOpen(true)}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <button onClick={onLoginRedirect}>
              Iniciar sesión
            </button>
          )}
          <button
            onClick={() => {
              setIsHelpModalOpen(true);
              trackEvent('Modal', 'Open', 'Help');
            }}
            className="header-help-button"
            aria-label="Ayuda"
          >
            ?
          </button>
        </div>
      </div>

      <div className="desktop-layout-container">
        {renderFilterMenu()}
        <div className="main-content">
          <div className="open-filters-button-container">
            <button
              onClick={() => setIsFilterMenuOpen(true)}
              className="open-filters-button"
              disabled={pageLoading}
            >
              Filtros
            </button>
          </div>

          <div className="main-summary-container">
            {pinnedSummaryItems.map((label) => {
              const item = summaryData.find((d) => d.label === label);
              if (!item) return null;
              return (
                <div className="summary-item" key={label}>
                  <span className="summary-label">{item.label}</span>
                  <span className="summary-value">{item.value}</span>
                </div>
              );
            })}
            {pinnedSummaryItems.length === 0 && (
              <p className="no-pinned-items-message">
                No hay elementos fijados. Selecciona qué ver desde el resumen completo.
              </p>
            )}
          </div>

          <div className="summary-actions-container">
            <button
              onClick={() => {
                setIsSummaryModalOpen(true);
                trackEvent('Modal', 'Open', 'Summary');
              }}
              className="summary-link-button"
              disabled={pageLoading}
            >
              Ver Resumen Completo
            </button>
            <div className="refresh-container">
              <button
                onClick={handleManualRefresh}
                className="summary-link-button"
                disabled={pageLoading}
              >
                Actualizar
              </button>
              <span className="countdown-timer">({countdown}s)</span>
            </div>
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
                    {user && (
                      <div className="item-checkbox-container">
                        <input
                          type="checkbox"
                          className="group-checkbox custom-form-control"
                          checked={groupItems.every((item) =>
                            selectedItems.includes(item.rowIndex)
                          )}
                          onChange={(e) =>
                            handleSelectGroup(groupItems, e.target.checked)
                          }
                          disabled={pageLoading}
                        />
                      </div>
                    )}
                    <span className="group-name">{groupName}</span>
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
                          {user && (
                            <div className="item-checkbox-container">
                              <input
                                type="checkbox"
                                className="item-checkbox custom-form-control"
                                checked={selectedItems.includes(item.rowIndex)}
                                onChange={() => handleSelectItem(item.rowIndex)}
                                disabled={pageLoading}
                              />
                            </div>
                          )}
                          <div className="item-details">
                            <span
                              className={`item-name ${user ? 'editable' : ''}`}
                              onClick={() => user && handleOpenEditModal(item)}
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
                                    disabled={!user || pageLoading || updatingField}
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
                                    disabled={!user || pageLoading || updatingField}
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
                                disabled={!user || pageLoading || updatingField}
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
            pinnedSummaryItems={pinnedSummaryItems}
            onPinnedChange={handlePinnedSummaryChange}
          />
          <EditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            itemData={editingItem}
            onSave={handleSaveDetails}
            typeOptions={typeOptions}
            assignedToOptions={assignedToOptions}
          />
          <BulkEditModal
            isOpen={isBulkEditModalOpen}
            onClose={() => setIsBulkEditModalOpen(false)}
            items={items.filter((item) => selectedItems.includes(item.rowIndex))}
            onSave={handleBulkUpdate}
            typeOptions={typeOptions}
            assignedToOptions={assignedToOptions}
            statusOptions={statusOptionsFormatted}
            locationOptions={locationOptions}
          />
          <ChangesModal
            isOpen={isChangesModalOpen}
            onClose={() => {
              setIsChangesModalOpen(false);
              // After closing the modal, update localStorage with the latest items
              localStorage.setItem("items", JSON.stringify(items));
            }}
            changes={changes}
          />
          <LogoutModal
            isOpen={isLogoutModalOpen}
            onClose={() => setIsLogoutModalOpen(false)}
            onConfirm={() => {
              setIsLogoutModalOpen(false);
              onLogout();
            }}
          />
          <HelpModal
            isOpen={isHelpModalOpen}
            onClose={() => setIsHelpModalOpen(false)}
          />
          {user && (
            <div className="fab-container">
              {selectedItems.length > 0 && (
                <button
                  className="fab-edit-button"
                  onClick={handleOpenBulkEditModal}
                  disabled={pageLoading}
                >
                  ✏️
                </button>
              )}
              <button
                className="fab-add-button"
                onClick={() => handleOpenEditModal(null)}
                disabled={pageLoading}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// No changes needed in the final block, but keeping it for context
export default ShoppingList;
