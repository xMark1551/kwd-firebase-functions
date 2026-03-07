import * as admin from "firebase-admin";
import { createAlgoliaClient } from "./algolia.client";

import { NEWS_AND_UPDATES_COLLECTION, TRANSPARENCY_SEAL_COLLECTION } from "../../const/collection.name";

const client = createAlgoliaClient(process.env.ALGOLIA_ADMIN_KEY!);
const globalIndex = client.initIndex("global_search");

export class AlgoliaIndexService {
  async backfillGlobal() {
    const db = admin.firestore();
    let totalUploaded = 0;

    const collections = [NEWS_AND_UPDATES_COLLECTION, TRANSPARENCY_SEAL_COLLECTION];

    for (const collection of collections) {
      const snap = await db.collection(collection).get();

      const objects: any[] = [];

      snap.forEach((doc) => {
        const data = doc.data();

        objects.push({
          objectID: `${collection}_${doc.id}`,
          ...data,
        });
      });

      const chunkSize = 1000;

      for (let i = 0; i < objects.length; i += chunkSize) {
        const chunk = objects.slice(i, i + chunkSize);
        await globalIndex.saveObjects(chunk);
        totalUploaded += chunk.length;
      }
    }

    return { totalUploaded };
  }
}
