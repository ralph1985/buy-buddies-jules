import React, { useState, useEffect } from 'react';
import ShoppingList from './ShoppingList';
import LoginModal from './LoginModal';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session && session.name && session.timestamp) {
      const eightHours = 8 * 60 * 60 * 1000;
      if (new Date().getTime() - session.timestamp < eightHours) {
        setUser(session.name);
      } else {
        localStorage.removeItem('userSession');
      }
    }
  }, []);

  const handleLogin = (name) => {
    const session = {
      name,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem('userSession', JSON.stringify(session));
    setUser(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUser(null);
  };

  return (
    <div className="App">
      {user ? (
        <ShoppingList user={user} onLogout={handleLogout} />
      ) : (
        <LoginModal onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
