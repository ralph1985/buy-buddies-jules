import React from 'react';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';

let ErrorBoundary = null;

export const initializeBugsnag = () => {
  if (ErrorBoundary) {
    console.warn('Bugsnag is already initialized.');
    return;
  }

  Bugsnag.start({
    apiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
    plugins: [new BugsnagPluginReact(React)],
  });

  ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React);
  console.log('Bugsnag initialized.');
};

// Returns a fallback component if Bugsnag is not initialized
export const getErrorBoundary = () => {
  if (ErrorBoundary) {
    return ErrorBoundary;
  }

  // Fallback Error Boundary if Bugsnag is not consented/initialized
  return class extends React.Component {
    componentDidCatch(error, errorInfo) {
      console.error("Uncaught error:", error, errorInfo);
    }
    render() {
      // You can render a fallback UI here if you want
      return this.props.children;
    }
  };
};
