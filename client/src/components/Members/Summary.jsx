import React from 'react';
import './Summary.css';

const Summary = () => {
  const summaryData = {
    jueves: {
      pax: 16,
      cuota: 65,
      total: '1.040,00 €'
    },
    viernes: {
      pax: 17,
      cuota: 55,
      total: '935,00 €'
    },
    sinAsignar: {
      pax: 0,
      cuota: 0,
      total: '0,00 €'
    },
    quedoEnCuenta2024: '172,34 €',
    totalPresupuesto: {
      pax: 33,
      total: '2.147,34 €'
    }
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
          <tr className="summary-jueves">
            <td>Jueves</td>
            <td>{summaryData.jueves.pax}</td>
            <td>{summaryData.jueves.cuota}</td>
            <td>{summaryData.jueves.total}</td>
          </tr>
          <tr className="summary-viernes">
            <td>Viernes</td>
            <td>{summaryData.viernes.pax}</td>
            <td>{summaryData.viernes.cuota}</td>
            <td>{summaryData.viernes.total}</td>
          </tr>
          <tr>
            <td>Sin asignar</td>
            <td>{summaryData.sinAsignar.pax}</td>
            <td>{summaryData.sinAsignar.cuota}</td>
            <td>{summaryData.sinAsignar.total}</td>
          </tr>
          <tr>
            <td colSpan="3">Quedó en cuenta de 2024</td>
            <td>{summaryData.quedoEnCuenta2024}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="summary-total">
            <td>Total presupuesto</td>
            <td>{summaryData.totalPresupuesto.pax}</td>
            <td colSpan="2">{summaryData.totalPresupuesto.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default Summary;