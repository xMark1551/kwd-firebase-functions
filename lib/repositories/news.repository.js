"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsRepository = void 0;
const firestore_1 = require("firebase-admin/firestore");
const base_repository_1 = require("./base.repository");
const collection_name_1 = require("../const/collection.name");
const storage_1 = require("../config/storage");
const transaction_helper_1 = require("../utils/transaction.helper");
const dateUtils_1 = require("../utils/dateUtils");
class NewsRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.NEWS_AND_UPDATES_COLLECTION);
    }
    async createWithCounters(payload) {
        const now = Date.now();
        const monthKey = (0, dateUtils_1.getMonthKey)(now);
        const uploadedUrls = payload.files ?? [];
        try {
            const res = await this.runTx(async (tx, db) => {
                const newsRef = db.collection(collection_name_1.NEWS_AND_UPDATES_COLLECTION).doc();
                const categoryRef = db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).doc(payload.category);
                const archiveRef = db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).doc(monthKey);
                // READ PHASE
                let categorySnap;
                let archiveSnap;
                if (payload.status === "Published") {
                    categorySnap = await tx.get(categoryRef);
                    archiveSnap = await tx.get(archiveRef);
                }
                // WRITE PHASE
                tx.set(newsRef, {
                    ...payload,
                    createdAt: firestore_1.FieldValue.serverTimestamp(),
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                if (payload.status === "Published") {
                    (0, transaction_helper_1.updateCounter)(tx, categoryRef, 1, categorySnap, { category: payload.category });
                    (0, transaction_helper_1.updateCounter)(tx, archiveRef, 1, archiveSnap, { monthKey });
                }
                return { ...payload, id: newsRef.id };
            });
            return res;
        }
        catch (err) {
            if (uploadedUrls.length) {
                await (0, storage_1.deleteNewsImages)(uploadedUrls).catch((cleanupErr) => {
                    console.error("Failed to cleanup files:", cleanupErr);
                });
            }
            console.log(err);
            throw err;
        }
    }
    async updateWithCounters(id, payload) {
        try {
            const res = await this.runTx(async (tx, db) => {
                const postRef = db.collection(collection_name_1.NEWS_AND_UPDATES_COLLECTION).doc(id);
                const postSnap = await tx.get(postRef);
                const post = postSnap.data();
                const monthKey = (0, dateUtils_1.getMonthKey)(post.createdAt);
                //get old files url
                const oldFiles = post.files?.filter((item) => typeof item === "string");
                // compare old files to new updated files to get files to delete
                const removedFiles = oldFiles?.filter((item) => !payload.files.includes(item));
                // Determine what changed in category and status to update counters
                const oldStatus = post.status;
                const newStatus = payload.status ?? oldStatus;
                const statusChanged = oldStatus !== newStatus;
                const oldCategory = post.category;
                const newCategory = payload.category ?? oldCategory;
                const categoryChanged = oldCategory !== newCategory;
                const archiveRef = db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).doc(monthKey);
                const newCategoryRef = db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).doc(payload.category);
                const oldCategoryRef = db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).doc(post.category);
                // READ PHASE
                let archiveSnap;
                let newCategorySnap;
                let oldCategorySnap;
                if (payload.status === "Published") {
                    newCategorySnap = await tx.get(newCategoryRef);
                    archiveSnap = await tx.get(archiveRef);
                }
                // WRITE PHASE
                tx.set(postRef, { ...payload, updatedAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
                // ═══════════════════════════════════════════════════════
                // Handle counter updates based on what changed
                // ═══════════════════════════════════════════════════════
                // CASE 1: Status changed (Draft ↔ Published)
                if (statusChanged) {
                    const delta = newStatus === "Published" ? 1 : -1;
                    // Update archive
                    (0, transaction_helper_1.updateCounter)(tx, archiveRef, delta, archiveSnap, { month: monthKey });
                    // update  category both old and new to apply count update
                    // update new category if category change and newstatus is published
                    if (categoryChanged && newStatus === "Published") {
                        (0, transaction_helper_1.updateCounter)(tx, newCategoryRef, delta, newCategorySnap, {
                            category: newCategory,
                        });
                    }
                    // update old category
                    // update wont apply if category change with status set draft to published
                    else {
                        (0, transaction_helper_1.updateCounter)(tx, oldCategoryRef, delta, oldCategorySnap, {
                            category: oldCategory,
                        });
                    }
                }
                // CASE 2: Only category changed (status stayed Published)
                else if (categoryChanged && newStatus === "Published") {
                    // Remove from old category
                    (0, transaction_helper_1.updateCounter)(tx, oldCategoryRef, -1, oldCategorySnap, { category: oldCategory });
                    // update new category
                    (0, transaction_helper_1.updateCounter)(tx, newCategoryRef, 1, newCategorySnap, { category: newCategory });
                }
                return { ...payload, removedFiles };
            });
            if (res.removedFiles?.length) {
                await (0, storage_1.deleteNewsImages)(res.removedFiles).catch((cleanupErr) => {
                    console.error("Failed to cleanup files:", cleanupErr);
                });
            }
            return { ...res, id };
        }
        catch (err) {
            if (payload.files?.length) {
                await (0, storage_1.deleteNewsImages)(payload.files).catch((cleanupErr) => {
                    console.error("Failed to cleanup files:", cleanupErr);
                });
            }
            console.log(err);
            throw err;
        }
    }
    async deletePostWithCounters(id) {
        const now = Date.now();
        const monthKey = (0, dateUtils_1.getMonthKey)(now);
        console.log("deleting post", id);
        try {
            const res = await this.runTx(async (tx, db) => {
                const postRef = db.collection(collection_name_1.NEWS_AND_UPDATES_COLLECTION).doc(id);
                const postSnap = await tx.get(postRef);
                const post = postSnap.data();
                const removedFiles = post.files;
                const archiveRef = db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).doc(monthKey);
                const categoryRef = db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).doc(post.category);
                // READ PHASE
                const archiveSnap = await tx.get(archiveRef);
                const categorySnap = await tx.get(categoryRef);
                // WRITE PHASE
                tx.delete(postRef);
                (0, transaction_helper_1.updateCounter)(tx, archiveRef, -1, archiveSnap, { month: monthKey });
                (0, transaction_helper_1.updateCounter)(tx, categoryRef, -1, categorySnap, { category: post.category });
                return { ...post, removedFiles };
            });
            if (res.removedFiles?.length) {
                await (0, storage_1.deleteNewsImages)(res.removedFiles).catch((cleanupErr) => {
                    console.error("Failed to cleanup files:", cleanupErr);
                });
            }
            return res;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async deleteBulkWithCounters(ids) {
        try {
            const res = await this.runTx(async (tx, db) => {
                const postRefs = ids.map((id) => db.collection(collection_name_1.NEWS_AND_UPDATES_COLLECTION).doc(id));
                const postSnaps = await Promise.all(postRefs.map((ref) => tx.get(ref)));
                const docs = postSnaps.filter((s) => s.exists).map((s) => ({ ref: s.ref, data: s.data() }));
                if (!docs.length)
                    return { deletedIds: [], removedImages: [] };
                const removedImagesSet = new Set();
                const archiveDeltas = new Map(); // monthKey -> delta
                const categoryDeltas = new Map(); // category -> delta
                for (const { data } of docs) {
                    // collect all images to delete (published or not)
                    data.files?.forEach((url) => {
                        if (typeof url === "string" && url)
                            removedImagesSet.add(url);
                    });
                    // counters only for published posts
                    if (data.status !== "Published")
                        continue;
                    // normalize createdAt -> epoch ms for month key
                    const createdAtMs = typeof data.createdAt === "number"
                        ? data.createdAt
                        : (data.createdAt?.toMillis?.() ?? Date.now());
                    const monthKey = (0, dateUtils_1.getMonthKey)(createdAtMs);
                    archiveDeltas.set(monthKey, (archiveDeltas.get(monthKey) ?? 0) - 1);
                    const category = data.category;
                    categoryDeltas.set(category, (categoryDeltas.get(category) ?? 0) - 1);
                }
                // Build affected counter doc refs
                const archiveRefs = [...archiveDeltas.keys()].map((k) => db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).doc(k));
                const categoryRefs = [...categoryDeltas.keys()].map((k) => db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).doc(k));
                // READ PHASE for counters
                const [archiveSnaps, categorySnaps] = await Promise.all([
                    Promise.all(archiveRefs.map((r) => tx.get(r))),
                    Promise.all(categoryRefs.map((r) => tx.get(r))),
                ]);
                // WRITE PHASE: delete posts
                for (const s of postSnaps) {
                    if (s.exists)
                        tx.delete(s.ref);
                }
                // WRITE PHASE: apply archive deltas
                archiveSnaps.forEach((snap, i) => {
                    const ref = archiveRefs[i];
                    const key = ref.id;
                    const delta = archiveDeltas.get(key) ?? 0;
                    if (delta !== 0)
                        (0, transaction_helper_1.updateCounter)(tx, ref, delta, snap, { month: key });
                });
                // WRITE PHASE: apply category deltas
                categorySnaps.forEach((snap, i) => {
                    const ref = categoryRefs[i];
                    const category = ref.id;
                    const delta = categoryDeltas.get(category) ?? 0;
                    if (delta !== 0)
                        (0, transaction_helper_1.updateCounter)(tx, ref, delta, snap, { category });
                });
                return {
                    deletedIds: docs.map((d) => d.ref.id),
                    removedImages: [...removedImagesSet],
                };
            });
            // delete storage AFTER transaction success
            if (res.removedImages.length) {
                await (0, storage_1.deleteNewsImages)(res.removedImages).catch((cleanupErr) => {
                    console.error("Failed to cleanup files:", cleanupErr);
                });
            }
            return res;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async listPublished(limitCount = 10) {
        const qs = await this.col().orderBy("createdAt", "desc").limit(limitCount).get();
        return qs.docs.map((d) => ({ ...d.data(), id: d.id }));
    }
    async totalCount() {
        const snap = await this.col().count().get();
        return snap.data().count;
    }
    async categoryList() {
        const qs = await this.db.collection(collection_name_1.NEWS_TOTAL_COUNT_COLLECTION).get();
        return qs.docs.map((d) => ({
            category: d.id,
            totalPosts: d.data().totalPosts ?? 0,
        }));
    }
    async archivePostList() {
        const qs = await this.db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).get();
        return qs.docs.map((d) => ({
            month: d.id,
            totalPosts: d.data().totalPosts ?? 0,
        }));
    }
    async currentMonthPostCount() {
        const monthKey = (0, dateUtils_1.getMonthKey)(new Date());
        const snap = await this.db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).doc(monthKey).get();
        return { count: snap.data()?.totalPosts ?? 0 };
    }
    async featuredPostList() {
        const qs = await this.col().where("isFeatured", "==", true).limit(3).get();
        return qs.docs.map((d) => ({
            ...d.data(),
            id: d.id,
        }));
    }
    async updateFeaturedPost(id) {
        const snap = await this.col().doc(id).get();
        const newIsFeatured = !snap.data()?.isFeatured;
        return await this.col().doc(id).update({ isFeatured: newIsFeatured });
    }
}
exports.NewsRepository = NewsRepository;
