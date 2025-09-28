import React, { useState, useEffect } from 'react';
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
  const [updatingCell, setUpdatingCell] = useState(null); // { rowIndex, columnName }

  const fetchCateringData = async () => {
    // Don't set loading to true if we are just refreshing in the background
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
      // Refetch data to ensure UI is in sync with the backend
      await fetchCateringData();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Error: No se pudo realizar la actualización.");
      setUpdatingCell(null); // Reset on failure
    }
  };


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

  const getStatusClass = (value) => {
    const lowerCaseValue = String(value).toLowerCase();
    if (lowerCaseValue === 'sí') return 'status-yes';
    if (lowerCaseValue === 'no') return 'status-no';
    if (lowerCaseValue === 'cancelado') return 'status-cancelled';
    return '';
  };

  return (
    <div className="catering-container">
      <h2>Listado del Catering</h2>
      <CateringSummary summaryData={summaryData} />
      <div className="table-responsive">
        <table className="catering-table">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Comida Sábado</th>
              <th>Comida Domingo</th>
              <th>Total</th>
              <th>¿Pagado?</th>
            </tr>
          </thead>
          <tbody>
            {cateringData.length > 0 ? (
              cateringData.map((row) => {
                const isUpdatingSaturday = updatingCell?.rowIndex === row.rowIndex && updatingCell?.columnName === 'Comida sábado';
                const isUpdatingSunday = updatingCell?.rowIndex === row.rowIndex && updatingCell?.columnName === 'Comida domingo';
                const isUpdatingPaid = updatingCell?.rowIndex === row.rowIndex && updatingCell?.columnName === '¿Pagado?';

                return (
                  <tr key={row.rowIndex}>
                    <td>{row['Miembro']}</td>
                    <td>
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
                    </td>
                    <td>
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
                    </td>
                    <td>{row['Total']}</td>
                    <td>
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
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5">No hay datos de catering disponibles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Catering;