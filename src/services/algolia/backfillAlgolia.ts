import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import algoliasearch from "algoliasearch";
import { docToAlgoliaObject } from "../../utils/algolia.helper";
import toDateMs from "../../utils/to.date.ms";

if (!admin.apps.length) admin.initializeApp();

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  throw new Error("Missing ALGOLIA_ADMIN_KEY or ALGOLIA_APP_ID");
}

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const globalIndex = algoliaClient.initIndex("global_search");

const COLLECTIONS = ["news_and_updates", "transparency_seal"] as const;

export const backfillAlgoliaGlobal = functions.https.onRequest(async (req, res) => {
  // OPTIONAL simple safety gate:
  // call with ?secret=YOUR_SECRET and set it in functions config or env
  // if (req.query.secret !== functions.config().backfill?.secret) {
  //   res.status(403).send("Forbidden");
  //   return;
  // }

  try {
    const db = admin.firestore();
    let totalUploaded = 0;

    for (const collection of COLLECTIONS) {
      const snap = await db.collection(collection).get();

      // Algolia batch limit is 1000 objects per request (safe to chunk)
      const objects: any[] = [];

      snap.forEach((doc) => {
        const id = doc.id;
        const data = doc.data();

        const rawDate = data.date || data.createdAt || data.publishedAt || null;
        const dateMs = toDateMs(rawDate);

        objects.push({
          objectID: `${collection}_${id}`, // unique across all collections
          ...docToAlgoliaObject(collection, id, data),

          type: collection,
          hasDate: dateMs ? 1 : 0,
          dateMs: dateMs ?? 0,

          url: collection === "news_and_updates" ? `/news/${id}` : `/transparency/${id}`,
        });
      });

      // chunk upload
      const chunkSize = 1000;
      for (let i = 0; i < objects.length; i += chunkSize) {
        const chunk = objects.slice(i, i + chunkSize);
        await globalIndex.saveObjects(chunk);
        totalUploaded += chunk.length;
      }
    }

    res.status(200).json({ ok: true, totalUploaded });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err?.message ?? String(err) });
  }
});
