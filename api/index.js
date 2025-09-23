import Bugsnag from "@bugsnag/js";
import { google } from "googleapis";
import crypto from "crypto";

Bugsnag.start({ apiKey: process.env.BUGSNAG_API_KEY });

// Helper to parse JSON body from requests
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => resolve(JSON.parse(body)));
    req.on("error", (err) => reject(err));
  });
}

async function getAuth() {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error("GOOGLE_CREDENTIALS environment variable not set.");
  }
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, "\n"),
    },
    // The scope must now allow writing
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;
const HISTORY_SHEET_NAME = "Historial de cambios";

async function ensureHistorySheetExists(sheets) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheetExists = spreadsheet.data.sheets.some(
    (s) => s.properties.title === HISTORY_SHEET_NAME
  );

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: HISTORY_SHEET_NAME,
              },
            },
          },
        ],
      },
    });
    // Add header row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${HISTORY_SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      resource: {
        values: [["Timestamp", "User", "Action", "Details"]],
      },
    });
  }
}

async function logChange(sheets, user, action, details) {
  const timestamp = new Date().toISOString();
  // Sanitize user input to prevent formula injection
  const sanitizedUser = String(user || "Unknown").startsWith("=") ? `'${user}` : user;
  const sanitizedAction = String(action || "Unknown").startsWith("=") ? `'${action}` : action;
  const sanitizedDetails = String(details || "").startsWith("=") ? `'${details}` : details;

  const logEntry = [[timestamp, sanitizedUser, sanitizedAction, sanitizedDetails]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${HISTORY_SHEET_NAME}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: logEntry,
      },
    });
  } catch (error) {
    console.error("Failed to log change:", error);
    // Decide if you want to throw the error or just log it
    // For now, just log it and continue
  }
}

// Main handler
export default async function handler(request, response) {
  // Validate environment variables
  if (!SPREADSHEET_ID || !SHEET_NAME) {
    console.error("Missing SPREADSHEET_ID or SHEET_NAME in environment variables.");
    return response.status(500).json({
      error: "Server configuration error: Missing spreadsheet configuration.",
    });
  }
  // Set CORS headers for all responses
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Set cache-busting headers
  response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");

  if (request.method === "OPTIONS") {
    return response.status(200).end();
  }

  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    if (request.method === "POST") {
      await ensureHistorySheetExists(sheets);
      const body = await getJsonBody(request);
      // Route POST requests based on an 'action' property in the body
      if (body.action === "update_quantity") {
        await handleUpdateQuantity(response, sheets, body);
      } else if (body.action === "update_details") {
        await handleUpdateDetails(response, sheets, body);
      } else if (body.action === "update_unit_price") {
        await handleUpdateUnitPrice(response, sheets, body);
      } else if (body.action === "add_product") {
        await handleAddNewProduct(response, sheets, body);
      } else if (body.action === "bulk_update") {
        await handleBulkUpdate(response, sheets, body);
      } else {
        // Default POST action is to update status
        await handleUpdateStatus(response, sheets, body);
      }
    } else if (request.method === "GET") {
      const action = request.query.action;
      if (action === "get_options") {
        await handleGetStatusOptions(request, response, sheets);
      } else if (action === "get_summary") {
        await handleGetSummary(request, response, sheets);
      } else if (action === "get_hash") {
        await handleGetHash(request, response, sheets);
      } else if (action === "get_members") {
        await handleGetMembers(request, response, sheets);
      } else if (action === "get_sheet_title") {
        await handleGetSheetTitle(request, response, sheets);
      } else {
        await handleGetItems(request, response, sheets);
      }
    } else {
      response.status(405).send({ error: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("API Error:", error);
    Bugsnag.notify(error);
    response
      .status(500)
      .json({ error: "An API error occurred.", details: error.message });
  }
}

// Fetches the spreadsheet title
async function handleGetSheetTitle(req, res, sheets) {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const title = spreadsheet.data.properties.title;
    res.status(200).json({ title });
  } catch (error) {
    console.error("Failed to get spreadsheet title:", error);
    res.status(500).json({
      error: "Failed to get spreadsheet title.",
      details: error.message,
    });
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
        rowData[key] = row[i] || "";
      }
    });
    // Add the actual row index from the sheet
    rowData.rowIndex = 11 + 1 + index; // 11 (start) + 1 (for header) + index
    return rowData;
  });

  res.status(200).json(data);
}

// Fetches all items and returns a hash of the data
async function handleGetHash(req, res, sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A11:Z`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    // Return a consistent hash for an empty dataset
    const hash = crypto.createHash("sha256").update("[]").digest("hex");
    return res.status(200).json({ hash });
  }

  const header = rows[0];
  const data = rows.slice(1).map((row, index) => {
    const rowData = {};
    header.forEach((key, i) => {
      if (key) {
        rowData[key] = row[i] || "";
      }
    });
    // Add the actual row index from the sheet
    rowData.rowIndex = 11 + 1 + index; // 11 (start) + 1 (for header) + index
    return rowData;
  });

  const dataString = JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(dataString).digest("hex");

  res.status(200).json({ hash });
}

// Fetches unique, non-empty status options from the 'Estado' column (Column I)
async function handleGetStatusOptions(req, res, sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!I12:I`, // Start from row 12 to get only data
  });

  const rows = response.data.values;
  let uniqueOptions = new Set();

  if (rows) {
    // Flatten the array and filter out any empty values
    uniqueOptions = new Set(rows.flat().filter((val) => val));
  }

  // Always ensure the default statuses are present.
  // The Set will handle duplicates automatically.
  const defaultStatuses = ["Pendiente", "Comprado"];
  defaultStatuses.forEach((status) => uniqueOptions.add(status));

  res.status(200).json([...uniqueOptions]);
}

// Updates the status of a specific row
async function handleUpdateStatus(res, sheets, body) {
  const { rowIndex, newStatus, user } = body;

  if (!rowIndex || newStatus === undefined) {
    return res
      .status(400)
      .json({ error: "rowIndex and newStatus are required." });
  }

  // 'Estado' is column I
  const range = `${SHEET_NAME}!I${rowIndex}`;
  const descriptionRange = `${SHEET_NAME}!D${rowIndex}`;

  try {
    // Fetch product description for logging
    const descriptionResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: descriptionRange,
    });
    const description = descriptionResponse.data.values?.[0]?.[0] || `Row ${rowIndex}`;

    // Fetch the old status for logging
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });
    const oldStatus = getResponse.data.values?.[0]?.[0] || "";

    // Update the status
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[newStatus]],
      },
    });

    // Log the change
    if (oldStatus !== newStatus) {
      await logChange(
        sheets,
        user,
        "Update Status",
        `Product "${description}" status changed from "${oldStatus}" to "${newStatus}"`
      );
    }

    res.status(200).json({
      success: true,
      message: `Row ${rowIndex} status updated to ${newStatus}`,
    });
  } catch (error) {
    console.error("Failed to update status:", error);
    res
      .status(500)
      .json({ error: "Failed to update status.", details: error.message });
  }
}

// Updates the quantity of a specific row
async function handleUpdateQuantity(res, sheets, body) {
  const { rowIndex, newQuantity, user } = body;

  if (!rowIndex || newQuantity === undefined) {
    return res
      .status(400)
      .json({ error: "rowIndex and newQuantity are required." });
  }

  // 'Cantidad' is column E
  const range = `${SHEET_NAME}!E${rowIndex}`;
  const descriptionRange = `${SHEET_NAME}!D${rowIndex}`;

  try {
    // Fetch product description for logging
    const descriptionResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: descriptionRange,
    });
    const description = descriptionResponse.data.values?.[0]?.[0] || `Row ${rowIndex}`;

    // Fetch the old quantity for logging
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });
    const oldQuantity = getResponse.data.values?.[0]?.[0] || "";

    // Update the quantity
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[newQuantity]],
      },
    });

    // Log the change
    if (oldQuantity !== newQuantity) {
      await logChange(
        sheets,
        user,
        "Update Quantity",
        `Product "${description}" quantity changed from "${oldQuantity}" to "${newQuantity}"`
      );
    }

    res.status(200).json({
      success: true,
      message: `Row ${rowIndex} quantity updated to ${newQuantity}`,
    });
  } catch (error) {
    console.error("Failed to update quantity:", error);
    res
      .status(500)
      .json({ error: "Failed to update quantity.", details: error.message });
  }
}

// Updates the unit price of a specific row
async function handleUpdateUnitPrice(res, sheets, body) {
  const { rowIndex, newUnitPrice, user } = body;

  if (!rowIndex || newUnitPrice === undefined) {
    return res
      .status(400)
      .json({ error: "rowIndex and newUnitPrice are required." });
  }

  // 'Precio unidad' is column F
  const range = `${SHEET_NAME}!F${rowIndex}`;
  const descriptionRange = `${SHEET_NAME}!D${rowIndex}`;

  try {
    // Fetch product description for logging
    const descriptionResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: descriptionRange,
    });
    const description = descriptionResponse.data.values?.[0]?.[0] || `Row ${rowIndex}`;

    // Fetch the old unit price for logging
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });
    const oldUnitPrice = getResponse.data.values?.[0]?.[0] || "";

    // Update the unit price
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[newUnitPrice]],
      },
    });

    // Log the change
    if (oldUnitPrice !== newUnitPrice) {
      await logChange(
        sheets,
        user,
        "Update Unit Price",
        `Product "${description}" unit price changed from "${oldUnitPrice}" to "${newUnitPrice}"`
      );
    }

    res.status(200).json({
      success: true,
      message: `Row ${rowIndex} unit price updated to ${newUnitPrice}`,
    });
  } catch (error) {
    console.error("Failed to update unit price:", error);
    res
      .status(500)
      .json({ error: "Failed to update unit price.", details: error.message });
  }
}

// Updates the description, notes, unit price, type and when of a specific row
async function handleUpdateDetails(res, sheets, body) {
  const {
    rowIndex,
    newDescription,
    newNotes,
    newUnitPrice,
    newQuantity,
    newType,
    newAssignedTo,
    newLugarDeCompra,
    user,
  } = body;

  if (
    !rowIndex ||
    newDescription === undefined ||
    newNotes === undefined ||
    newUnitPrice === undefined ||
    newQuantity === undefined ||
    newType === undefined ||
    newAssignedTo === undefined ||
    newLugarDeCompra === undefined
  ) {
    return res
      .status(400)
      .json({ error: "rowIndex and all new detail fields are required." });
  }

  const fieldsToUpdate = {
    A: { value: newLugarDeCompra, name: "Lugar de Compra" },
    B: { value: newType, name: "Tipo de Elemento" },
    C: { value: newAssignedTo, name: "Asignado a" },
    D: { value: newDescription, name: "Descripción" },
    E: { value: newQuantity, name: "Cantidad" },
    F: { value: newUnitPrice, name: "Precio unidad" },
    H: { value: newNotes, name: "Notas" },
  };

  try {
    const oldValuesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex}:H${rowIndex}`,
    });
    const oldValues = oldValuesResponse.data.values?.[0] || [];
    const oldProductDescription = oldValues[3] || `Row ${rowIndex}`;

    const oldData = {
      A: oldValues[0] || "",
      B: oldValues[1] || "",
      C: oldValues[2] || "",
      D: oldValues[3] || "",
      E: oldValues[4] || "",
      F: oldValues[5] || "",
      H: oldValues[7] || "",
    };

    const updatePromises = Object.entries(fieldsToUpdate).map(
      ([column, { value }]) =>
        sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${column}${rowIndex}`,
          valueInputOption: "USER_ENTERED",
          resource: { values: [[value]] },
        })
    );

    await Promise.all(updatePromises);

    const changes = Object.entries(fieldsToUpdate)
      .map(([column, { value, name }]) => {
        if (String(oldData[column]) !== String(value)) {
          return `field "${name}" from "${oldData[column]}" to "${value}"`;
        }
        return null;
      })
      .filter(Boolean);

    if (changes.length > 0) {
      await logChange(
        sheets,
        user,
        "Update Details",
        `Product "${oldProductDescription}" updated: ${changes.join(", ")}`
      );
    }

    res
      .status(200)
      .json({ success: true, message: `Row ${rowIndex} details updated.` });
  } catch (error) {
    console.error("Failed to update details:", error);
    res
      .status(500)
      .json({ error: "Failed to update details.", details: error.message });
  }
}

// Appends a new product row to the sheet using a more robust get-then-update method
async function handleAddNewProduct(res, sheets, body) {
  const {
    newDescription,
    newType,
    newUnitPrice,
    newQuantity,
    newNotes,
    newAssignedTo,
    newLugarDeCompra,
    user,
  } = body;

  if (
    newDescription === undefined ||
    newType === undefined ||
    newUnitPrice === undefined ||
    newQuantity === undefined ||
    newNotes === undefined ||
    newAssignedTo === undefined ||
    newLugarDeCompra === undefined
  ) {
    return res.status(400).json({
      error:
        "newDescription, newType, newUnitPrice, newQuantity, newNotes, newAssignedTo and newLugarDeCompra are required.",
    });
  }

  try {
    // 1. Find the next empty row by checking the length of a column (e.g., D for Description)
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!D11:D`, // Check from D11 downwards
    });
    const numRows = getResponse.data.values
      ? getResponse.data.values.length
      : 0;
    const newRowIndex = 11 + numRows; // The new row will be after the last data row

    // 2. Construct the formula for the Total column (G)
    const totalFormula = `=E${newRowIndex}*F${newRowIndex}`;

    // 3. Construct the new row in the correct column order (A-I).
    const newRow = [
      newLugarDeCompra, // A: Lugar de Compra
      newType, // B: Tipo de Elemento
      newAssignedTo, // C: Asignado a
      newDescription, // D: Descripción
      newQuantity, // E: Cantidad
      newUnitPrice, // F: Precio unidad
      totalFormula, // G: Total (calculated by formula)
      newNotes, // H: Notas
      "", // I: Estado
    ];

    // 4. Update the specific new row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${newRowIndex}:I${newRowIndex}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [newRow],
      },
    });

    // Log the change
    await logChange(
      sheets,
      user,
      "Add Product",
      `New product added: "${newDescription}"`
    );

    res
      .status(200)
      .json({ success: true, message: "Product added successfully." });
  } catch (error) {
    console.error("Failed to add new product:", error);
    res
      .status(500)
      .json({ error: "Failed to add new product.", details: error.message });
  }
}

// Handles bulk updates for multiple rows
async function handleBulkUpdate(res, sheets, body) {
  const { rowIndexes, newType, newAssignedTo, newStatus, newLugarDeCompra, user } =
    body;

  if (
    !rowIndexes ||
    !Array.isArray(rowIndexes) ||
    rowIndexes.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "rowIndexes array is required." });
  }

  const fieldsToUpdate = {
    A: { value: newLugarDeCompra, name: "Lugar de Compra" },
    B: { value: newType, name: "Tipo de Elemento" },
    C: { value: newAssignedTo, name: "Asignado a" },
    I: { value: newStatus, name: "Estado" },
  };

  const data = [];
  for (const [column, { value }] of Object.entries(fieldsToUpdate)) {
    if (value) {
      for (const rowIndex of rowIndexes) {
        data.push({
          range: `${SHEET_NAME}!${column}${rowIndex}`,
          values: [[value]],
        });
      }
    }
  }

  if (data.length === 0) {
    return res
      .status(400)
      .json({ error: "No fields to update were provided." });
  }

  try {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        valueInputOption: "USER_ENTERED",
        data,
      },
    });

    // Log the change
    const updatedFields = Object.entries(fieldsToUpdate)
      .filter(([, { value }]) => value)
      .map(([, { name }]) => name)
      .join(", ");

    await logChange(
      sheets,
      user,
      "Bulk Update",
      `Updated ${rowIndexes.length} products. Changed fields: ${updatedFields}`
    );

    res.status(200).json({
      success: true,
      message: `${rowIndexes.length} rows updated successfully.`,
    });
  } catch (error) {
    console.error("Failed to perform bulk update:", error);
    res.status(500).json({
      error: "Failed to perform bulk update.",
      details: error.message,
    });
  }
}

// Fetches and parses the budget summary from the top of the sheet
async function handleGetSummary(req, res, sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    // The range is now A1:B10 because columns B and C were deleted.
    range: `${SHEET_NAME}!A1:B10`,
  });

  const rows = response.data.values;
  if (!rows) {
    return res.status(200).json([]);
  }

  const summaryData = rows
    .map((row) => ({
      label: row[0] || "",
      // Find the first non-empty value in the other columns for that row
      value: row.slice(1).find((val) => val) || "",
    }))
    .filter((item) => item.label && item.value); // Filter out rows without a label or a value

  res.status(200).json(summaryData);
}

// Fetches members from the 'Miembros' sheet
async function handleGetMembers(req, res, sheets) {
  const MEMBERS_SHEET_NAME = "Miembros";
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MEMBERS_SHEET_NAME}!A10:D`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return res.status(200).json([]);
  }

  const header = rows[0];
  const memberColIndex = header.indexOf("Miembro");
  const accessColIndex = header.indexOf("¿Acceso App?");

  if (memberColIndex === -1 || accessColIndex === -1) {
    return res.status(500).json({ error: "Required columns not found in Miembros sheet." });
  }

  const members = rows.slice(1).map(row => ({
    name: row[memberColIndex],
    access: row[accessColIndex]
  })).filter(member => member.name); // Filter out rows without a name

  res.status(200).json(members);
}
