import React from 'react';
import './Summary.css';

const Summary = () => {
  const summaryData = [
    { tarifa: 'Jueves', pax: 16, cuota: '65 €', total: '1.040,00 €', className: 'summary-highlight' },
    { tarifa: 'Viernes', pax: 17, cuota: '55 €', total: '935,00 €', className: 'summary-highlight' },
    { tarifa: 'Sin asignar', pax: 0, cuota: '0 €', total: '0,00 €' }
  ];

  const quedoEnCuenta2024 = '172,34 €';
  const totalPresupuesto = {
    pax: 33,
    total: '2.147,34 €'
  };

  return (
    <div className="summary-container">
      <h2>Resumen del Presupuesto</h2>
      <table className="summary-table">
        <thead>
          <tr>
            <th>Tarifa</th>
            <th>PAX</th>
            <th>Cuota</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map((item, index) => (
            <tr key={index} className={item.className || ''}>
              <td>{item.tarifa}</td>
              <td>{item.pax}</td>
              <td>{item.cuota}</td>
              <td>{item.total}</td>
            </tr>
          ))}
          <tr>
            <td colSpan="3">Quedó en cuenta de 2024</td>
            <td>{quedoEnCuenta2024}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="summary-total">
            <td>Total presupuesto</td>
            <td>{totalPresupuesto.pax}</td>
            <td colSpan="2">{totalPresupuesto.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default Summary;