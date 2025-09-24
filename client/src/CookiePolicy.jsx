import React from 'react';

const CookiePolicy = () => {
  return (
    <div className="policy-page">
      <h1>Política de Cookies</h1>
      <p><em>Última actualización: 22 de septiembre de 2025</em></p>

      <h2>¿Qué son las cookies?</h2>
      <p>
        Una cookie es un pequeño fichero de texto que un sitio web coloca en tu PC, teléfono o cualquier otro dispositivo, con información sobre tu navegación en dicho sitio. Las cookies son necesarias para facilitar la navegación y hacerla más amigable, y no dañan tu ordenador.
      </p>

      <h2>¿Qué cookies utilizamos en este sitio web?</h2>
      <p>
        A continuación, se detallan las cookies utilizadas en nuestro sitio web, junto con su propósito:
      </p>

      <h3>1. Cookies Necesarias</h3>
      <p>
        Estas cookies son esenciales para que el sitio web funcione correctamente. No se pueden desactivar en nuestros sistemas. Generalmente, solo se configuran en respuesta a acciones realizadas por ti que equivalen a una solicitud de servicios, como el inicio de sesión o el guardado de tus preferencias de privacidad.
      </p>
      <ul>
        <li><strong>userSession:</strong> Utilizada para mantener la sesión del usuario iniciada. Se guarda en `localStorage`.</li>
        <li><strong>cookie-consent:</strong> Almacena tus preferencias sobre el consentimiento de cookies. Se guarda en `localStorage`.</li>
      </ul>

      <h3>2. Cookies de Rendimiento y Errores</h3>
      <p>
        Estas cookies nos permiten contar las visitas y fuentes de tráfico para poder medir y mejorar el rendimiento de nuestro sitio. Nos ayudan a saber qué páginas son las más o las menos populares, y ver cuántas personas visitan el sitio. Toda la información que recogen estas cookies es agregada y, por lo tanto, anónima. Si no permites estas cookies no sabremos cuándo visitaste nuestro sitio, y no podremos monitorear su rendimiento.
      </p>
      <ul>
        <li><strong>Bugsnag:</strong> Utilizamos Bugsnag para detectar y diagnosticar errores de JavaScript en la aplicación. Esto nos ayuda a mejorar la estabilidad y la calidad del servicio. Esta herramienta solo se activará si das tu consentimiento explícito.</li>
        <li><strong>Google Analytics:</strong> Utilizamos Google Analytics para recopilar información anónima sobre cómo los usuarios interactúan con nuestro sitio. Los datos, como las páginas visitadas y el tiempo de permanencia, nos ayudan a entender qué características son más populares y cómo podemos mejorar la experiencia general. Esta herramienta solo se activará si das tu consentimiento.</li>
      </ul>

      <h2>¿Cómo puedes gestionar tus preferencias?</h2>
      <p>
        Puedes cambiar tus preferencias de cookies en cualquier momento haciendo clic en el enlace "Configurar cookies" que encontrarás en el pie de página de nuestro sitio web. Esto te permitirá volver a abrir el panel de consentimiento y modificar tus elecciones o retirar tu consentimiento.
      </p>
      <p>
        Ten en cuenta que si desactivas las cookies de rendimiento, no podremos inicializar las herramientas que nos ayudan a mejorar tu experiencia. Sin embargo, las cookies necesarias seguirán activas ya que son indispensables para el funcionamiento del sitio.
      </p>
    </div>
  );
};

export default CookiePolicy;
