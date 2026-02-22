import type { Transaction, DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

export const updateCounter = async (
  tx: Transaction,
  ref: DocumentReference,
  delta: number,
  snap: DocumentSnapshot,
  extraOnUpdate: Record<string, any> = {},
) => {
  const now = FieldValue.serverTimestamp();

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
      totalPosts: FieldValue.increment(delta),
      updatedAt: now,
    });
    return;
  }

  // if doc doesn't exist, don't allow negative create
  if (delta <= 0) return;

  tx.set(ref, {
    ...extraOnUpdate, // (this is "on create" fields too)
    totalPosts: FieldValue.increment(delta),
    createdAt: now,
    updatedAt: now,
  });
};
