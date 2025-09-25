import React, { useState, useEffect } from "react";
import "./MembersList.css";

function MembersList({ user }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div className="loading">Cargando miembros...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="members-list-container">
      <h2>Miembros</h2>
      <table className="members-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tarifa</th>
            <th>Cuota Pagada</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => {
            const tarifaClass = member["Tarifa"] ? `tarifa-${member["Tarifa"].toLowerCase()}` : "";
            const isCurrentUser = user && user["Miembro"] === member["Miembro"];
            const rowClass = isCurrentUser ? "current-user" : "";

            return (
              <tr key={index} className={rowClass}>
                <td>{member["Miembro"]}</td>
                <td className={tarifaClass}>{member["Tarifa"]}</td>
                <td>{String(member["Cuota Pagada"] || "").trim().toLowerCase() === 'sí' ? 'Sí' : 'No'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MembersList;