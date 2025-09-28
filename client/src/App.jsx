import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ShoppingList from './ShoppingList';
import Catering from './Catering'; // Import the new component
import LoginModal from './LoginModal';
import CookieConsent from './components/CookieConsent/CookieConsent';
import { useCookieConsentContext } from './context/CookieConsentContext';
import AnalyticsTracker from './components/Analytics/AnalyticsTracker';
import { trackEvent } from './analytics';

function App() {
  const [user, setUser] = useState(null);
  const { openSettings } = useCookieConsentContext();

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session && session.member && session.timestamp) {
      const eightHours = 8 * 60 * 60 * 1000;
      if (new Date().getTime() - session.timestamp < eightHours) {
        setUser(session.member);
      } else {
        localStorage.removeItem('userSession');
      }
    }
  }, []);

  const handleLogin = (member) => {
    const session = {
      member,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem('userSession', JSON.stringify(session));
    setUser(member);
  };

  const handleLogout = () => {
    trackEvent('Authentication', 'Logout');
    localStorage.removeItem('userSession');
    setUser(null);
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginSuccess = (member) => {
    handleLogin(member);
    setIsLoginModalOpen(false);
    trackEvent('Authentication', 'Login Success');
  };

  return (
    <Router>
      <div className="App">
        <AnalyticsTracker />
        <nav>
          <Link to="/">Shopping List</Link> | <Link to="/catering">Catering</Link>
        </nav>
        <Routes>
          <Route
            path="/"
            element={
              <ShoppingList
                user={user}
                onLogout={handleLogout}
                onLoginRedirect={() => setIsLoginModalOpen(true)}
                onOpenCookieSettings={openSettings}
              />
            }
          />
          <Route path="/catering" element={<Catering />} />
        </Routes>
        {isLoginModalOpen && (
          <LoginModal
            onLogin={handleLoginSuccess}
            onClose={() => setIsLoginModalOpen(false)}
          />
        )}
        <CookieConsent />
      </div>
    </Router>
  );
}

export default App;
