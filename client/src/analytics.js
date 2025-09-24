import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
let isGAInitialized = false;

/**
 * Initializes Google Analytics if the measurement ID is available and consent has been given.
 * This function should be called only after confirming user consent.
 */
export const initializeGA = () => {
  // Prevent re-initialization or initialization without ID
  if (isGAInitialized || !GA_MEASUREMENT_ID) {
    if (!GA_MEASUREMENT_ID) {
      console.log("Google Analytics Measurement ID not found. Skipping initialization.");
    }
    return;
  }

  try {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    isGAInitialized = true;
    console.log("Google Analytics initialized");
  } catch (e) {
    console.error("Google Analytics initialization failed", e);
    // Ensure we don't think it's initialized if it failed
    isGAInitialized = false;
  }
};

/**
 * Tracks a page view if GA is initialized.
 * @param {string} path - The path of the page to track (e.g., window.location.pathname).
 */
export const trackPageView = (path) => {
  if (!isGAInitialized) {
    return;
  }
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
  } catch (e) {
    console.error("GA pageview tracking failed", e);
  }
};

/**
 * Tracks a custom event if GA is initialized.
 * @param {string} category - The category of the event.
 * @param {string} action - The action of the event.
 * @param {string} [label] - An optional label for the event.
 */
export const trackEvent = (category, action, label) => {
  if (!isGAInitialized) {
    return;
  }
  try {
    ReactGA.event({
      category,
      action,
      label,
    });
  } catch (e) {
    console.error("GA event tracking failed", e);
  }
};