import React, { useState, useEffect } from 'react';
import './CateringSummary.css';

function Spinner() {
  return <div className="spinner"></div>;
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

function Catering() {
  const [cateringData, setCateringData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCateringData = async () => {
      try {
        setLoading(true);
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
      }
    };

    fetchCateringData();
  }, []);

  if (loading) {
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
              cateringData.map((row) => (
                <tr key={row.rowIndex}>
                  <td>{row['Miembro']}</td>
                  <td>
                    <span className={getStatusClass(row['Comida sábado'])}>
                      {row['Comida sábado']}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusClass(row['Comida domingo'])}>
                      {row['Comida domingo']}
                    </span>
                  </td>
                  <td>{row['Total']}</td>
                  <td>
                    <span className={getStatusClass(row['¿Pagado?'])}>
                      {row['¿Pagado?']}
                    </span>
                  </td>
                </tr>
              ))
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