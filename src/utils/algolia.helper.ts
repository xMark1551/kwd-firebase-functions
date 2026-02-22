import toDateMs from "./to.date.ms";

export function docToAlgoliaObject(collection: string, id: string, data: any) {
  return {
    objectID: id,
    source: collection,
    hasDate: 1,
    dateMs: toDateMs(data.date || data.createdAt || data.publishedAt || null) ?? 0,
    visibility: data.status && data.status === "Published" ? "public" : "private",
    ...data,
  };
}
