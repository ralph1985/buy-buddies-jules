import { google } from 'googleapis';

// Helper to parse JSON body from requests
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(JSON.parse(body)));
    req.on('error', err => reject(err));
  });
}

async function getAuth() {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_CREDENTIALS environment variable not set.');
  }
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, '\n'),
    },
    // The scope must now allow writing
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const SPREADSHEET_ID = '1JreOZme2oRPrsvXnxKsTZMGq3-GrbSUS2_M3nw3gM7U';
const SHEET_NAME = "'Lista compra 2025'";

// Main handler
export default async function handler(request, response) {
  // Set CORS headers for all responses
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    if (request.method === 'POST') {
      const body = await getJsonBody(request);
      // Route POST requests based on an 'action' property in the body
      if (body.action === 'update_quantity') {
        await handleUpdateQuantity(response, sheets, body);
      } else {
        // Default POST action is to update status
        await handleUpdateStatus(response, sheets, body);
      }
    } else if (request.method === 'GET') {
      if (request.query.action === 'get_options') {
        await handleGetStatusOptions(request, response, sheets);
      } else {
        await handleGetItems(request, response, sheets);
      }
    } else {
      response.status(405).send({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    response.status(500).json({ error: 'An API error occurred.', details: error.message });
  }
}

// Fetches all items and includes their row index
async function handleGetItems(req, res, sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A11:Z`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return res.status(200).json([]);
  }

  const header = rows[0];
  const data = rows.slice(1).map((row, index) => {
    const rowData = {};
    header.forEach((key, i) => {
      if (key) {
        rowData[key] = row[i] || '';
      }
    });
    // Add the actual row index from the sheet
    rowData.rowIndex = 11 + 1 + index; // 11 (start) + 1 (for header) + index
    return rowData;
  });

  res.status(200).json(data);
}

// Fetches unique, non-empty status options from the 'Estado' column (Column K)
async function handleGetStatusOptions(req, res, sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!K12:K`, // Start from row 12 to get only data
  });

  const rows = response.data.values;
  if (!rows) {
    return res.status(200).json([]);
  }

  // Use a Set to get unique, non-empty values
  const uniqueOptions = new Set(rows.flat().filter(val => val));
  res.status(200).json([...uniqueOptions]);
}

// Updates the status of a specific row
async function handleUpdateStatus(res, sheets, body) {
  const { rowIndex, newStatus } = body;

  if (!rowIndex || newStatus === undefined) {
    return res.status(400).json({ error: 'rowIndex and newStatus are required.' });
  }

  // 'Estado' is column K
  const range = `${SHEET_NAME}!K${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[newStatus]],
    },
  });

  res.status(200).json({ success: true, message: `Row ${rowIndex} status updated to ${newStatus}` });
}

// Updates the quantity of a specific row
async function handleUpdateQuantity(res, sheets, body) {
  const { rowIndex, newQuantity } = body;

  if (!rowIndex || newQuantity === undefined) {
    return res.status(400).json({ error: 'rowIndex and newQuantity are required.' });
  }

  // 'Cantidad' is column G
  const range = `${SHEET_NAME}!G${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[newQuantity]],
    },
  });

  res.status(200).json({ success: true, message: `Row ${rowIndex} quantity updated to ${newQuantity}` });
}
