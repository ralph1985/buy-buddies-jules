import React, { useState, useEffect } from 'react';
import ShoppingList from './ShoppingList';
import LoginModal from './LoginModal';
import CookieConsent from './components/CookieConsent/CookieConsent';
import { useCookieConsentContext } from './context/CookieConsentContext';
import AnalyticsTracker from './components/Analytics/AnalyticsTracker';
import { trackEvent } from './analytics';

function App() {
  const [user, setUser] = useState(null); // Will now store the full member object
  const { openSettings } = useCookieConsentContext();

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    // Check if the stored session contains the member object
    if (session && session.member && session.timestamp) {
      const eightHours = 8 * 60 * 60 * 1000;
      if (new Date().getTime() - session.timestamp < eightHours) {
        setUser(session.member); // Set the full member object
      } else {
        localStorage.removeItem('userSession');
      }
    }
  }, []);

  const handleLogin = (member) => {
    const session = {
      member, // Store the entire member object
      timestamp: new Date().getTime(),
    };
    localStorage.setItem('userSession', JSON.stringify(session));
    setUser(member);
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUser(null);
    trackEvent('Authentication', 'Logout');
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // This now receives the full member object from LoginModal
  const handleLoginSuccess = (member) => {
    handleLogin(member);
    setIsLoginModalOpen(false);
    trackEvent('Authentication', 'Login Success', member.name);
  };

  return (
    <div className="App">
      <AnalyticsTracker />
      <ShoppingList
        user={user}
        onLogout={handleLogout}
        onLoginRedirect={() => setIsLoginModalOpen(true)}
        onOpenCookieSettings={openSettings}
      />
      {isLoginModalOpen && (
        <LoginModal
          onLogin={handleLoginSuccess}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
      <CookieConsent />
      <footer className="app-footer">
        <button onClick={openSettings} className="footer-link hide-on-desktop">
          Configurar cookies
        </button>
      </footer>
    </div>
  );
}

export default App;
