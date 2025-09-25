import React, { useState, useEffect } from "react";
import "./MembersList.css";

function MembersList() {
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
          {members.map((member, index) => (
            <tr key={index}>
              <td>{member["Miembro"]}</td>
              <td>{member["Tarifa"]}</td>
              <td>{member["Cuota Pagada"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MembersList;