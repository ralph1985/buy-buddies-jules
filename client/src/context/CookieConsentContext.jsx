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

  // Initialize Bugsnag on initial load if consent is already given
  useEffect(() => {
    if (cookieConsent.consent?.performance && !bugsnagInitialized) {
      initializeBugsnag();
      bugsnagInitialized = true;
    }
  }, [cookieConsent.consent?.performance]);


  const value = {
    ...cookieConsent,
    savePreferences: () => {
      cookieConsent.savePreferences();
      if (cookieConsent.consent?.performance && !bugsnagInitialized) {
        initializeBugsnag();
        bugsnagInitialized = true;
      }
    },
    acceptAll: () => {
      cookieConsent.acceptAll();
      if (!bugsnagInitialized) {
        initializeBugsnag();
        bugsnagInitialized = true;
      }
    }
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};
