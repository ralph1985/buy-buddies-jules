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

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginSuccess = (name) => {
    handleLogin(name);
    setIsLoginModalOpen(false);
  };

  return (
    <div className="App">
      <ShoppingList
        user={user}
        onLogout={handleLogout}
        onLoginRedirect={() => setIsLoginModalOpen(true)}
      />
      {isLoginModalOpen && (
        <LoginModal
          onLogin={handleLoginSuccess}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
