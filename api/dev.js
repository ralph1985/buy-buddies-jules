import express from 'express';
import dotenv from 'dotenv';
import handler from './index.js';

dotenv.config();

const app = express();
const port = 3001;

// Middleware to parse JSON bodies, since the handler expects it
app.use(express.json());

// A wrapper to adapt the Vercel handler to Express req/res
const vercelToExpress = (fn) => async (req, res) => {
  // The Vercel handler uses req.query for GET and req.body for POST
  // and we need to simulate that.
  // We also need to add the res.json, res.status, etc. methods.

  // The handler expects a `query` property on the request for GET parameters
  req.query = req.query || {};

  // The handler expects a `body` property on the request for POST bodies.
  // The getJsonBody helper in the original file is now handled by express.json()

  // The handler uses res.send, res.json, res.status. Express does this natively.
  await fn(req, res);
};

// Use the wrapped handler for all routes
app.all('/api', vercelToExpress(handler));
app.all('/api/index', vercelToExpress(handler));


app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});