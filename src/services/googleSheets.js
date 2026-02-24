/**
 * DEPRECATED: Google Sheets Service (Legacy)
 *
 * This file is no longer used. The application has been migrated from
 * Google Sheets to a MERN Stack (MongoDB, Express, React, Node.js) backend.
 *
 * Please use the MERN Backend API endpoints instead.
 * See .env configuration for VITE_API_URL.
 *
 * Previous functions (now deprecated):
 * - getTickets()           - Use GET /api/clients instead
 * - getTicketsByEmail()    - Use GET /api/clients with query params
 * - createTicket()         - Use POST /api/clients or /api/remarks
 * - updateTicketStatus()   - Use PUT /api/clients/:id
 * - addComment()           - Use POST /api/remarks
 * - getTicketDetails()     - Use GET /api/clients/:id
 * - getSheetOptions()      - Use GET /api/events for event listing
 */

throw new Error(
  "❌ Google Sheets functions are no longer available.\n\n" +
    "The application has been migrated to a MERN stack backend.\n" +
    "Please use the API endpoints instead:\n\n" +
    "Examples:\n" +
    "- GET /api/clients         - List all clients\n" +
    "- POST /api/clients        - Create new client\n" +
    "- GET /api/clients/:id     - Get client details\n" +
    "- PUT /api/clients/:id     - Update client\n" +
    "- GET /api/events          - List events\n" +
    "- POST /api/remarks        - Add remark/comment to client\n\n" +
    "See server/app.js for complete API documentation.",
);
