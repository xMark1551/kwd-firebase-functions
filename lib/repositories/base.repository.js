"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreRepository = void 0;
const firestore_1 = require("firebase-admin/firestore");
// import type { WithId, BaseDoc } from "./types";
class FirestoreRepository {
    constructor(db, collectionName) {
        this.db = db;
        this.collectionName = collectionName;
    }
    col() {
        return this.db.collection(this.collectionName);
    }
    /**
     * ✅ Reusable transaction runner
     * - Keeps access to db + typed tx
     * - You can pass options if you want (maxAttempts)
     */
    runTx(fn) {
        return this.db.runTransaction((tx) => fn(tx, this.db));
    }
    async create(data, id) {
        const ref = id ? this.col().doc(id) : this.col().doc();
        const payload = {
            ...data,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        await ref.set(payload);
        // Return client-friendly (timestamps not resolved yet)
        return { id: ref.id, ...data };
    }
    async getById(id) {
        const snap = await this.col().doc(id).get();
        if (!snap.exists)
            return null;
        return { id: snap.id, ...snap.data() };
    }
    async update(id, patch) {
        const ref = this.col().doc(id);
        await ref.update({
            ...patch,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
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
        const unique = [...new Set(ids)].filter(Boolean);
        if (unique.length === 0)
            return { deletedIds: [] };
        const deletedIds = [];
        for (let i = 0; i < unique.length; i += 500) {
            const chunk = unique.slice(i, i + 500);
            const batch = this.db.batch();
            for (const id of chunk) {
                batch.delete(this.col().doc(id));
            }
            await batch.commit();
            deletedIds.push(...chunk);
        }
        return { deletedIds };
    }
    // Optional: list latest docs
    async listLatest(limitCount = 10) {
        const qs = await this.col().orderBy("createdAt", "desc").limit(limitCount).get();
        return qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    // Optional: list latest docs
    async listAllWithFilters(filters = []) {
        let q = this.col();
        for (const f of filters) {
            q = q.where(f.field, f.op, f.value);
        }
        const qs = await q.get();
        return qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    // ✅ Paginated list (cursor-based)
    async getPaginated(params) {
        const page = params?.page ?? 1; // ✅ added
        const pageSize = Number(params?.pageSize ?? 10);
        const filters = params?.filters ?? [];
        const order = params?.order ?? { field: "createdAt", direction: "desc" };
        if (page < 1)
            throw new Error("page must be >= 1");
        // NOTE: PageCursor shape assumes createdAt + id.
        // If you use order.field !== "createdAt", you should change PageCursor accordingly.
        if (order.field !== "createdAt") {
            throw new Error(`Page jump supported only for order.field="createdAt" (got "${order.field}")`);
        }
        // Build base query once (filters + stable ordering)
        let qBase = this.col();
        for (const f of filters) {
            qBase = qBase.where(f.field, f.op, f.value);
        }
        qBase = qBase.orderBy(order.field, order.direction).orderBy("__name__", order.direction);
        // Start cursor:
        // - if user provided cursor, it wins
        // - else if page>1, we will walk to compute cursor
        let cursor = params?.cursor ?? null;
        // ✅ jump pages by walking sequentially (Firestore limitation)
        if (!cursor && page > 1) {
            let walkCursor = null;
            for (let p = 1; p < page; p++) {
                let qWalk = qBase.limit(pageSize);
                if (walkCursor)
                    qWalk = qWalk.startAfter(walkCursor.createdAt, walkCursor.id);
                const snap = await qWalk.get();
                const last = snap.docs[snap.docs.length - 1];
                // If we ran out of docs before reaching target page
                if (!last) {
                    return { items: [], nextCursor: null, meta: { pageSize, currentPage: p } };
                }
                const lastCreatedAt = last.get(order.field);
                if (!lastCreatedAt) {
                    return { items: [], nextCursor: null, meta: { pageSize, currentPage: p } };
                }
                walkCursor = { createdAt: lastCreatedAt, id: last.id };
            }
            cursor = walkCursor; // cursor to start the requested page
        }
        // Final query for requested page
        let qFinal = qBase.limit(pageSize);
        if (cursor)
            qFinal = qFinal.startAfter(cursor.createdAt, cursor.id);
        const snap = await qFinal.get();
        const data = snap.docs.map((d) => {
            const doc = d.data();
            const createdAt = doc.createdAt;
            return {
                id: d.id,
                ...doc,
                createdAt: createdAt ? createdAt.toMillis() : null, // ✅ convert for client
                updatedAt: doc.updatedAt ? doc.updatedAt.toMillis() : null,
            };
        });
        const last = snap.docs[snap.docs.length - 1];
        const lastCreatedAt = last?.get(order.field);
        const nextCursor = last && lastCreatedAt ? { createdAt: lastCreatedAt, id: last.id } : null;
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
