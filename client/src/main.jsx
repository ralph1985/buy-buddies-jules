import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import "./index.css";
import App from "./App.jsx";

const bugsnagClient = Bugsnag.start({
  apiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
  plugins: [new BugsnagPluginReact(React)],
});
window.Bugsnag = bugsnagClient;

const ErrorBoundary = Bugsnag.getPlugin("react").createErrorBoundary(React);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
