/**
 * DEPRECATED: Google Sheets Service (Legacy)
 *
 * This file is no longer used. The application has been migrated from
 * Google Sheets to a MERN Stack (MongoDB, Express, React, Node.js) backend.
 *
 * Previous functions that were provided:
 * - getTickets()             - Fetch tickets from Google Sheet
 * - getTicketsByEmail()      - Fetch user's tickets from Google Sheet
 * - createTicket()           - Create new ticket via Google Script
 * - updateTicketStatus()     - Update ticket status via Google Script
 * - addComment()             - Add comment to ticket via Google Script
 * - getTicketDetails()       - Get detailed ticket info from Google Sheet
 * - jsonpRequest()           - Helper for JSONP requests
 * - postRequest()            - Helper for POST requests to Google Scripts
 *
 * New MERN Backend API Endpoints:
 *
 * Clients:
 * - GET  /api/clients                 - List all clients
 * - POST /api/clients                 - Create new client
 * - GET  /api/clients/:id             - Get client details
 * - PUT  /api/clients/:id             - Update client
 * - DELETE /api/clients/:id           - Delete client
 *
 * Events:
 * - GET  /api/events                  - List events
 * - POST /api/events                  - Create event (admin)
 * - GET  /api/events/:id/stats        - Event statistics
 *
 * Remarks/Comments:
 * - POST /api/remarks                 - Add remark to client
 * - GET  /api/clients/:id/timeline    - Get client remarks
 *
 * Authentication:
 * - POST /api/auth/login              - User login (email/password)
 * - POST /api/auth/refresh-token      - Refresh access token
 * - POST /api/auth/logout             - User logout
 */

console.warn(
  "[DEPRECATED] googleSheets.js is deprecated. Please use the MERN backend API instead.",
);

// This file is kept for reference only. Do not use these functions.
export const deprecatedFunctions = {
  getTickets: undefined,
  getTicketsByEmail: undefined,
  createTicket: undefined,
  updateTicketStatus: undefined,
  addComment: undefined,
  getTicketDetails: undefined,
  jsonpRequest: undefined,
  postRequest: undefined,
};
