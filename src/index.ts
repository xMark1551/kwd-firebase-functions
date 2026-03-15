// Main entry point: export everything
// import * as admin from "firebase-admin";
// admin.initializeApp();

import { onRequest } from "firebase-functions/v2/https";
import { app } from "./app";

// Expose Express app as HTTPS function
export const api = onRequest(app);

export * from "./trigger/algolia.write";
export { backfillAlgolia } from "./functions/http.function/backfill.http";

export { cleanupOldLogs } from "./scheduled/logCleanup.function";
