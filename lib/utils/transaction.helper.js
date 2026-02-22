"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCounter = void 0;
const firestore_1 = require("firebase-admin/firestore");
const updateCounter = async (tx, ref, delta, snap, extraOnUpdate = {}) => {
    const now = firestore_1.FieldValue.serverTimestamp();
    if (snap.exists) {
        const data = snap.data() || {};
        const current = typeof data.totalPosts === "number" ? data.totalPosts : 0;
        const next = current + delta;
        // avoid negative counters: delete when reaches 0 or below
        if (next <= 0) {
            tx.delete(ref);
            return;
        }
        tx.update(ref, {
            ...extraOnUpdate,
            totalPosts: firestore_1.FieldValue.increment(delta),
            updatedAt: now,
        });
        return;
    }
    // if doc doesn't exist, don't allow negative create
    if (delta <= 0)
        return;
    tx.set(ref, {
        ...extraOnUpdate, // (this is "on create" fields too)
        totalPosts: firestore_1.FieldValue.increment(delta),
        createdAt: now,
        updatedAt: now,
    });
};
exports.updateCounter = updateCounter;
