import React, { useState, useEffect } from 'react';

function Spinner() {
  return <div className="spinner"></div>;
}

function Catering() {
  const [cateringData, setCateringData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCateringData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api?action=get_catering');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setCateringData(data);
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

  const getCellClassName = (value) => {
    const lowerCaseValue = String(value).toLowerCase();
    if (lowerCaseValue === 'sí') {
      return 'status-yes';
    }
    if (lowerCaseValue === 'no') {
      return 'status-no';
    }
    if (lowerCaseValue === 'cancelado') {
      return 'status-cancelled';
    }
    return '';
  };

  return (
    <div className="catering-container">
      <h2>Listado del Catering</h2>
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
                  <td data-label="Miembro">{row['Miembro']}</td>
                  <td data-label="Comida Sábado" className={getCellClassName(row['Comida sábado'])}>
                    {row['Comida sábado']}
                  </td>
                  <td data-label="Comida Domingo" className={getCellClassName(row['Comida domingo'])}>
                    {row['Comida domingo']}
                  </td>
                  <td data-label="Total">{row['Total']}</td>
                  <td data-label="¿Pagado?" className={getCellClassName(row['¿Pagado?'])}>
                    {row['¿Pagado?']}
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