import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const RouterContext = createContext(null);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

export const RouterProvider = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);

  const handlePopState = useCallback(() => {
    setPath(window.location.pathname);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState]);

  const navigate = useCallback((to) => {
    window.history.pushState({}, '', to);
    setPath(to);
  }, []);

  const value = {
    path,
    navigate,
  };

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
};
