import React, { useState, useEffect } from 'react';

function Catering() {
  const [cateringData, setCateringData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCateringData = async () => {
      try {
        const response = await fetch('/api?action=get_catering');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setCateringData(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCateringData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Catering</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Importe</th>
            <th style={tableHeaderStyle}>Miembro</th>
            <th style={tableHeaderStyle}>Comida sábado</th>
            <th style={tableHeaderStyle}>Comida domingo</th>
            <th style={tableHeaderStyle}>Total</th>
            <th style={tableHeaderStyle}>¿Pagado?</th>
          </tr>
        </thead>
        <tbody>
          {cateringData.map((row, index) => (
            <tr key={index}>
              <td style={tableCellStyle}>{row['Importe']}</td>
              <td style={tableCellStyle}>{row['Miembro']}</td>
              <td style={tableCellStyle}>{row['Comida sábado']}</td>
              <td style={tableCellStyle}>{row['Comida domingo']}</td>
              <td style={tableCellStyle}>{row['Total']}</td>
              <td style={tableCellStyle}>{row['¿Pagado?']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableHeaderStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
  backgroundColor: '#f2f2f2',
};

const tableCellStyle = {
  border: '1px solid #ddd',
  padding: '8px',
};

export default Catering;