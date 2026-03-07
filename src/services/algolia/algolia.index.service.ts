import { createAlgoliaClient } from "./algolia.client";

const client = createAlgoliaClient(process.env.ALGOLIA_ADMIN_KEY!);
const index = client.initIndex("global_search");

export class AlgoliaIndexService {
  constructor() {
    const appId = process.env.ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;

    if (!appId || !adminKey) {
      throw new Error("Missing ALGOLIA_ADMIN_KEY or ALGOLIA_APP_ID");
    }
  }

  async save(object: any) {
    await index.saveObject(object);
  }

  async delete(objectID: string) {
    await index.deleteObject(objectID);
  }
}

export const algoliaIndexService = new AlgoliaIndexService();
