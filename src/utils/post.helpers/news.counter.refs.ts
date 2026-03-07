import { Firestore } from "@google-cloud/firestore";
import { NEWS_ARCHIVES_COLLECTION, NEWS_TOTAL_COUNT_COLLECTION } from "../../const/collection.name";

export const NewsCounterRefs = {
  forPublish(db: Firestore, category: string, monthKey: string) {
    return {
      category: db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(category),
      archive: db.collection(NEWS_ARCHIVES_COLLECTION).doc(monthKey),
    };
  },

  forUpdate(db: Firestore, oldCategory: string, newCategory: string, monthKey: string) {
    return {
      oldCategoryRef: db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(oldCategory),
      newCategoryRef: db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(newCategory),
      archiveRef: db.collection(NEWS_ARCHIVES_COLLECTION).doc(monthKey),
    };
  },
};
