"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsCounterRefs = void 0;
const collection_name_1 = require("../../const/collection.name");
exports.NewsCounterRefs = {
    forPublish(db, category, monthKey) {
        return {
            category: db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).doc(category),
            archive: db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).doc(monthKey),
        };
    },
    forUpdate(db, oldCategory, newCategory, monthKey) {
        return {
            oldCategoryRef: db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).doc(oldCategory),
            newCategoryRef: db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).doc(newCategory),
            archiveRef: db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).doc(monthKey),
        };
    },
};
