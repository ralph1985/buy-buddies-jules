import React, { createContext, useContext, useEffect } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { initializeBugsnag } from '../bugsnag'; // We will create this file next

const CookieConsentContext = createContext(null);

export const useCookieConsentContext = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsentContext must be used within a CookieConsentProvider');
  }
  return context;
};

let bugsnagInitialized = false;

export const CookieConsentProvider = ({ children }) => {
  const cookieConsent = useCookieConsent();

  useEffect(() => {
    if (cookieConsent.consent?.performance && !bugsnagInitialized) {
      initializeBugsnag();
      bugsnagInitialized = true;
    }
  }, [cookieConsent.consent]);

  return (
    <CookieConsentContext.Provider value={cookieConsent}>
      {children}
    </CookieConsentContext.Provider>
  );
};
