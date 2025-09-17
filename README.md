# Google Sheets Shopping List

This is a full-stack web application that provides a user-friendly interface to manage a shopping list stored in a Google Sheet. It allows for real-time updates, additions, and tracking of expenses without directly interacting with the Google Sheets interface.

## Features

*   **View Shopping List:** Displays items from the Google Sheet, grouped by category.
*   **Dynamic Search:** Instantly search for products in the list.
*   **Status Filtering:** Filter items by their current status (e.g., "Pending", "Purchased").
*   **Quick Edits:**
    *   Update item quantities directly from the list.
    *   Change the status of an item using a dropdown.
*   **Add & Edit Items:** A modal form allows for adding new products or editing the details of existing ones (description, notes, unit price, type).
*   **Expense Summary:** View a summary of total expenses, including "Total Paid" and "Total Remaining".
*   **Responsive UI:** A clean, responsive interface for both desktop and mobile use.

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
