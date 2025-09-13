import { google } from 'googleapis';
// This function will be executed by Vercel
export default async function handler(request, response) {
  // Set CORS headers to allow requests from any origin
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const SPREADSHEET_ID = '1JreOZme2oRPrsvXnxKsTZMGq3-GrbSUS2_M3nw3gM7U';
  const SHEET_NAME = "'Lista compra 2025'";

  try {
    // The credentials are now stored in a Vercel environment variable
    if (!process.env.GOOGLE_CREDENTIALS) {
      throw new Error('GOOGLE_CREDENTIALS environment variable not set.');
    }

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch the data from the sheet
    const sheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
    });

    const rows = sheetResponse.data.values;
    if (rows && rows.length > 1) {
      const header = rows[0];
      const data = rows.slice(1).map(row => {
        let rowData = {};
        header.forEach((key, index) => {
          if (key) { // Only process columns that have a header
            rowData[key] = row[index] || '';
          }
        });
        return rowData;
      });
      response.status(200).json(data);
    } else {
      // No data found or only a header row exists
      response.status(200).json([]);
    }
  } catch (error) {
    console.error('The API returned an error:', error);
    // Send a more structured error response
    response.status(500).json({
      error: 'Failed to fetch data from Google Sheets.',
      details: error.message
    });
  }
}
