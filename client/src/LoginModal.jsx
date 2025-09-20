import React, { useState } from 'react';

function LoginModal({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api?action=get_members');
      const members = await response.json();
      const member = members.find(m => m.name.toLowerCase() === name.toLowerCase());

      if (member && member.access === 'Sí') {
        onLogin(member.name);
      } else {
        setError('Error de acceso');
        setLoading(false);
      }
    } catch {
      setError('Error de acceso');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Acceso a la aplicación</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="name">Nombre de miembro:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="login-input"
              autoFocus
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
