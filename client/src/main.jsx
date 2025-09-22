import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { getErrorBoundary } from './bugsnag';
import { CookieConsentProvider } from './context/CookieConsentContext';
import { RouterProvider } from './context/RouterContext';

const ErrorBoundary = getErrorBoundary();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider>
        <CookieConsentProvider>
          <App />
        </CookieConsentProvider>
      </RouterProvider>
    </ErrorBoundary>
  </StrictMode>
);
