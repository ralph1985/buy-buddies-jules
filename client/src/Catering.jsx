import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import './CateringSummary.css';

function Spinner() {
  return <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 'auto' }}></div>;
}

function CateringSummary({ summaryData }) {
  if (!summaryData || summaryData.length === 0) {
    return null;
  }

  return (
    <div className="catering-summary-container">
      {summaryData.map((item, index) => (
        <div key={index} className="summary-card">
          <div className="summary-card-label">{item.label}</div>
          <div className="summary-card-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function Catering({ user }) {
  const [cateringData, setCateringData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingCell, setUpdatingCell] = useState(null);

  // Filter states
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [searchTags, setSearchTags] = useState([]);
  const [saturdayFilter, setSaturdayFilter] = useState(null);
  const [sundayFilter, setSundayFilter] = useState(null);
  const [paidFilter, setPaidFilter] = useState(null);

  const fetchCateringData = async () => {
    if (cateringData.length === 0) {
      setLoading(true);
    }
    try {
      const [cateringRes, summaryRes] = await Promise.all([
        fetch('/api?action=get_catering'),
        fetch('/api?action=get_catering_summary'),
      ]);

      if (!cateringRes.ok || !summaryRes.ok) {
        throw new Error('Network response was not ok');
      }

      const catering = await cateringRes.json();
      const summary = await summaryRes.json();

      setCateringData(catering);
      setSummaryData(summary);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch catering data:", err);
      setError("No se pudo cargar los datos del catering. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
      setUpdatingCell(null);
    }
  };

  useEffect(() => {
    fetchCateringData();
  }, []);

  const handleCateringUpdate = async (rowIndex, columnName, newValue) => {
    if (!user) return;
    setUpdatingCell({ rowIndex, columnName });
    try {
      await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_catering_status",
          rowIndex,
          columnName,
          newValue,
          user: user['Miembro'],
        }),
      });
      await fetchCateringData();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Error: No se pudo realizar la actualización.");
      setUpdatingCell(null);
    }
  };

  const getStatusClass = (value) => {
    const lowerCaseValue = String(value).toLowerCase();
    if (lowerCaseValue === 'sí') return 'status-yes';
    if (lowerCaseValue === 'no') return 'status-no';
    if (lowerCaseValue === 'cancelado') return 'status-cancelled';
    return '';
  };

  const handleClearFilters = () => {
    setSearchTags([]);
    setSaturdayFilter(null);
    setSundayFilter(null);
    setPaidFilter(null);
  };

  const filteredData = useMemo(() => {
    return cateringData.filter(row => {
      const memberName = row['Miembro'] || '';
      const saturdayStatus = row['Comida sábado'] || '';
      const sundayStatus = row['Comida domingo'] || '';
      const paidStatus = row['¿Pagado?'] || '';

      const searchMatch = searchTags.length === 0 || searchTags.some(tag => memberName === tag.value);
      const saturdayMatch = !saturdayFilter || saturdayStatus === saturdayFilter.value;
      const sundayMatch = !sundayFilter || sundayStatus === sundayFilter.value;
      const paidMatch = !paidFilter || paidStatus === paidFilter.value;

      return searchMatch && saturdayMatch && sundayMatch && paidMatch;
    });
  }, [cateringData, searchTags, saturdayFilter, sundayFilter, paidFilter]);

  const filteredTotal = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      // Robustly parse number from currency string
      const totalString = String(row['Total'] || '0');
      const cleanedString = totalString.replace(/[€$]/g, '').replace(/\./g, '').replace(',', '.').trim();
      const totalValue = parseFloat(cleanedString);
      return acc + (isNaN(totalValue) ? 0 : totalValue);
    }, 0);
  }, [filteredData]);

  const mealStatusOptions = [
    { value: 'Sí', label: 'Sí' },
    { value: 'No', label: 'No' },
    { value: 'Cancelado', label: 'Cancelado' },
  ];

  const paidStatusOptions = [
    { value: 'Sí', label: 'Sí' },
    { value: 'No', label: 'No' },
  ];

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
    input: (provided) => ({ ...provided, color: 'white' }),
    placeholder: (provided) => ({ ...provided, color: '#ccc' }),
    singleValue: (provided) => ({ ...provided, color: 'white' }),
    multiValue: (provided) => ({ ...provided, backgroundColor: '#444' }),
    multiValueLabel: (provided) => ({ ...provided, color: 'white' }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#ccc',
      '&:hover': { backgroundColor: '#ffa500', color: 'white' },
    }),
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
            options={cateringData.map(row => ({ value: row.Miembro, label: row.Miembro }))}
            placeholder="Buscar por miembro..."
            value={searchTags}
            onChange={setSearchTags}
            styles={customStyles}
            className="filter-select"
            formatCreateLabel={(inputValue) => `Buscar "${inputValue}"`}
            noOptionsMessage={() => 'Escribe para buscar o añadir un miembro'}
          />
          <Select
            options={mealStatusOptions}
            onChange={setSaturdayFilter}
            value={saturdayFilter}
            placeholder="Comida Sábado"
            isClearable
            styles={customStyles}
            className="filter-select"
          />
          <Select
            options={mealStatusOptions}
            onChange={setSundayFilter}
            value={sundayFilter}
            placeholder="Comida Domingo"
            isClearable
            styles={customStyles}
            className="filter-select"
          />
          <Select
            options={paidStatusOptions}
            onChange={setPaidFilter}
            value={paidFilter}
            placeholder="Pagado"
            isClearable
            styles={customStyles}
            className="filter-select"
          />
        </div>
        <div className="filter-menu-actions">
          <div className="clear-filters-container">
            <button onClick={handleClearFilters} className="summary-link-button">
              Limpiar filtros
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

  if (loading && cateringData.length === 0) {
    return (
      <div className="loading-container">
        <Spinner />
        <p>Cargando datos del catering...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-container"><p>{error}</p></div>;
  }

  return (
    <div className="catering-container">
      {renderFilterMenu()}
      <div className="open-filters-button-container">
        <button
          onClick={() => setIsFilterMenuOpen(true)}
          className="open-filters-button"
        >
          Filtros
        </button>
      </div>

      <CateringSummary summaryData={summaryData} />

      <div className="catering-card-container">
        {filteredData.length > 0 ? (
          filteredData.map((row) => {
            const isUpdatingSaturday = updatingCell?.rowIndex === row.rowIndex && updatingCell?.columnName === 'Comida sábado';
            const isUpdatingSunday = updatingCell?.rowIndex === row.rowIndex && updatingCell?.columnName === 'Comida domingo';
            const isUpdatingPaid = updatingCell?.rowIndex === row.rowIndex && updatingCell?.columnName === '¿Pagado?';

            return (
              <div key={row.rowIndex} className="catering-card">
                <div className="card-header">
                  <span className="card-member-name">{row['Miembro']}</span>
                  <span className="card-total">{row['Total']}</span>
                </div>
                <div className="card-body">
                  <div className="card-field">
                    <label>Comida Sábado</label>
                    {isUpdatingSaturday ? <Spinner /> : user ? (
                      <select
                        value={row['Comida sábado'] || ''}
                        onChange={(e) => handleCateringUpdate(row.rowIndex, 'Comida sábado', e.target.value)}
                        disabled={!!updatingCell}
                        className={`catering-select ${getStatusClass(row['Comida sábado'])}`}
                      >
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    ) : (
                      <span className={getStatusClass(row['Comida sábado'])}>
                        {row['Comida sábado']}
                      </span>
                    )}
                  </div>
                  <div className="card-field">
                    <label>Comida Domingo</label>
                    {isUpdatingSunday ? <Spinner /> : user ? (
                      <select
                        value={row['Comida domingo'] || ''}
                        onChange={(e) => handleCateringUpdate(row.rowIndex, 'Comida domingo', e.target.value)}
                        disabled={!!updatingCell}
                        className={`catering-select ${getStatusClass(row['Comida domingo'])}`}
                      >
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    ) : (
                      <span className={getStatusClass(row['Comida domingo'])}>
                        {row['Comida domingo']}
                      </span>
                    )}
                  </div>
                  <div className="card-field">
                    <label>¿Pagado?</label>
                    {isUpdatingPaid ? <Spinner /> : user ? (
                      <select
                        value={row['¿Pagado?'] || ''}
                        onChange={(e) => handleCateringUpdate(row.rowIndex, '¿Pagado?', e.target.value)}
                        disabled={!!updatingCell}
                        className={`catering-select ${getStatusClass(row['¿Pagado?'])}`}
                      >
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <span className={getStatusClass(row['¿Pagado?'])}>
                        {row['¿Pagado?']}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>No hay miembros que coincidan con los filtros.</p>
        )}
      </div>
      <div className="catering-sticky-footer">
        <span>Total Filtrado:</span>
        <span>{filteredTotal.toFixed(2).replace('.', ',')}€</span>
      </div>
    </div>
  );
}

export default Catering;