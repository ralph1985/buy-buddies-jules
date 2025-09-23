import Bugsnag from "@bugsnag/js";
import { google } from "googleapis";
import crypto from "crypto";

Bugsnag.start({ apiKey: process.env.BUGSNAG_API_KEY });

const COLUMN = {
  LUGAR_DE_COMPRA: "Lugar de Compra",
  TIPO_DE_ELEMENTO: "Tipo de Elemento",
  ASIGNADO_A: "Asignado a",
  DESCRIPCION: "Descripción",
  CANTIDAD: "Cantidad",
  PRECIO_UNIDAD: "Precio unidad",
  TOTAL: "Total",
  NOTAS: "Notas",
  ESTADO: "Estado",
  MIEMBRO: "Miembro",
  ACCESO_APP: "¿Acceso App?",
};

const LOG_ACTIONS = {
  UPDATE_STATUS: "Update Status",
  UPDATE_QUANTITY: "Update Quantity",
  UPDATE_UNIT_PRICE: "Update Unit Price",
  UPDATE_DETAILS: "Update Details",
  ADD_PRODUCT: "Add Product",
  BULK_UPDATE: "Bulk Update",
};

const MEMBERS_SHEET_NAME = "Miembros";
const HISTORY_SHEET_NAME = "Historial de cambios";
const DEFAULT_STATUSES = ["Pendiente", "Comprado"];

// Helper to parse JSON body from requests
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => resolve(JSON.parse(body)));
    req.on("error", (err) => reject(err));
  });
}

// A cache for headers to avoid fetching them on every request.
let headerCache = null;

async function getHeaders(sheets) {
  if (headerCache) {
    return headerCache;
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A11:Z11`, // Assuming headers are in row 11
  });

  const headerArray = response.data.values[0];
  const headerMap = {};
  headerArray.forEach((header, index) => {
    if (header) {
      headerMap[header] = index;
    }
  });

  headerCache = { headerMap, headerArray };
  return headerCache;
}

function columnIndexToLetter(index) {
  let letter = "";
  while (index >= 0) {
    const temp = index % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
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

const ACTIONS = {
  UPDATE_STATUS: "update_status",
  UPDATE_DETAILS: "update_details",
  UPDATE_QUANTITY: "update_quantity",
  UPDATE_UNIT_PRICE: "update_unit_price",
  ADD_PRODUCT: "add_product",
  BULK_UPDATE: "bulk_update",
  GET_OPTIONS: "get_options",
  GET_SUMMARY: "get_summary",
  GET_HASH: "get_hash",
  GET_MEMBERS: "get_members",
  GET_ITEMS: "get_items",
};

const POST_ACTION_HANDLERS = {
  [ACTIONS.UPDATE_QUANTITY]: handleUpdateQuantity,
  [ACTIONS.UPDATE_DETAILS]: handleUpdateDetails,
  [ACTIONS.UPDATE_UNIT_PRICE]: handleUpdateUnitPrice,
  [ACTIONS.ADD_PRODUCT]: handleAddNewProduct,
  [ACTIONS.BULK_UPDATE]: handleBulkUpdate,
};

const GET_ACTION_HANDLERS = {
  [ACTIONS.GET_OPTIONS]: handleGetStatusOptions,
  [ACTIONS.GET_SUMMARY]: handleGetSummary,
  [ACTIONS.GET_HASH]: handleGetHash,
  [ACTIONS.GET_MEMBERS]: handleGetMembers,
};

// Main handler
export default async function handler(request, response) {
  // Validate environment variables
  if (!SPREADSHEET_ID || !SHEET_NAME) {
    console.error(
      "Missing SPREADSHEET_ID or SHEET_NAME in environment variables."
    );
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
      const action = body.action;
      const handler = POST_ACTION_HANDLERS[action];

      if (handler) {
        await handler(response, sheets, body);
      } else if (!action || action === ACTIONS.UPDATE_STATUS) {
        // Default POST action is to update status
        await handleUpdateStatus(response, sheets, body);
      } else {
        response.status(400).json({ error: `Invalid POST action: ${action}` });
      }
    } else if (request.method === "GET") {
      const action = request.query.action;
      const handler = GET_ACTION_HANDLERS[action];

      if (handler) {
        await handler(request, response, sheets);
      } else if (!action || action === ACTIONS.GET_ITEMS) {
        // Default GET action is to get items
        await handleGetItems(request, response, sheets);
      } else {
        response.status(400).json({ error: `Invalid GET action: ${action}` });
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

// Fetches and processes all data from the main sheet
async function getSheetData(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A11:Z`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
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
  return data;
}

// Fetches all items and includes their row index
async function handleGetItems(req, res, sheets) {
  const data = await getSheetData(sheets);
  res.status(200).json(data);
}

// Fetches all items and returns a hash of the data
async function handleGetHash(req, res, sheets) {
  const data = await getSheetData(sheets);
  const dataString = JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(dataString).digest("hex");
  res.status(200).json({ hash });
}

// Fetches unique, non-empty status options from the 'Estado' column
async function handleGetStatusOptions(req, res, sheets) {
  const { headerMap } = await getHeaders(sheets);
  const statusColIndex = headerMap[COLUMN.ESTADO];
  if (statusColIndex === undefined) {
    return res
      .status(500)
      .json({ error: `Could not find column "${COLUMN.ESTADO}"` });
  }
  const statusColLetter = columnIndexToLetter(statusColIndex);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!${statusColLetter}12:${statusColLetter}`, // Start from row 12 to get only data
  });

  const rows = response.data.values;
  let uniqueOptions = new Set();

  if (rows) {
    // Flatten the array and filter out any empty values
    uniqueOptions = new Set(rows.flat().filter((val) => val));
  }

  // Always ensure the default statuses are present.
  DEFAULT_STATUSES.forEach((status) => uniqueOptions.add(status));

  res.status(200).json([...uniqueOptions]);
}

// Generic handler to update a single field in a row
async function handleUpdateField(
  res,
  sheets,
  body,
  fieldName,
  columnName,
  logAction
) {
  const { rowIndex, user } = body;
  const newValue = body[fieldName];

  if (rowIndex === undefined || newValue === undefined) {
    return res
      .status(400)
      .json({ error: `rowIndex and ${fieldName} are required.` });
  }

  try {
    const { headerMap } = await getHeaders(sheets);
    const fieldColIndex = headerMap[columnName];
    const descriptionColIndex = headerMap[COLUMN.DESCRIPCION];

    if (fieldColIndex === undefined || descriptionColIndex === undefined) {
      return res
        .status(500)
        .json({ error: "Required columns not found in the sheet." });
    }

    const fieldColLetter = columnIndexToLetter(fieldColIndex);
    const descriptionColLetter = columnIndexToLetter(descriptionColIndex);

    const range = `${SHEET_NAME}!${fieldColLetter}${rowIndex}`;
    const descriptionRange = `${SHEET_NAME}!${descriptionColLetter}${rowIndex}`;

    const descriptionResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: descriptionRange,
    });
    const description =
      descriptionResponse.data.values?.[0]?.[0] || `Row ${rowIndex}`;

    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });
    const oldValue = getResponse.data.values?.[0]?.[0] || "";

    if (String(oldValue) !== String(newValue)) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[newValue]],
        },
      });

      await logChange(
        sheets,
        user,
        logAction,
        `Product "${description}" ${columnName.toLowerCase()} changed from "${oldValue}" to "${newValue}"`
      );
    }

    res.status(200).json({
      success: true,
      message: `Row ${rowIndex} ${columnName.toLowerCase()} updated to ${newValue}`,
    });
  } catch (error) {
    console.error(`Failed to update ${columnName.toLowerCase()}:`, error);
    res.status(500).json({
      error: `Failed to update ${columnName.toLowerCase()}.`,
      details: error.message,
    });
  }
}

// Updates the status of a specific row
async function handleUpdateStatus(res, sheets, body) {
  await handleUpdateField(
    res,
    sheets,
    body,
    "newStatus",
    COLUMN.ESTADO,
    LOG_ACTIONS.UPDATE_STATUS
  );
}

// Updates the quantity of a specific row
async function handleUpdateQuantity(res, sheets, body) {
  await handleUpdateField(
    res,
    sheets,
    body,
    "newQuantity",
    COLUMN.CANTIDAD,
    LOG_ACTIONS.UPDATE_QUANTITY
  );
}

// Updates the unit price of a specific row
async function handleUpdateUnitPrice(res, sheets, body) {
  await handleUpdateField(
    res,
    sheets,
    body,
    "newUnitPrice",
    COLUMN.PRECIO_UNIDAD,
    LOG_ACTIONS.UPDATE_UNIT_PRICE
  );
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

  try {
    const { headerMap } = await getHeaders(sheets);
    const fieldsToUpdate = [
      { name: COLUMN.LUGAR_DE_COMPRA, value: newLugarDeCompra },
      { name: COLUMN.TIPO_DE_ELEMENTO, value: newType },
      { name: COLUMN.ASIGNADO_A, value: newAssignedTo },
      { name: COLUMN.DESCRIPCION, value: newDescription },
      { name: COLUMN.CANTIDAD, value: newQuantity },
      { name: COLUMN.PRECIO_UNIDAD, value: newUnitPrice },
      { name: COLUMN.NOTAS, value: newNotes },
    ];

    const oldValuesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`, // Read the whole row
    });
    const oldValues = oldValuesResponse.data.values?.[0] || [];
    const oldProductDescription =
      oldValues[headerMap[COLUMN.DESCRIPCION]] || `Row ${rowIndex}`;

    const oldData = {};
    for (const field of fieldsToUpdate) {
      const colIndex = headerMap[field.name];
      if (colIndex !== undefined) {
        oldData[field.name] = oldValues[colIndex] || "";
      }
    }

    const updatePromises = fieldsToUpdate
      .map((field) => {
        const colIndex = headerMap[field.name];
        if (colIndex === undefined) {
          console.error(`Column ${field.name} not found`);
          return null;
        }
        const colLetter = columnIndexToLetter(colIndex);
        return sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${colLetter}${rowIndex}`,
          valueInputOption: "USER_ENTERED",
          resource: { values: [[field.value]] },
        });
      })
      .filter(Boolean);

    await Promise.all(updatePromises);

    const changes = fieldsToUpdate
      .map((field) => {
        if (String(oldData[field.name]) !== String(field.value)) {
          return `field "${field.name}" from "${oldData[field.name]}" to "${
            field.value
          }"`;
        }
        return null;
      })
      .filter(Boolean);

    if (changes.length > 0) {
      await logChange(
        sheets,
        user,
        LOG_ACTIONS.UPDATE_DETAILS,
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
    const { headerMap, headerArray } = await getHeaders(sheets);
    const descriptionColIndex = headerMap[COLUMN.DESCRIPCION];
    if (descriptionColIndex === undefined) {
      return res
        .status(500)
        .json({ error: `Could not find column "${COLUMN.DESCRIPCION}"` });
    }
    const descriptionColLetter = columnIndexToLetter(descriptionColIndex);

    // 1. Find the next empty row by checking the length of the description column
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${descriptionColLetter}11:${descriptionColLetter}`,
    });
    const numRows = getResponse.data.values
      ? getResponse.data.values.length
      : 0;
    const newRowIndex = 11 + numRows;

    // 2. Construct the formula for the Total column
    const cantidadColLetter = columnIndexToLetter(headerMap[COLUMN.CANTIDAD]);
    const precioUnidadColLetter = columnIndexToLetter(
      headerMap[COLUMN.PRECIO_UNIDAD]
    );
    const totalFormula = `=${cantidadColLetter}${newRowIndex}*${precioUnidadColLetter}${newRowIndex}`;

    const newRowData = {
      [COLUMN.LUGAR_DE_COMPRA]: newLugarDeCompra,
      [COLUMN.TIPO_DE_ELEMENTO]: newType,
      [COLUMN.ASIGNADO_A]: newAssignedTo,
      [COLUMN.DESCRIPCION]: newDescription,
      [COLUMN.CANTIDAD]: newQuantity,
      [COLUMN.PRECIO_UNIDAD]: newUnitPrice,
      [COLUMN.TOTAL]: totalFormula,
      [COLUMN.NOTAS]: newNotes,
      [COLUMN.ESTADO]: "Pendiente", // Default status
    };

    const newRow = headerArray.map(
      (header) => newRowData[header] || ""
    );

    // 4. Update the specific new row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${newRowIndex}:${columnIndexToLetter(
        headerArray.length - 1
      )}${newRowIndex}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [newRow],
      },
    });

    // Log the change
    await logChange(
      sheets,
      user,
      LOG_ACTIONS.ADD_PRODUCT,
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
  const {
    rowIndexes,
    newType,
    newAssignedTo,
    newStatus,
    newLugarDeCompra,
    user,
  } = body;

  if (!rowIndexes || !Array.isArray(rowIndexes) || rowIndexes.length === 0) {
    return res.status(400).json({ error: "rowIndexes array is required." });
  }

  try {
    const { headerMap } = await getHeaders(sheets);

    const fieldsToUpdate = [
      { name: COLUMN.LUGAR_DE_COMPRA, value: newLugarDeCompra },
      { name: COLUMN.TIPO_DE_ELEMENTO, value: newType },
      { name: COLUMN.ASIGNADO_A, value: newAssignedTo },
      { name: COLUMN.ESTADO, value: newStatus },
    ];

    const data = [];
    const updatedFieldNames = [];

    for (const field of fieldsToUpdate) {
      if (field.value) {
        const colIndex = headerMap[field.name];
        if (colIndex === undefined) {
          console.warn(`Column "${field.name}" not found, skipping bulk update for it.`);
          continue;
        }
        const colLetter = columnIndexToLetter(colIndex);
        for (const rowIndex of rowIndexes) {
          data.push({
            range: `${SHEET_NAME}!${colLetter}${rowIndex}`,
            values: [[field.value]],
          });
        }
        updatedFieldNames.push(field.name);
      }
    }

    if (data.length === 0) {
      return res.status(400).json({ error: "No fields to update were provided." });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        valueInputOption: "USER_ENTERED",
        data,
      },
    });

    // Log the change
    await logChange(
      sheets,
      user,
      LOG_ACTIONS.BULK_UPDATE,
      `Updated ${rowIndexes.length} products. Changed fields: ${updatedFieldNames.join(", ")}`
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
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MEMBERS_SHEET_NAME}!A10:D`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return res.status(200).json([]);
  }

  const header = rows[0];
  const memberColIndex = header.indexOf(COLUMN.MIEMBRO);
  const accessColIndex = header.indexOf(COLUMN.ACCESO_APP);

  if (memberColIndex === -1 || accessColIndex === -1) {
    return res.status(500).json({ error: "Required columns not found in Miembros sheet." });
  }

  const members = rows.slice(1).map(row => ({
    name: row[memberColIndex],
    access: row[accessColIndex]
  })).filter(member => member.name); // Filter out rows without a name

  res.status(200).json(members);
}
