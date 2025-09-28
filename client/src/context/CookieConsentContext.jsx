import React, { createContext, useContext, useEffect } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { initializeBugsnag } from '../bugsnag';
import { initializeGA } from '../analytics';

const CookieConsentContext = createContext(null);

export const useCookieConsentContext = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsentContext must be used within a CookieConsentProvider');
  }
  return context;
};

let performanceToolsInitialized = false;

const initializePerformanceTools = (consent) => {
  // Prevent re-initialization
  if (performanceToolsInitialized) return;

  // Initialize if consent for performance is true
  if (consent?.performance) {
    initializeBugsnag();
    initializeGA();
    performanceToolsInitialized = true;
  }
};

export const CookieConsentProvider = ({ children }) => {
  const cookieConsent = useCookieConsent();

  // This effect will run on the initial load and whenever the `cookieConsent.consent`
  // object reference changes. The `useCookieConsent` hook provides a new object
  // whenever consent is updated, so this will trigger at the correct times.
  useEffect(() => {
    initializePerformanceTools(cookieConsent.consent);
  }, [cookieConsent.consent]);


  // The value just passes down the hook's return values.
  // Components will use the functions like `acceptAll` or `savePreferences` from the context,
  // which will in turn update the `consent` state, triggering the useEffect above.
  const value = {
    ...cookieConsent,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};