import { Firestore, FieldValue } from "firebase-admin/firestore";
import type { Transaction, DocumentSnapshot, DocumentReference, DocumentData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import type { WithId } from "./base.repository";

import { getMonthKey } from "../utils/date.converter";
import { bulkHelper, resolvePostStateTransitions } from "../utils/post.helpers/post.repo.helper";
import { getFilesToDelete, cleanupFiles } from "../storage/deleteFile";

import {
  NEWS_AND_UPDATES_COLLECTION,
  NEWS_TOTAL_COUNT_COLLECTION,
  NEWS_ARCHIVES_COLLECTION,
} from "../const/collection.name";

import { Post, postSchema } from "../model/post.model.schema";
import type { CreatePost, PatchPost } from "../validation/post.schema";
import type { PostArchiveCountByhMonth, PostCategoryCount } from "../types/post.types";

export class NewsRepository extends FirestoreRepository<Post> {
  constructor(db: Firestore) {
    super(db, NEWS_AND_UPDATES_COLLECTION, postSchema);
  }

  private readonly categoryCountCollectionName = NEWS_TOTAL_COUNT_COLLECTION;
  private readonly archiveCollectionName = NEWS_ARCHIVES_COLLECTION;

  // counters
  protected category(category: string) {
    return this.db.collection(this.categoryCountCollectionName).doc(category);
  }

  protected archive(monthKey: string) {
    return this.db.collection(this.archiveCollectionName).doc(monthKey);
  }

  protected async getDocumentTxById<T = DocumentData>(
    tx: Transaction,
    id: string,
  ): Promise<{ ref: DocumentReference<T>; snap: DocumentSnapshot<T>; doc: T }> {
    const ref = this.col().doc(id) as DocumentReference<T>;
    const snap = await tx.get(ref);
    const doc = snap.data();

    if (!doc) throw new Error(`Document with id ${id} not found`);

    // Only return undefined if not required
    return { ref, snap, doc };
  }

  protected async getMultipleDocumentsTxById<T = DocumentData>(
    tx: Transaction,
    col: string,
    ids: string[],
  ): Promise<{
    refs: DocumentReference<T>[];
    snaps: DocumentSnapshot<T>[];
    docs: { ref: DocumentReference<T>; data: T }[];
  }> {
    const refs = ids.map((id) => this.db.collection(col).doc(id) as DocumentReference<T>);
    const snaps = await tx.getAll(...refs);
    const docs = snaps.filter((s) => s.exists).map((s) => ({ ref: s.ref, data: s.data() as T }));

    if (!docs.length) throw new Error(`Documents with ids ${ids} not found`);

    // Only return undefined if not required
    return { refs, snaps, docs };
  }

  private updateCounter(tx: Transaction, ref: DocumentReference, snap: DocumentSnapshot, amount: number) {
    if (snap && snap.exists) {
      const data = snap.data() || {};
      const current = typeof data.totalPosts === "number" ? data.totalPosts : 0;
      const next = current + amount;

      // avoid negative counters: delete when reaches 0 or below
      if (next <= 0) {
        tx.delete(ref);
        return;
      }

      tx.update(ref, { totalPosts: FieldValue.increment(amount) });
    } else {
      // avoid negative counters
      if (amount < 0) return;
      tx.set(ref, { totalPosts: FieldValue.increment(amount) });
    }
  }

  async createWithCounters(payload: CreatePost): Promise<WithId<CreatePost>> {
    const monthKey = getMonthKey(Date.now());
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

  async patchWithCounters(id: string, payload: PatchPost): Promise<PatchPost> {
    const result = await this.runTx(async (tx) => {
      // READ PHASE
      const { ref, doc } = await this.getDocumentTxById<Post>(tx, id);

      const monthKey = getMonthKey(doc.createdAt);

      // Prepare file cleanup
      const fileUrlsToDelete = getFilesToDelete(doc.files, payload.files);

      // Determine what changed in category and status to update counters
      const {
        newStatus,
        statusChanged,
        oldCategory,
        newCategory,
        categoryChanged,
        becamePublished,
        becameDraft,
        movedWhilePublished,
      } = resolvePostStateTransitions(doc, payload);

      const countersRefs =
        categoryChanged || statusChanged
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
          this.updateCounter(tx, archiveRef, archiveSnap, delta!);
        }

        // 2) category counters
        if (becamePublished) {
          // add to the category it ends up in (newCategory if changed, else oldCategory)
          this.updateCounter(tx, newCategoryRef, newCategorySnap, 1);
        } else if (becameDraft) {
          // remove from the category it *was* in before (oldCategory)
          this.updateCounter(tx, oldCategoryRef, oldCategorySnap, -1);
        } else if (movedWhilePublished) {
          // published → published, just moved category
          this.updateCounter(tx, oldCategoryRef, oldCategorySnap, -1);
          this.updateCounter(tx, newCategoryRef, newCategorySnap, 1);
        }
      }

      return { payload, fileUrlsToDelete };
    });

    // Cleanup files (non-blocking)
    console.log("Cleanup files:", result.fileUrlsToDelete);
    cleanupFiles(result.fileUrlsToDelete);

    return result.payload;
  }

  async updateFeaturedPost(id: string) {
    const snap = await this.col().doc(id).get();

    const newIsFeatured = !snap.data()?.isFeatured;

    return await this.col().doc(id).update({ isFeatured: newIsFeatured });
  }

  async deletePostWithCounters(id: string) {
    const result = await this.runTx(async (tx) => {
      // READ PHASE
      const { ref, doc } = await this.getDocumentTxById<Post>(tx, id);

      const monthKey = getMonthKey(doc.createdAt);
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
    cleanupFiles(result.fileUrlsToDelete);

    return result;
  }

  async deleteBulkWithCounters(ids: string[]) {
    const result = await this.runTx(async (tx) => {
      const { snaps, docs } = await this.getMultipleDocumentsTxById<Post>(tx, this.collectionName, ids);

      const { removedImagesSet, archiveDeltas, categoryDeltas } = bulkHelper(docs);

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
        if (s.exists) tx.delete(s.ref);
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
    cleanupFiles(Array.from(result.removedImagesSet));

    return;
  }

  async getPostArchiveCountByMonth(): Promise<PostArchiveCountByhMonth[]> {
    const qs = await this.db.collection(this.archiveCollectionName).get();

    return qs.docs.map((d) => ({
      month: d.id,
      totalPosts: d.data().totalPosts ?? 0,
    }));
  }

  async getPostCategoryCount(): Promise<PostCategoryCount[]> {
    const qs = await this.db.collection(this.categoryCountCollectionName).get();

    return qs.docs.map((d) => ({
      category: d.id,
      totalPosts: d.data().totalPosts ?? 0,
    }));
  }

  async getCurrentMonthPostCount(): Promise<{ count: number }> {
    const monthKey = getMonthKey(new Date());

    const snap = await this.db.collection(NEWS_ARCHIVES_COLLECTION).doc(monthKey).get();
    return { count: snap.data()?.totalPosts ?? 0 };
  }

  async featuredPostList(): Promise<WithId<Post>[]> {
    const qs = await this.col().where("isFeatured", "==", true).limit(3).get();

    return qs.docs.map((d) =>
      this.validateData({
        ...(d.data() as Post),
        id: d.id,
      }),
    );
  }
}
