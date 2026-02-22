// Main entry point: export everything
import * as admin from "firebase-admin";
admin.initializeApp();

export * from "./trigger/algolia.write";

export { backfillAlgolia } from "./callable/backfill.http";

export { cleanupOldLogss } from "./services/logger.service";

import { onRequest } from "firebase-functions/v2/https";
import { app } from "./app";

// Expose Express app as HTTPS function
export const api = onRequest(app);
