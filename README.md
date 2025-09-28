# Google Sheets Shopping List

This is a full-stack web application that provides a user-friendly interface to manage a shopping list stored in a Google Sheet. It allows for real-time updates, additions, and tracking of expenses without directly interacting with the Google Sheets interface.

## Features

*   **View Shopping List:** Displays items from the Google Sheet.
*   **Dynamic Grouping:** Organizes the shopping list by "Type" or "When" for better clarity.
*   **Dynamic Search:** Instantly search for products in the list.
*   **Advanced Filtering:** Filter items by their status (e.g., "Pending", "Purchased"), type, or purchase date.
*   **Quick Edits (Inline):**
    *   Update item quantities and unit prices directly from the list view, with specific loading indicators for a smooth user experience.
    *   Change the status of an item using a dropdown.
    *   Includes client-side validation to ensure only valid decimal numbers (using a comma) are submitted.
*   **Add & Edit Items:** A modal form allows for adding new products or editing the details of existing ones (description, notes, unit price, quantity, type, and when).
*   **Detailed Expense Summary:** View a detailed summary of expenses directly on the main page and in a separate modal, including "Total Paid," "Total Remaining," and "Total Remaining for Saturday."
*   **Responsive UI:** A clean, responsive interface with a floating action button for quickly adding items, suitable for both desktop andmobile use.

## Code Smells and Technical Debt

During a recent analysis, several "code smells" and areas for technical improvement were identified. They are documented here for future optimization efforts.

### Backend (`api/index.js`)

1.  **Hardcoded Ranges and Columns:** The code is tightly coupled to the Google Sheet's structure (e.g., `range: 'A11:Z'`, `column I for Status`). Any changes to the sheet's layout will break the API.
    *   **Suggested Improvement:** Create a configuration map (e.g., a JSON object) that defines column names and ranges, allowing the code to read them dynamically.
2.  **Primitive Routing:** The use of `if/else if` to handle actions (`update_status`, `add_product`, etc.) is not easily scalable.
    *   **Suggested Improvement:** Use an object or a `Map` to map action strings to their handler functions, cleaning up the main request handler.
3.  **Redundant Update Logic:** There are specific functions to update price (`handleUpdateUnitPrice`) and quantity (`handleUpdateQuantity`), but this logic is also contained within `handleUpdateDetails`.
    *   **Suggested Improvement:** Refactor so that `handleUpdateDetails` reuses the more granular functions, or decide on a single method for all updates to reduce redundancy.
4.  **Overly Permissive CORS:** `Access-Control-Allow-Origin: *` is insecure for a production environment.
    *   **Suggested Improvement:** Restrict the origin to the specific domain of the frontend application.

### Frontend (`client/src/ShoppingList.jsx`)

1.  **God Component (`ShoppingList.jsx`):** This component handles all application logic (state, data fetching, modals, validation, rendering), making it over 400 lines long. This is difficult to read, test, and maintain.
    *   **Suggested Improvement:** Break down the component into smaller, specialized sub-components (e.g., `Filters.jsx`, `ItemList.jsx`, `Item.jsx`, `Summary.jsx`).
2.  **Complex State Management with `useState`:** The use of multiple `useState` hooks for interrelated states (e.g., `items`, `quantityValues`, `quantityErrors`) is error-prone.
    *   **Suggested Improvement:** Use the `useReducer` hook for complex state logic or a global state management library (like Zustand or React Context) for application-wide data (`items`, `summaryData`).
3.  **Inefficient Data Fetching:** Every update (changing status, quantity, etc.) triggers a complete refetch of all data from the server (`fetchData`). This is inefficient and can make the UI feel sluggish.
    *   **Suggested Improvement:** Implement optimistic updates (update the local state immediately and then sync with the server) or have the API return the updated item to only modify that single item in the local state.
4.  **Hardcoded Object Keys:** The code accesses properties using string literals from the API response (e.g., `item["Tipo de Elemento"]`). If the column name in the Google Sheet changes, the frontend will break.
    *   **Suggested Improvement:** Map the API data to a consistent data model on the frontend upon receipt.
5.  **Repetitive Calculations:** The options for the filters (`whenOptions`, `typeOptions`) are recalculated on every render.
    *   **Suggested Improvement:** Use the `useMemo` hook to memoize these calculations so they only run when the `items` data actually changes.

## Tech Stack

*   **Frontend:**
    *   React
    *   Vite
*   **Backend:**
    *   Node.js
    *   Express.js (used in the Vercel serverless function environment)
*   **API:**
    *   Google Sheets API
*   **Deployment:**
    *   Vercel

## Project Structure

The project is organized into two main directories:

*   `/client`: Contains the React frontend application.
*   `/api`: Contains the Node.js serverless function that connects to the Google Sheets API.

The `vercel.json` file in the root configures Vercel to build the client and deploy the serverless function, with rewrite rules to direct traffic appropriately.

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [Vercel CLI](https://vercel.com/docs/cli) (for deployment)

You will also need a Google Cloud Platform project with the **Google Sheets API** enabled.

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Set up Google Cloud Credentials:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
    *   Enable the **Google Sheets API** for your project.
    *   Create a **Service Account**. Go to "Credentials", click "Create Credentials", and select "Service Account".
    *   Download the JSON key file for the service account.
    *   Open the Google Sheet you want to use and share it with the `client_email` found in the downloaded JSON file, giving it "Editor" permissions.
    *   Get your **Spreadsheet ID** from the URL of your Google Sheet: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
    *   Take note of the **Sheet Name** (the name of the tab in your spreadsheet, e.g., 'Sheet1').

3.  **Configure Environment Variables:**
    *   Create a `.env` file in the root of the project.
    *   Add the following variables to the `.env` file:

    ```
    # The full content of the JSON key file downloaded from Google Cloud
    GOOGLE_CREDENTIALS=PASTE_JSON_CONTENT_HERE

    # The ID of your Google Sheet
    SPREADSHEET_ID=YOUR_SPREADSHEET_ID

    # The name of the sheet (tab) you want to use
    SHEET_NAME='Your Sheet Name'
    ```
    > **Important:** The private key within the JSON content has newline characters (`\n`). These must be preserved when pasting into the `.env` file. The backend script handles their conversion.

4.  **Install Dependencies:**
    *   Install root dependencies (for the server):
    ```bash
    npm install
    ```
    *   Install client dependencies:
    ```bash
    cd client
    npm install
    ```

## Running the Application

This project is configured to run with the Vercel CLI for a development environment that mirrors the production serverless setup.

1.  Start the development server from the root directory:
    ```bash
    vercel dev
    ```
2.  The application will be available at the URL provided by the Vercel CLI (usually `http://localhost:3000`).

## Deployment

This application is designed to be deployed on Vercel.

1.  Push your code to a Git repository (GitHub, GitLab, etc.).
2.  Import the project into Vercel.
3.  **Configure Environment Variables in Vercel:**
    *   Go to your project's settings in the Vercel dashboard.
    *   Navigate to the "Environment Variables" section.
    *   Add the following environment variables:
        *   `GOOGLE_CREDENTIALS`: The content of your service account JSON key.
        *   `SPREADSHEET_ID`: The ID of your Google Sheet.
        *   `SHEET_NAME`: The name of your sheet.
4.  Deploy! Vercel will automatically detect the `vercel.json` configuration and deploy the frontend and the serverless function.

## API Endpoints

The backend API is a single serverless function that handles different actions based on the request method and body.

*   **`GET /api`**
    *   **Description:** Fetches all items from the shopping list.
    *   **Response:** A JSON array of item objects.

*   **`GET /api?action=get_options`**
    *   **Description:** Fetches the unique status options from the 'Estado' column.
    *   **Response:** A JSON array of strings.

*   **`GET /api?action=get_summary`**
    *   **Description:** Fetches the summary data from the top of the sheet.
    *   **Response:** A JSON array of key-value pairs.

*   **`POST /api`**
    *   **Description:** Performs an update or add action based on the `action` field in the request body.
    *   **Common Body Shape:** `{ "action": "action_name", ...payload }`
    *   **Actions:**
        *   `update_status`: Updates the status of an item.
            *   **Payload:** `{ "rowIndex": number, "newStatus": string }`
        *   `update_quantity`: Updates the quantity of an item.
            *   **Payload:** `{ "rowIndex": number, "newQuantity": number }`
        *   `update_details`: Updates the details of an item.
            *   **Payload:** `{ "rowIndex": number, "newDescription": string, "newNotes": string, "newUnitPrice": number, "newType": string, "newWhen": string }`
        *   `add_product`: Adds a new product to the list.
            *   **Payload:** `{ "newDescription": string, "newNotes": "string", "newUnitPrice": number, "newType": string, "newWhen": string }`
