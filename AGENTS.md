# AGENTS.md

## 🛠️ Purpose
This document describes the main agents (modules) of the **BuyBuddies** project, their responsibilities, and how they interact with each other.  
It serves as a reference for both the development team and automated tools (like Jules).

---

## 📦 Backend (`/api`)
- **index.js**
  - Entry point for backend functions (Vercel API routes).
  - Handles HTTP requests related to the shopping list and synchronization with the data source (Google Sheets or a future database).
  - **Input:** `req`, `res` (HTTP requests).
  - **Output:** JSON with the result of the operation (items, purchase states, errors).

---

## 🎨 Frontend (`/client`)

### App.jsx
- Root component orchestrating navigation and main rendering.
- Connects with contexts (`RouterContext`, `CookieConsentContext`).

### Main Components
- **ShoppingList.jsx** → Renders the shopping list with search, filters, and purchase status.
- **BulkEditModal.jsx**, **EditModal.jsx**, **ChangesModal.jsx**, **SummaryModal.jsx** → Manage editing and summary workflows through modals.
- **LoginModal.jsx**, **LogoutModal.jsx** → Handle authentication workflows.
- **CookiePolicy.jsx**, **CookiePolicyModal.jsx**, **components/CookieConsent/** → Manage cookie policy and user consent.

### Contexts
- **CookieConsentContext.jsx** → Global state for cookie consent.
- **RouterContext.jsx** → Internal routing management.

### Hooks
- **useCookieConsent.js** → Custom hook for consuming `CookieConsentContext`.

### Utilities
- **validation.js** → Form/data validation functions.
- **bugsnag.js** → Initialization and configuration of the error monitoring agent (Bugsnag).

---

## 🌐 Communication between agents
1. **Frontend** calls the **backend (`/api/index.js`)** using fetch/AJAX to load or modify products.
2. **Global state** (contexts) is shared across UI components.
3. **Bugsnag** acts as an external agent to capture and report errors.
4. **Cookie consent** controls which external scripts may execute.

---

## 📖 Conventions
- **API response format:** JSON with keys `success`, `data`, `error`.
- **UI components:** written in React + JSX.
- **Code style:** enforced by ESLint + Prettier.
- **Tests:** (TBD) using mocks for API and Google Sheets simulation.
