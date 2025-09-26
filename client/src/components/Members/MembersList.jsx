import React, { useState, useEffect, useMemo } from "react";
import "./MembersList.css";

function MembersList({ user }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api?action=get_members");
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }
        const data = await response.json();
        setMembers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const { attending, notAttending } = useMemo(() => {
    const attendingMembers = members.filter(m => m['Tarifa'] !== 'No viene');
    const notAttendingMembers = members.filter(m => m['Tarifa'] === 'No viene');

    // Sort attending members
    if (sortConfig !== null) {
      attendingMembers.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort for attending members
      attendingMembers.sort((a, b) => {
        const tarifaA = a['Tarifa'] || '';
        const tarifaB = b['Tarifa'] || '';
        const miembroA = a['Miembro'] || '';
        const miembroB = b['Miembro'] || '';

        if (tarifaA < tarifaB) return -1;
        if (tarifaA > tarifaB) return 1;

        if (miembroA < miembroB) return -1;
        if (miembroA > miembroB) return 1;

        return 0;
      });
    }

    // Sort not attending members by name
    notAttendingMembers.sort((a, b) => {
        const miembroA = a['Miembro'] || '';
        const miembroB = b['Miembro'] || '';
        return miembroA.localeCompare(miembroB);
    });

    return { attending: attendingMembers, notAttending: notAttendingMembers };
  }, [members, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (name) => {
    if (!sortConfig || sortConfig.key !== name) {
      return null;
    }
    if (sortConfig.direction === 'ascending') {
      return ' 🔼';
    }
    return ' 🔽';
  };

  if (loading) {
    return <div className="loading">Cargando miembros...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="members-list-container">
      <table className="members-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('Miembro')}>Nombre{getSortIndicator('Miembro')}</th>
            <th onClick={() => requestSort('Tarifa')}>Tarifa{getSortIndicator('Tarifa')}</th>
            <th onClick={() => requestSort('¿Pagado?')}>¿Pagado?{getSortIndicator('¿Pagado?')}</th>
          </tr>
        </thead>
        <tbody>
          {attending.map((member, index) => {
            const tarifaClass = member["Tarifa"] ? `tarifa-${member["Tarifa"].toLowerCase()}` : "";
            const isCurrentUser = user && user["Miembro"] === member["Miembro"];
            const rowClass = isCurrentUser ? "current-user" : "";

            return (
              <tr key={index} className={rowClass}>
                <td>{member["Miembro"]}</td>
                <td className={tarifaClass}>{member["Tarifa"]}</td>
                <td>{member["¿Pagado?"] === "Sí" ? "Sí" : "No"}</td>
              </tr>
            );
          })}

          {notAttending.length > 0 && (
            <tr className="separator-row">
              <td colSpan="3">No Vienen</td>
            </tr>
          )}

          {notAttending.map((member, index) => {
            const isCurrentUser = user && user["Miembro"] === member["Miembro"];
            const rowClass = isCurrentUser ? "current-user" : "";

            return (
              <tr key={`not-attending-${index}`} className={rowClass}>
                <td>{member["Miembro"]}</td>
                <td>{member["Tarifa"]}</td>
                <td>{member["¿Pagado?"] === "Sí" ? "Sí" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MembersList;