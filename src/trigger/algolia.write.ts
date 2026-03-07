import * as functions from "firebase-functions/v1";
import { algoliaIndexService } from "../services/algolia/algolia.index.service";
import { docToAlgoliaObject } from "../utils/algolia.helper";
import { NEWS_AND_UPDATES_COLLECTION, TRANSPARENCY_SEAL_COLLECTION } from "../const/collection.name";

const COLLECTIONS = [NEWS_AND_UPDATES_COLLECTION, TRANSPARENCY_SEAL_COLLECTION] as const;

for (const collection of COLLECTIONS) {
  exports[`${collection}OnWrite`] = functions.firestore
    .document(`${collection}/{id}`)
    .onWrite(async (change, context) => {
      const id = String(context.params.id);

      // DELETE
      if (!change.after.exists) {
        await algoliaIndexService.delete(id);
        return null;
      }

      // UPSERT`
      const data = change.after.data();
      const obj = docToAlgoliaObject(collection, id, data);

      await algoliaIndexService.save({
        ...obj,
        objectID: id,
      });

      return null;
    });
}
