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

3.  **Configure Environment Variables:**
    *   In the `api/index.js` file, replace the placeholder `SPREADSHEET_ID` with your actual spreadsheet ID.
    ```javascript
    const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
    ```
    *   Create a `.env` file in the root of the project.
    *   Copy the contents of the downloaded JSON key file and add it to the `.env` file as a single line:
    ```
    GOOGLE_CREDENTIALS=PASTE_JSON_CONTENT_HERE
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
    *   Add the `GOOGLE_CREDENTIALS` variable with the content of your service account JSON key.
4.  Deploy! Vercel will automatically detect the `vercel.json` configuration and deploy the frontend and the serverless function.
