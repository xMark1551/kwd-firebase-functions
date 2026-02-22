import * as functions from "firebase-functions/v1";
import algoliasearch, { type SearchIndex } from "algoliasearch";
import { docToAlgoliaObject } from "../utils/algolia.helper";
import { NEWS_AND_UPDATES_COLLECTION } from "../const/collection.name";

let globalIndex: SearchIndex | null = null;

function getGlobalIndex(): SearchIndex {
  if (globalIndex) return globalIndex;

  const appId = process.env.ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_KEY;

  // ✅ throw ONLY when the function actually runs (not during deploy analysis)
  if (!appId || !adminKey) {
    throw new Error("Missing ALGOLIA_ADMIN_KEY or ALGOLIA_APP_ID");
  }

  const client = algoliasearch(appId, adminKey);
  globalIndex = client.initIndex("global_search");
  return globalIndex;
}

const COLLECTIONS = [NEWS_AND_UPDATES_COLLECTION, "transparency_seal"] as const;

for (const collection of COLLECTIONS) {
  exports[`${collection}OnWrite`] = functions.firestore
    .document(`${collection}/{id}`)
    .onWrite(async (change, context) => {
      const index = getGlobalIndex();
      const id = String(context.params.id);

      // DELETE
      if (!change.after.exists) {
        await index.deleteObject(id).catch((err) => {
          console.warn(`[algolia] deleteObject failed (${collection}/${id})`, err);
        });
        return null;
      }

      // UPSERT
      const data = change.after.data();
      const algoliaObj = docToAlgoliaObject(collection, id, data);

      // Make sure Algolia objectID matches the doc id
      await index.saveObject({ ...algoliaObj, objectID: id }).catch((err) => {
        console.error(`[algolia] saveObject failed (${collection}/${id})`, err);
      });

      return null;
    });
}
