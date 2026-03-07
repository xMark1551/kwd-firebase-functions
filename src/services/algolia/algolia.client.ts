import algoliasearch from "algoliasearch";

export const createAlgoliaClient = (key: string) => {
  const appId = process.env.ALGOLIA_APP_ID;

  if (!appId || !key) {
    throw new Error("Missing Algolia credentials");
  }

  return algoliasearch(appId, key);
};
