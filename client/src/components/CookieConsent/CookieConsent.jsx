import React from 'react';
import { useCookieConsentContext } from '../../context/CookieConsentContext';
import CookiePolicyModal from '../../CookiePolicyModal';
import './CookieConsent.css';

const CookieConsent = () => {
  const {
    consent,
    isBannerVisible,
    isSettingsVisible,
    isPolicyVisible,
    acceptAll,
    rejectAll,
    updateConsent,
    savePreferences,
    openSettings,
    closeSettings,
    openPolicy,
  } = useCookieConsentContext();

  if (!isBannerVisible && !isSettingsVisible && !isPolicyVisible) {
    return null;
  }

  const handlePerformanceChange = (e) => {
    updateConsent('performance', e.target.checked);
  };

  const handlePolicyClick = (e) => {
    e.preventDefault();
    openPolicy();
  };

  const renderBanner = () => (
    <div className="cookie-consent-banner" role="dialog" aria-live="polite" aria-label="Cookie Consent Banner">
      <div className="cookie-consent-text">
        <p>
          Utilizamos cookies para mejorar tu experiencia. Al aceptar, nos permites usar cookies de rendimiento para analizar el tráfico y detectar errores.
          {' '}
          <a href="#" onClick={handlePolicyClick}>
            Política de Cookies
          </a>
        </p>
      </div>
      <div className="cookie-consent-actions">
        <button onClick={acceptAll}>Aceptar todo</button>
        <button onClick={rejectAll}>Rechazar todo</button>
        <button onClick={openSettings}>Configurar</button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="cookie-settings-overlay" role="dialog" aria-modal="true">
      <div className="cookie-settings-modal">
        <h2>Configuración de Cookies</h2>
        <p>
          Puedes gestionar tus preferencias de cookies a continuación. Las cookies necesarias no se pueden desactivar. Para más detalles, consulta nuestra{' '}
          <a href="#" onClick={handlePolicyClick}>
            Política de Cookies
          </a>
          .
        </p>

        <div className="cookie-category">
          <div className="cookie-category-header">
            <strong>Necesarias</strong>
            <span className="always-active">Siempre activas</span>
          </div>
          <p>Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden desactivar.</p>
        </div>

        <div className="cookie-category">
          <div className="cookie-category-header">
            <label htmlFor="performance-cookie">
              <strong>Rendimiento y Errores (Bugsnag)</strong>
            </label>
            <label className="switch">
              <input
                type="checkbox"
                id="performance-cookie"
                checked={consent?.performance || false}
                onChange={handlePerformanceChange}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <p>Estas cookies nos permiten monitorear el rendimiento y detectar errores para mejorar nuestro servicio.</p>
        </div>

        <div className="cookie-settings-actions">
          <button onClick={savePreferences}>Guardar preferencias</button>
           <button onClick={closeSettings} className="close-button">Cerrar</button>
        </div>
      </div>
    </div>
  );

  if (isPolicyVisible) {
    return <CookiePolicyModal />;
  }

  if (isSettingsVisible) {
    return renderSettings();
  }

  if (isBannerVisible) {
    return renderBanner();
  }

  return null;
};

export default CookieConsent;
