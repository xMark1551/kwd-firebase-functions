"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreRepository = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("firebase-admin/firestore");
const MAX_BATCH_SIZE = 500; // Firestore hard limit per batch
// import type { WithId, BaseDoc } from "./types";
class FirestoreRepository {
    constructor(db, collectionName, schema) {
        this.db = db;
        this.collectionName = collectionName;
        this.schema = schema;
    }
    col() {
        return this.db.collection(this.collectionName);
    }
    doc(id) {
        return this.col().doc(id);
    }
    // helper to validate Firestore data
    validateData(data, toClient = true) {
        if (!this.schema) {
            // fallback: just normalize timestamps
            const normalized = { ...data };
            if (toClient) {
                if (normalized.createdAt)
                    normalized.createdAt = normalized.createdAt.toMillis();
                if (normalized.updatedAt)
                    normalized.updatedAt = normalized.updatedAt.toMillis();
            }
            return normalized;
        }
        // Zod validation, strips unknown fields
        const parsed = this.schema.parse(data);
        // normalize timestamps if requested
        if (toClient) {
            const withTimestamps = { ...parsed };
            if (withTimestamps.createdAt)
                withTimestamps.createdAt = withTimestamps.createdAt.toMillis();
            if (withTimestamps.updatedAt)
                withTimestamps.updatedAt = withTimestamps.updatedAt.toMillis();
            return withTimestamps;
        }
        return parsed;
    }
    /**
     * Walks forward through pages to find the cursor position just before `targetPage`.
     * - If `startCursor` is provided, walking begins from there (forward jump).
     * - If `startCursor` is null, walking begins from page 1 (scratch / backward).
     * Returns the cursor sitting at the end of page (targetPage - 1), or null if page 1.
     */
    async resolveCursorForPage(qBase, targetPage, pageSize, orderField, startCursor = null, startPage = 1) {
        if (targetPage === 1)
            return { cursor: null, pageFetched: [] };
        const pageFetched = [];
        let walkCursor = startCursor;
        for (let p = startPage; p < targetPage; p++) {
            let q = qBase.limit(pageSize);
            pageFetched.push(`page${p}`);
            // console.log(`[resolveCursorForPage] Fetching page ${p}...`);
            if (walkCursor) {
                q = q.startAfter(walkCursor.createdAt, walkCursor.id);
            }
            const snap = await q.get();
            const last = snap.docs[snap.docs.length - 1];
            if (!last)
                return { cursor: null, pageFetched: [] };
            const lastCreatedAt = last.get(orderField);
            if (!lastCreatedAt)
                return { cursor: null, pageFetched: [] };
            walkCursor = {
                createdAt: lastCreatedAt,
                id: last.id,
            };
        }
        return { cursor: walkCursor, pageFetched };
    }
    /**
     *  Reusable transaction runner
     * - Keeps access to db + typed tx
     * - You can pass options if you want (maxAttempts)
     */
    async runTx(fn) {
        return this.db.runTransaction((tx) => {
            const wrappedTx = Object.assign(Object.create(Object.getPrototypeOf(tx)), tx, {
                set: (ref, data, options) => {
                    const withTimestamps = {
                        ...data,
                        createdAt: firestore_1.FieldValue.serverTimestamp(),
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    };
                    return options ? tx.set(ref, withTimestamps, options) : tx.set(ref, withTimestamps);
                },
                update: (ref, data) => {
                    return tx.update(ref, {
                        ...data,
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    });
                },
            });
            return fn(wrappedTx, this.db);
        });
    }
    async create(data, id) {
        console.log("payload:", data);
        const ref = id ? this.col().doc(id) : this.col().doc();
        const payload = {
            ...data,
            createdAt: firestore_2.Timestamp.now(),
            updatedAt: firestore_2.Timestamp.now(),
        };
        await ref.set(payload);
        // Return client-friendly (timestamps not resolved yet)
        return this.validateData({ ...payload, id: ref.id });
    }
    async update(id, patch) {
        const ref = this.col().doc(id);
        await ref.update({
            ...patch,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { id, ...patch };
    }
    async bulkUpdate(items) {
        const clean = (items ?? [])
            .filter((x) => x?.id)
            // de-dupe by id (last patch wins)
            .reduce((acc, cur) => {
            acc.set(cur.id, cur.patch ?? {});
            return acc;
        }, new Map());
        if (clean.size === 0)
            return { updatedIds: [] };
        const entries = Array.from(clean.entries()); // [id, patch]
        const updatedIds = [];
        for (let i = 0; i < entries.length; i += 500) {
            const chunk = entries.slice(i, i + 500);
            const batch = this.db.batch();
            for (const [id, patch] of chunk) {
                batch.update(this.col().doc(id), {
                    ...patch,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
            }
            await batch.commit();
            updatedIds.push(...chunk.map(([id]) => id));
        }
        return { updatedIds };
    }
    async set(id, data, opts = { merge: true }) {
        const ref = this.col().doc(id);
        await ref.set({
            ...data,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: opts.merge ?? true });
    }
    async delete(id) {
        await this.col().doc(id).delete();
    }
    async bulkDelete(ids) {
        // Deduplicate and remove any null/undefined/empty string IDs
        const unique = [...new Set(ids)].filter((id) => typeof id === "string" && id.trim() !== "");
        if (unique.length === 0)
            return { deletedIds: [], failedIds: [] };
        const deletedIds = [];
        const failedIds = [];
        for (let i = 0; i < unique.length; i += MAX_BATCH_SIZE) {
            const chunk = unique.slice(i, i + MAX_BATCH_SIZE);
            try {
                const batch = this.db.batch();
                // Stage all deletes for this chunk
                for (const id of chunk) {
                    batch.delete(this.col().doc(id));
                }
                // Commit atomically — all succeed or all fail
                await batch.commit();
                deletedIds.push(...chunk);
                // console.log(
                //   `[bulkDelete] Batch ${Math.floor(i / MAX_BATCH_SIZE) + 1} committed — ${chunk.length} docs deleted.`,
                // );
            }
            catch (error) {
                // Track failed IDs separately instead of crashing the whole operation
                console.error(`[bulkDelete] Batch ${Math.floor(i / MAX_BATCH_SIZE) + 1} failed:`, error);
                failedIds.push(...chunk);
            }
        }
        return { deletedIds, failedIds };
    }
    async getById(id) {
        const snap = await this.col().doc(id).get();
        if (!snap.exists)
            return null;
        return this.validateData({ id: snap.id, ...snap.data() });
    }
    async getByIds(ids) {
        if (!ids.length)
            return [];
        const refs = ids.map((id) => this.col().doc(id));
        const snaps = await this.db.getAll(...refs);
        return snaps.map((snap) => this.validateData({ id: snap.id, ...snap.data() }));
    }
    // Optional: list latest docs
    async listAllWithFilters(filters = []) {
        let q = this.col();
        for (const f of filters) {
            q = q.where(f.field, f.op, f.value);
        }
        const qs = await q.get();
        return qs.docs.map((d) => this.validateData({ id: d.id, ...d.data() }));
    }
    async getPaginated(params) {
        const page = params?.page ?? 1;
        const pageSize = Number(params?.pageSize ?? 10);
        const filters = params?.filters ?? [];
        // If a cursor is provided and it matches the page size, use it as the starting point
        const cursor = params?.cursor?.limit === pageSize && page > 1 ? params.cursor : null;
        if (page < 1)
            throw new Error("page must be >= 1");
        const delta = cursor ? page - cursor.page : null;
        // For backward jumps, flip the Firestore order so we can walk in reverse
        const isBackward = delta != null && delta < 0;
        const orderDirection = isBackward ? "asc" : "desc";
        const order = params?.order ?? { field: "createdAt", direction: orderDirection };
        if (order.field !== "createdAt") {
            throw new Error(`Page jump supported only for order.field="createdAt" (got "${order.field}")`);
        }
        // Build base query
        let qBase = this.col();
        for (const f of filters) {
            qBase = qBase.where(f.field, f.op, f.value);
        }
        qBase = qBase.orderBy(order.field, order.direction).orderBy("__name__", order.direction);
        // Re-hydrate cursor timestamps
        if (cursor) {
            cursor.lastCreatedAt = firestore_2.Timestamp.fromMillis(cursor.lastCreatedAt);
            cursor.firstCreatedAt = firestore_2.Timestamp.fromMillis(cursor.firstCreatedAt);
        }
        console.log("[getPaginated] Cursor", cursor);
        // Set default cursor
        let walkCursor = cursor ? { createdAt: cursor.lastCreatedAt, id: cursor.lastId } : null;
        if (cursor?.page != null && delta != null) {
            if (delta === 1) {
                console.log("[getPaginated] Sequential forward — use cursor as-is", { page, delta });
                // cursor is already the last doc of the previous page — perfect
            }
            else if (delta > 1) {
                console.log("[getPaginated] Jump forward", { page, delta });
                walkCursor = {
                    createdAt: cursor.lastCreatedAt,
                    id: cursor.lastId,
                };
                const { cursor: currentCursor, pageFetched } = await this.resolveCursorForPage(qBase, page, pageSize, order.field, walkCursor, cursor.page + 1);
                walkCursor = currentCursor;
                console.log("[getPaginated] Jump forward", { pageFetched });
            }
            else {
                // delta < 0 — backward jump
                // qBase is already ordered ASC (reversed), so startAfter(cursorFirstCreatedAt)
                // walks *backwards* in real time. We need to walk abs(delta) - 1 more pages.
                console.log("[getPaginated] Jump backward", { page, delta });
                const stepsBack = Math.abs(delta); // how many pages to rewind
                walkCursor = {
                    createdAt: cursor.firstCreatedAt,
                    id: cursor.firstId,
                };
                if (stepsBack === 1) {
                    // One page back: start from cursorFirstCreatedAt of the current window
                    console.log("[getPaginated] Sequential backward — use cursor as-is", { page, delta });
                }
                else {
                    // Multi-page backward: walk stepsBack - 1 extra pages from cursorFirst
                    const { cursor: currentCursor, pageFetched } = await this.resolveCursorForPage(qBase, stepsBack, // walk stepsBack - 1 pages (loop is p < targetPage)
                    pageSize, order.field, walkCursor, 1);
                    walkCursor = currentCursor;
                    console.log("[getPaginated] Jump backward", { pageFetched });
                }
            }
        }
        else if (!cursor && page > 1) {
            console.log("[getPaginated] No cursor, walk from scratch", { page });
            const { cursor: currentCursor, pageFetched } = await this.resolveCursorForPage(qBase, page, pageSize, order.field, null, 1);
            walkCursor = currentCursor;
            console.log("[getPaginated] Walk from scratch", { pageFetched });
        }
        console.log("[getPaginated] Final cursor", walkCursor);
        // Final query
        let qFinal = qBase.limit(pageSize);
        if (walkCursor) {
            qFinal = qFinal.startAfter(walkCursor.createdAt, walkCursor.id);
        }
        const snap = await qFinal.get();
        // For backward queries Firestore returned docs in ASC order — reverse to get DESC
        const docs = isBackward ? [...snap.docs].reverse() : snap.docs;
        const data = docs.map((d) => {
            const doc = d.data();
            return this.validateData({ id: d.id, ...doc });
        });
        const last = docs[docs.length - 1];
        const first = docs[0];
        const lastCreatedAt = last?.get(order.field);
        const firstCreatedAt = first?.get(order.field);
        const nextCursor = last && lastCreatedAt && first && firstCreatedAt
            ? {
                page: page,
                limit: pageSize,
                firstCreatedAt: firstCreatedAt.toMillis(),
                firstId: first.id,
                lastCreatedAt: lastCreatedAt.toMillis(),
                lastId: last.id,
            }
            : null;
        return { items: data, nextCursor, meta: { pageSize, currentPage: page } };
    }
    async totalCount(filters = []) {
        let q = this.col();
        for (const f of filters) {
            q = q.where(f.field, f.op, f.value);
        }
        const snap = await q.count().get();
        return snap.data().count;
    }
}
exports.FirestoreRepository = FirestoreRepository;
