import React from 'react';
import CookiePolicy from './CookiePolicy';
import { useCookieConsentContext } from './context/CookieConsentContext';

const CookiePolicyModal = () => {
  const { closePolicy } = useCookieConsentContext();

  return (
    <div className="cookie-settings-overlay" role="dialog" aria-modal="true">
      <div className="cookie-settings-modal">
        <div className="modal-header">
          <h2>Política de Cookies</h2>
          <button onClick={closePolicy} className="close-button" aria-label="Cerrar">
            &times;
          </button>
        </div>
        <div className="modal-content">
          <CookiePolicy />
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyModal;
