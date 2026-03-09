"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsRepository = void 0;
const firestore_1 = require("firebase-admin/firestore");
const base_repository_1 = require("./base.repository");
const date_converter_1 = require("../utils/date.converter");
const post_repo_helper_1 = require("../utils/post.helpers/post.repo.helper");
const deleteFile_1 = require("../storage/deleteFile");
const collection_name_1 = require("../const/collection.name");
const post_model_schema_1 = require("../model/post.model.schema");
class NewsRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.NEWS_AND_UPDATES_COLLECTION, post_model_schema_1.postSchema);
        this.categoryCountCollectionName = collection_name_1.NEWS_TOTAL_COUNT_COLLECTION;
        this.archiveCollectionName = collection_name_1.NEWS_ARCHIVES_COLLECTION;
    }
    // counters
    category(category) {
        return this.db.collection(this.categoryCountCollectionName).doc(category);
    }
    archive(monthKey) {
        return this.db.collection(this.archiveCollectionName).doc(monthKey);
    }
    async getDocumentTxById(tx, id) {
        const ref = this.col().doc(id);
        const snap = await tx.get(ref);
        const doc = snap.data();
        if (!doc)
            throw new Error(`Document with id ${id} not found`);
        // Only return undefined if not required
        return { ref, snap, doc };
    }
    async getMultipleDocumentsTxById(tx, col, ids) {
        const refs = ids.map((id) => this.db.collection(col).doc(id));
        const snaps = await tx.getAll(...refs);
        const docs = snaps.filter((s) => s.exists).map((s) => ({ ref: s.ref, data: s.data() }));
        if (!docs.length)
            throw new Error(`Documents with ids ${ids} not found`);
        // Only return undefined if not required
        return { refs, snaps, docs };
    }
    updateCounter(tx, ref, snap, amount) {
        if (snap && snap.exists) {
            const data = snap.data() || {};
            const current = typeof data.totalPosts === "number" ? data.totalPosts : 0;
            const next = current + amount;
            // avoid negative counters: delete when reaches 0 or below
            if (next <= 0) {
                tx.delete(ref);
                return;
            }
            tx.update(ref, { totalPosts: firestore_1.FieldValue.increment(amount) });
        }
        else {
            // avoid negative counters
            if (amount < 0)
                return;
            tx.set(ref, { totalPosts: firestore_1.FieldValue.increment(amount) });
        }
    }
    async createWithCounters(payload) {
        const monthKey = (0, date_converter_1.getMonthKey)(Date.now());
        const isPublished = payload.status === "Published";
        const result = await this.runTx(async (tx) => {
            // READ PHASE - fetch counter snapshots if publishing
            const newsRef = this.col().doc();
            const counterRefs = isPublished && {
                categoryRef: this.category(payload.category),
                archiveRef: this.archive(monthKey),
            };
            const snapshots = counterRefs && (await tx.getAll(counterRefs.categoryRef, counterRefs.archiveRef));
            // WRITE PHASE
            tx.set(newsRef, { ...payload });
            // Update counters
            if (counterRefs && snapshots) {
                const [categorySnap, archiveSnap] = snapshots;
                this.updateCounter(tx, counterRefs.categoryRef, categorySnap, 1);
                this.updateCounter(tx, counterRefs.archiveRef, archiveSnap, 1);
            }
            return { id: newsRef.id, ...payload };
        });
        return result;
    }
    async patchWithCounters(id, payload) {
        const result = await this.runTx(async (tx) => {
            // READ PHASE
            const { ref, doc } = await this.getDocumentTxById(tx, id);
            const monthKey = (0, date_converter_1.getMonthKey)(doc.createdAt);
            // Prepare file cleanup
            const fileUrlsToDelete = (0, deleteFile_1.getFilesToDelete)(doc.files, payload.files);
            // Determine what changed in category and status to update counters
            const { newStatus, statusChanged, oldCategory, newCategory, categoryChanged, becamePublished, becameDraft, movedWhilePublished, } = (0, post_repo_helper_1.resolvePostStateTransitions)(doc, payload);
            const countersRefs = categoryChanged || statusChanged
                ? {
                    oldCategoryRef: this.category(oldCategory),
                    newCategoryRef: this.category(newCategory),
                    archiveRef: this.archive(monthKey),
                }
                : null;
            const snapshots = countersRefs
                ? await tx.getAll(countersRefs.oldCategoryRef, countersRefs.newCategoryRef, countersRefs.archiveRef)
                : null;
            // WRITE PHASE
            tx.update(ref, { ...payload });
            // Update counters
            if (countersRefs && snapshots) {
                const [oldCategorySnap, newCategorySnap, archiveSnap] = snapshots;
                const { archiveRef, newCategoryRef, oldCategoryRef } = countersRefs;
                // 1) archive counter depends ONLY on status change
                if (statusChanged) {
                    const delta = newStatus === "Published" ? 1 : -1;
                    this.updateCounter(tx, archiveRef, archiveSnap, delta);
                }
                // 2) category counters
                if (becamePublished) {
                    // add to the category it ends up in (newCategory if changed, else oldCategory)
                    this.updateCounter(tx, newCategoryRef, newCategorySnap, 1);
                }
                else if (becameDraft) {
                    // remove from the category it *was* in before (oldCategory)
                    this.updateCounter(tx, oldCategoryRef, oldCategorySnap, -1);
                }
                else if (movedWhilePublished) {
                    // published → published, just moved category
                    this.updateCounter(tx, oldCategoryRef, oldCategorySnap, -1);
                    this.updateCounter(tx, newCategoryRef, newCategorySnap, 1);
                }
            }
            return { payload, fileUrlsToDelete };
        });
        // Cleanup files (non-blocking)
        console.log("Cleanup files:", result.fileUrlsToDelete);
        (0, deleteFile_1.cleanupFiles)(result.fileUrlsToDelete);
        return result.payload;
    }
    async updateFeaturedPost(id) {
        const snap = await this.col().doc(id).get();
        const newIsFeatured = !snap.data()?.isFeatured;
        const isPublished = snap.data()?.status === "Published";
        // fetch featured post
        const featuredPost = await this.featuredPostList();
        // only published posts can be featured
        if (!isPublished && newIsFeatured) {
            throw new Error("Only published posts can be featured");
        }
        // only 2 posts can be featured at a time
        if (featuredPost.length > 2 && newIsFeatured) {
            throw new Error("Only 2 posts can be featured at a time");
        }
        return await this.col().doc(id).update({ isFeatured: newIsFeatured });
    }
    async deletePostWithCounters(id) {
        const result = await this.runTx(async (tx) => {
            // READ PHASE
            const { ref, doc } = await this.getDocumentTxById(tx, id);
            const monthKey = (0, date_converter_1.getMonthKey)(doc.createdAt);
            const fileUrlsToDelete = doc.files;
            const isPublished = doc.status === "Published";
            const refs = isPublished && {
                archive: this.archive(monthKey),
                category: this.category(doc.category),
            };
            const snaps = refs && (await tx.getAll(refs.archive, refs.category));
            // WRITE PHASE
            tx.delete(ref);
            // Update counters
            if (refs && snaps) {
                const [archiveSnap, categorySnap] = snaps;
                this.updateCounter(tx, refs.archive, archiveSnap, -1);
                this.updateCounter(tx, refs.category, categorySnap, -1);
            }
            return { fileUrlsToDelete };
        });
        // Cleanup files (non-blocking)
        (0, deleteFile_1.cleanupFiles)(result.fileUrlsToDelete);
        return result;
    }
    async deleteBulkWithCounters(ids) {
        const result = await this.runTx(async (tx) => {
            const { snaps, docs } = await this.getMultipleDocumentsTxById(tx, this.collectionName, ids);
            const { removedImagesSet, archiveDeltas, categoryDeltas } = (0, post_repo_helper_1.bulkHelper)(docs);
            // Build affected counter doc refs
            const archiveRefs = [...archiveDeltas.keys()].map((k) => this.archive(k));
            const categoryRefs = [...categoryDeltas.keys()].map((k) => this.category(k));
            // READ PHASE for counters with tx get all
            const [archiveSnaps, categorySnaps] = await Promise.all([
                Promise.all(archiveRefs.map((r) => tx.get(r))),
                Promise.all(categoryRefs.map((r) => tx.get(r))),
            ]);
            // WRITE PHASE
            for (const s of snaps) {
                if (s.exists)
                    tx.delete(s.ref);
            }
            // Update counters
            archiveSnaps.forEach((snaps, i) => {
                const ref = archiveRefs[i];
                const key = ref.id;
                const delta = archiveDeltas.get(key) ?? 0;
                this.updateCounter(tx, ref, snaps, delta);
            });
            categorySnaps.forEach((snaps, i) => {
                const ref = categoryRefs[i];
                const category = ref.id;
                const delta = categoryDeltas.get(category) ?? 0;
                this.updateCounter(tx, ref, snaps, delta);
            });
            return { removedImagesSet };
        });
        // Cleanup files (non-blocking)
        (0, deleteFile_1.cleanupFiles)(Array.from(result.removedImagesSet));
        return;
    }
    async getPostArchiveCountByMonth() {
        const qs = await this.db.collection(this.archiveCollectionName).get();
        return qs.docs.map((d) => ({
            month: d.id,
            totalPosts: d.data().totalPosts ?? 0,
        }));
    }
    async getPostCategoryCount() {
        const qs = await this.db.collection(this.categoryCountCollectionName).get();
        return qs.docs.map((d) => ({
            category: d.id,
            totalPosts: d.data().totalPosts ?? 0,
        }));
    }
    async getCurrentMonthPostCount() {
        const monthKey = (0, date_converter_1.getMonthKey)(new Date());
        const snap = await this.db.collection(collection_name_1.NEWS_ARCHIVES_COLLECTION).doc(monthKey).get();
        return { count: snap.data()?.totalPosts ?? 0 };
    }
    async featuredPostList() {
        const qs = await this.col().where("isFeatured", "==", true).where("status", "==", "Published").limit(3).get();
        return qs.docs.map((d) => this.validateData({
            ...d.data(),
            id: d.id,
        }));
    }
}
exports.NewsRepository = NewsRepository;
