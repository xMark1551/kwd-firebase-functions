import * as functions from "firebase-functions/v1";
import { AlgoliaIndexService } from "../../services/algolia/algolia.backfill.service";

const SECRET = process.env.ADMIN_SECRET_KEY;

const service = new AlgoliaIndexService();

export const backfillAlgolia = functions.https.onRequest(async (request: any, response: any) => {
  if (request.headers.authorization !== `Bearer ${SECRET}`) {
    request.status(403).json({ error: "Unauthorized" });
    return; // ✅ just return void
  }

  try {
    return await service.backfillGlobal();
  } catch (error) {
    console.error(error);
    return response.status(500).send(error);
  }
});
