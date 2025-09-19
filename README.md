# Google Sheets Shopping List

This is a full-stack web application that provides a user-friendly interface to manage a shopping list stored in a Google Sheet. It allows for real-time updates, additions, and tracking of expenses without directly interacting with the Google Sheets interface.

## Features

*   **View Shopping List:** Displays items from the Google Sheet.
*   **Group by Category:** Organizes the shopping list by "Type" or "When" for better clarity.
*   **Dynamic Search:** Instantly search for products in the list.
*   **Advanced Filtering:** Filter items by their status (e.g., "Pending", "Purchased"), type, or purchase date.
*   **Quick Edits (Inline):**
    *   Update item quantities and unit prices directly from the list view.
    *   Change the status of an item using a dropdown.
    *   Client-side validation ensures that only valid decimal numbers (using a comma) are submitted.
*   **Add & Edit Items:** A modal form allows for adding new products or editing the details of existing ones (description, notes, unit price, quantity, type, and when).
*   **Expense Summary:** View a detailed summary of expenses, including "Total Paid," "Total Remaining," and "Total Remaining for Saturday."
*   **Responsive UI:** A clean, responsive interface with a floating action button for adding items, suitable for both desktop and mobile use.

---

## Funcionalidades Implementadas (No Documentadas)

Se han añadido varias mejoras y funcionalidades que no estaban reflejadas en la documentación original:

1.  **Edición Inline de Cantidad y Precio:** Se puede hacer clic directamente en los campos de "Cantidad" y "Precio unidad" en la lista para editarlos sin abrir un modal. La actualización es instantánea.
2.  **Filtros Avanzados:** Además de filtrar por "Estado", ahora se puede filtrar por "Tipo de Elemento" y por "Cuándo se compra".
3.  **Agrupación Dinámica:** La lista de productos se puede agrupar por "Tipo" o por "Fecha", permitiendo una mejor organización visual.
4.  **Validación en el Frontend:** Se ha implementado una validación del lado del cliente para los campos numéricos (cantidad y precio), que informa al usuario si el formato no es válido (ej: debe usar coma para decimales).
5.  **Indicadores de Carga Específicos:** La interfaz muestra un indicador de carga "skeleton" en los campos que se están actualizando, mejorando la experiencia de usuario durante las ediciones inline.
6.  **Resumen de Gastos Mejorado:** El resumen en la página principal ahora incluye el "Total restante sábado", además del total pagado y restante.
7.  **Botón Flotante (FAB):** Se ha añadido un botón `+` flotante en la esquina inferior para añadir nuevos productos de forma más rápida, un patrón de diseño común en móviles.

---

## Code Smells y Mejoras Técnicas

Durante el análisis del código, se han detectado varios "code smells" y áreas de mejora técnica. No se han corregido para mantener el alcance de la tarea, pero se documentan para futuras optimizaciones.

### Backend (`api/index.js`)

1.  **Hardcodeo de Rangos y Columnas:** El código está fuertemente acoplado a la estructura de la hoja de Google Sheets (ej: `range: 'A11:Z'`, `columna I para Estado`). Cualquier cambio en las columnas de la hoja romperá la API.
    *   **Mejora Sugerida:** Crear un mapa de configuración (ej: un JSON) que defina los nombres de las columnas y los rangos, de modo que el código los lea dinámicamente.
2.  **Enrutamiento Primitivo:** El uso de `if/else if` para gestionar las acciones (`update_status`, `add_product`, etc.) es poco escalable.
    *   **Mejora Sugerida:** Utilizar un objeto o un `Map` para mapear las `action` a sus funciones controladoras, limpiando el manejador principal.
3.  **Lógica de Actualización Redundante:** Existe una función específica para actualizar el precio (`handleUpdateUnitPrice`) y la cantidad (`handleUpdateQuantity`), pero esta lógica también está contenida en `handleUpdateDetails`.
    *   **Mejora Sugerida:** Refactorizar para que `handleUpdateDetails` reutilice las funciones más granulares o decidir un único método para las actualizaciones.
4.  **CORS Demasiado Permisivo:** `Access-Control-Allow-Origin: *` es inseguro para producción.
    *   **Mejora Sugerida:** Limitar el origen al dominio específico del frontend.
5.  **Falta de un Framework Real:** El código no utiliza un framework como Express (aunque se menciona en el `package.json`), lo que obliga a implementar manualmente funcionalidades básicas como el parseo del body (`getJsonBody`).

### Frontend (`client/src/ShoppingList.jsx`)

1.  **Componente "Dios" (`ShoppingList.jsx`):** Este componente maneja toda la lógica de la aplicación (estado, fetching de datos, modales, validaciones, renderizado), superando las 400 líneas. Esto lo hace difícil de leer, testear y mantener.
    *   **Mejora Sugerida:** Dividir el componente en sub-componentes más pequeños y especializados (ej: `Filters.jsx`, `ItemList.jsx`, `Item.jsx`, `Summary.jsx`).
2.  **Gestión de Estado Compleja con `useState`:** El uso de múltiples `useState` para estados interrelacionados (ej: `items`, `quantityValues`, `quantityErrors`) es propenso a errores y difícil de seguir.
    *   **Mejora Sugerida:** Utilizar `useReducer` para estados complejos o una librería de gestión de estado global (como Zustand o React Context) para la data principal (`items`, `summaryData`).
3.  **Refetching Ineficiente:** Cada actualización (cambiar estado, cantidad, etc.) provoca una recarga completa de todos los datos del servidor (`fetchData`). Esto es ineficiente y lento.
    *   **Mejora Sugerida:** Implementar actualizaciones optimistas (actualizar el estado localmente y luego sincronizar) o que la API devuelva el dato actualizado para modificar solo ese ítem en el estado local.
4.  **Hardcodeo de Claves de Objetos:** El código accede a propiedades usando strings que vienen de la API (ej: `item["Tipo de Elemento"]`). Si el nombre de la columna cambia, el frontend se romperá.
    *   **Mejora Sugerida:** Mapear los datos de la API a un modelo de datos consistente en el frontend al recibirlos.
5.  **Cálculos Repetitivos:** Las opciones para los filtros (`whenOptions`, `typeOptions`) se recalculan en cada renderizado.
    *   **Mejora Sugerida:** Utilizar el hook `useMemo` para memorizar estos cálculos y que solo se ejecuten cuando los `items` cambien.

---

## Tech Stack

*   **Frontend:** React, Vite
*   **Backend:** Node.js (Serverless Function)
*   **API:** Google Sheets API
*   **Deployment:** Vercel

## Project Structure

*   `/client`: Contains the React frontend application.
*   `/api`: Contains the Node.js serverless function.
*   `vercel.json`: Configures Vercel deployment.

## Prerequisites

*   Node.js (v18+)
*   Vercel CLI
*   A Google Cloud Platform project with the **Google Sheets API** enabled.

## Setup & Installation

(El resto de la configuración se mantiene igual)
(The rest of the setup instructions remain the same)
... (resto del README sin cambios)
