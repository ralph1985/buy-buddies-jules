import React, { useState, useEffect } from 'react';
import ShoppingList from './ShoppingList';
import LoginModal from './LoginModal';
import CookiePolicy from './CookiePolicy'; // Import the new component
import { useCookieConsentContext } from './context/CookieConsentContext';

function App() {
  const [user, setUser] = useState(null);
  const { openSettings } = useCookieConsentContext();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
    };
  }, []);

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

  const renderPage = () => {
    switch (path) {
      case '/politica-de-cookies':
        return <CookiePolicy />;
      default:
        return (
          <>
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
          </>
        );
    }
  };

  return (
    <div className="App">
      {renderPage()}
      <footer className="app-footer">
        <button onClick={openSettings} className="footer-link">
          Configurar cookies
        </button>
      </footer>
    </div>
  );
}

export default App;
