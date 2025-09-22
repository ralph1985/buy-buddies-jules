import { useState, useEffect, useCallback } from 'react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

const emptyConsent = {
  necessary: true,
  performance: false,
};

export const useCookieConsent = () => {
  const [consent, setConsent] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (storedConsent) {
        const { expiry, ...savedConsent } = JSON.parse(storedConsent);
        // Re-ask for consent if it's expired (12 months) or doesn't exist
        if (new Date().getTime() > expiry) {
          localStorage.removeItem(COOKIE_CONSENT_KEY);
          setConsent(emptyConsent);
          setIsBannerVisible(true);
        } else {
          setConsent(savedConsent);
          setIsBannerVisible(false);
        }
      } else {
        setConsent(emptyConsent);
        setIsBannerVisible(true);
      }
    } catch (error) {
      console.error("Error reading cookie consent from localStorage", error);
      setConsent(emptyConsent);
      setIsBannerVisible(true);
    }
  }, []);

  const saveConsent = useCallback((newConsent) => {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 12); // Set expiry for 12 months

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...newConsent, expiry: expiry.getTime() }));
    setConsent(newConsent);
    setIsBannerVisible(false);
    setIsSettingsVisible(false);

    // This is a good place to trigger side effects, like initializing analytics
    // We will handle this in the provider
  }, []);

  const acceptAll = useCallback(() => {
    const allConsent = { necessary: true, performance: true };
    saveConsent(allConsent);
  }, [saveConsent]);

  const rejectAll = useCallback(() => {
    const noConsent = { necessary: true, performance: false };
    saveConsent(noConsent);
  }, [saveConsent]);

  const updateConsent = useCallback((category, value) => {
    const newConsent = { ...consent, [category]: value };
    setConsent(newConsent);
  }, [consent]);

  const savePreferences = useCallback(() => {
    saveConsent(consent);
  }, [consent, saveConsent]);

  const openSettings = useCallback(() => {
    setIsSettingsVisible(true);
    setIsBannerVisible(false);
  }, []);

  const closeSettings = useCallback(() => {
    // If user closes settings without saving, revert to stored state
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent) {
      const { expiry, ...savedConsent } = JSON.parse(storedConsent);
      setConsent(savedConsent);
    } else {
      setConsent(emptyConsent);
      setIsBannerVisible(true); // Show banner if no consent was ever saved
    }
    setIsSettingsVisible(false);
  }, []);


  return {
    consent,
    isBannerVisible,
    isSettingsVisible,
    acceptAll,
    rejectAll,
    updateConsent,
    savePreferences,
    openSettings,
    closeSettings,
  };
};
