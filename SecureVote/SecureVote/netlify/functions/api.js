
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const { registerRoutes } = require('../../server/routes');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all your API routes
registerRoutes(app);

// Export the serverless function
module.exports.handler = serverless(app);
