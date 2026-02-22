import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";

import {
  NEWS_AND_UPDATES_COLLECTION,
  NEWS_TOTAL_COUNT_COLLECTION,
  NEWS_ARCHIVES_COLLECTION,
} from "../const/collection.name";

import { updateCounter } from "../utils/transaction.helper";
import { getMonthKey } from "../utils/date.converter";

import { deleteFile } from "../storage/deleteFile";

import type { WithId } from "./base.repository";
import type { DocumentReference } from "firebase-admin/firestore";
import type { Post, CreatePostRecord, PostArchiveCountByhMonth, PostCategoryCount } from "../types/post.types";

// import { createLogger } from "../utils/logger";
import { loggers } from "../services/logger.service";

export class NewsRepository extends FirestoreRepository<Post> {
  constructor(db: Firestore) {
    super(db, NEWS_AND_UPDATES_COLLECTION);
  }

  // compare old urls to new updated urls to get urls to delete
  private getFilesToDelete(oldFiles?: (string | unknown)[], newFiles?: string[]) {
    if (!newFiles) return [];

    const oldFileUrls = oldFiles?.filter((item): item is string => typeof item === "string") ?? [];
    return oldFileUrls.filter((url) => !newFiles.includes(url));
  }

  private async cleanupFiles(fileUrls: string[]) {
    if (!fileUrls.length) return;

    try {
      await deleteFile(fileUrls);
    } catch (error) {
      console.error("Failed to cleanup files:", error);
    }
  }

  async createWithCounters(payload: CreatePostRecord): Promise<{ id: string }> {
    const now = Date.now();
    const monthKey = getMonthKey(now);
    const isPublished = payload.status === "Published";

    return this.runTx(async (tx, db) => {
      const newsRef = db.collection(NEWS_AND_UPDATES_COLLECTION).doc();

      // READ PHASE - fetch counter snapshots if publishing
      const refs = isPublished
        ? {
            category: db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(payload.category),
            archive: db.collection(NEWS_ARCHIVES_COLLECTION).doc(monthKey),
          }
        : null;

      const snapshots = refs ? await Promise.all([tx.get(refs.category), tx.get(refs.archive)]) : null;

      // WRITE PHASE
      tx.set(newsRef, {
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update counters if publishing
      if (refs && snapshots) {
        const [categorySnap, archiveSnap] = snapshots;
        updateCounter(tx, refs.category, 1, categorySnap, { category: payload.category });
        updateCounter(tx, refs.archive, 1, archiveSnap, { month: monthKey });
      }

      // Log to database for admin dashboard
      await loggers({
        level: "info",
        action: "post_created",
        message: `Post "${payload.title}" created`,
        userId: payload.authorId,
        metadata: {
          postId: newsRef.id,
          category: payload.category,
          status: payload.status,
        },
      });

      return { id: newsRef.id };
    });
  }

  // async updateWithCounters(id: string, payload: Partial<Post>) {
  //   return this.runTx(async (tx, db) => {
  //     const postRef = db.collection(NEWS_AND_UPDATES_COLLECTION).doc(id);
  //     const postSnap = await tx.get(postRef);

  //     if (!postSnap.exists) {
  //       throw new Error(`Post with id ${id} not found`);
  //     }

  //     const post = postSnap.data() as Post;

  //     const monthKey = getMonthKey(post.createdAt);

  //     // Remove createdAt from payload so it does not get updated
  //     delete (payload as any).createdAt;

  //     //get old files url
  //     const oldFiles = post.files?.filter((item): item is string => typeof item === "string");

  //     // compare old files to new updated files to get files to delete
  //     const removedFiles = oldFiles?.filter((item): item is string => !payload.files.includes(item));

  //     // Determine what changed in category and status to update counters
  //     const oldStatus = post.status;
  //     const newStatus = payload.status ?? oldStatus;
  //     const statusChanged = oldStatus !== newStatus;

  //     const oldCategory = post.category;
  //     const newCategory = payload.category ?? oldCategory;
  //     const categoryChanged = oldCategory !== newCategory;

  //     const archiveRef = db.collection(NEWS_ARCHIVES_COLLECTION).doc(monthKey);
  //     const newCategoryRef = db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(payload.category);
  //     const oldCategoryRef = db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(post.category);

  //     // READ PHASE
  //     let archiveSnap;
  //     let newCategorySnap;
  //     let oldCategorySnap;

  //     if (payload.status === "Published") {
  //       newCategorySnap = await tx.get(newCategoryRef);
  //       archiveSnap = await tx.get(archiveRef);
  //     }

  //     // WRITE PHASE
  //     tx.set(postRef, { ...payload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  //     // ═══════════════════════════════════════════════════════
  //     // Handle counter updates based on what changed
  //     // ═══════════════════════════════════════════════════════

  //     // CASE 1: Status changed (Draft ↔ Published)
  //     if (statusChanged) {
  //       const delta = newStatus === "Published" ? 1 : -1;

  //       // Update archive
  //       updateCounter(tx, archiveRef, delta, archiveSnap!, { month: monthKey });

  //       // update  category both old and new to apply count update

  //       // update new category if category change and newstatus is published
  //       if (categoryChanged && newStatus === "Published") {
  //         updateCounter(tx, newCategoryRef, delta, newCategorySnap!, {
  //           category: newCategory,
  //         });
  //       }
  //       // update old category
  //       // update wont apply if category change with status set draft to published
  //       else {
  //         updateCounter(tx, oldCategoryRef, delta, oldCategorySnap!, {
  //           category: oldCategory,
  //         });
  //       }
  //     }
  //     // CASE 2: Only category changed (status stayed Published)
  //     else if (categoryChanged && newStatus === "Published") {
  //       // Remove from old category
  //       updateCounter(tx, oldCategoryRef, -1, oldCategorySnap!, { category: oldCategory });

  //       // update new category
  //       updateCounter(tx, newCategoryRef, 1, newCategorySnap!, { category: newCategory });
  //     }

  //     // remove old deleted files from storage
  //     if (removedFiles?.length) {
  //       await deleteFile(removedFiles).catch((cleanupErr) => {
  //         console.error("Failed to cleanup files:", cleanupErr);
  //       });
  //     }

  //     return { payload };
  //   });
  // }

  async patchWithCounters(id: string, payload: Partial<Post>) {
    return this.runTx(async (tx, db) => {
      const postRef = db.collection(NEWS_AND_UPDATES_COLLECTION).doc(id);
      const postSnap = await tx.get(postRef);

      if (!postSnap.exists) {
        throw new Error(`Post with id ${id} not found`);
      }

      const post = postSnap.data() as Post;

      const monthKey = getMonthKey(post.createdAt);

      // Prepare file cleanup
      const fileUrlsToDelete = this.getFilesToDelete(post.files, payload.files);

      // Determine what changed in category and status to update counters
      const oldStatus = post.status;
      const newStatus = payload.status ?? oldStatus;
      const statusChanged = oldStatus !== newStatus;

      const oldCategory = post.category;
      const newCategory = payload.category ?? oldCategory;
      const categoryChanged = oldCategory !== newCategory;

      //  // READ PHASE - prepare references for counters if status or category changed
      const refs =
        statusChanged || categoryChanged
          ? {
              archiveRef: db.collection(NEWS_ARCHIVES_COLLECTION).doc(monthKey),
              newCategoryRef: db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(payload.category ?? post.category),
              oldCategoryRef: db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(post.category),
            }
          : null;

      const snapshots = refs
        ? await Promise.all([tx.get(refs.oldCategoryRef), tx.get(refs.newCategoryRef), tx.get(refs.archiveRef)])
        : null;

      // WRITE PHASE
      tx.update(postRef, { ...payload, updatedAt: FieldValue.serverTimestamp() });

      // ═══════════════════════════════════════════════════════
      // Handle counter updates based on what changed
      // ═══════════════════════════════════════════════════════

      if (refs && snapshots) {
        const [oldCategorySnap, newCategorySnap, archiveSnap] = snapshots;
        const { archiveRef, newCategoryRef, oldCategoryRef } = refs;

        // 1) archive counter depends ONLY on status change
        if (statusChanged) {
          const delta = newStatus === "Published" ? 1 : -1;
          updateCounter(tx, archiveRef, delta, archiveSnap!, { month: monthKey });
        }

        // 2) category counters
        // Only touch category counters when the post is published *after* the update OR it was published and is being moved.
        const becamePublished = statusChanged && newStatus === "Published";
        const becameDraft = statusChanged && newStatus !== "Published"; // leaving Published
        const movedWhilePublished = !statusChanged && categoryChanged && newStatus === "Published";

        if (becamePublished) {
          // add to the category it ends up in (newCategory if changed, else oldCategory)
          const targetRef = categoryChanged ? newCategoryRef : oldCategoryRef;
          const targetSnap = categoryChanged ? newCategorySnap : oldCategorySnap;
          const targetCategory = categoryChanged ? newCategory : oldCategory;

          updateCounter(tx, targetRef, 1, targetSnap!, { category: targetCategory });
        } else if (becameDraft) {
          // remove from the category it *was* in before (oldCategory)
          updateCounter(tx, oldCategoryRef, -1, oldCategorySnap!, { category: oldCategory });
        } else if (movedWhilePublished) {
          // published → published, just moved category
          updateCounter(tx, oldCategoryRef, -1, oldCategorySnap!, { category: oldCategory });
          updateCounter(tx, newCategoryRef, 1, newCategorySnap!, { category: newCategory });
        }
      }

      // Cleanup files (non-blocking)
      this.cleanupFiles(fileUrlsToDelete);

      return { payload };
    });
  }

  async deletePostWithCounters(id: string) {
    const now = Date.now();
    const monthKey = getMonthKey(now);

    return this.runTx(async (tx, db) => {
      const postRef = db.collection(NEWS_AND_UPDATES_COLLECTION).doc(id);
      const postSnap = await tx.get(postRef);
      const post = postSnap.data() as Post;
      const urlsToDelete = post.files;

      const archiveRef = db.collection(NEWS_ARCHIVES_COLLECTION).doc(monthKey);
      const categoryRef = db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(post.category);

      // READ PHASE
      const archiveSnap = await tx.get(archiveRef);
      const categorySnap = await tx.get(categoryRef);

      // WRITE PHASE
      tx.delete(postRef);
      updateCounter(tx, archiveRef, -1, archiveSnap!, { month: monthKey });
      updateCounter(tx, categoryRef, -1, categorySnap!, { category: post.category });

      // Cleanup files (non-blocking)
      this.cleanupFiles(urlsToDelete);

      return;
    });
  }

  async deleteBulkWithCounters(ids: string[]) {
    return await this.runTx(async (tx, db) => {
      const postRefs = ids.map((id) => db.collection(NEWS_AND_UPDATES_COLLECTION).doc(id));
      const postSnaps = await Promise.all(postRefs.map((ref) => tx.get(ref)));

      const docs = postSnaps.filter((s) => s.exists).map((s) => ({ ref: s.ref, data: s.data() as Post }));

      if (!docs.length) return { deletedIds: [] as string[], removedImages: [] as string[] };

      const removedImagesSet: string[] = [];
      const archiveDeltas = new Map<string, number>(); // monthKey -> delta
      const categoryDeltas = new Map<string, number>(); // category -> delta

      for (const { data } of docs) {
        // collect all images to delete (published or not)
        (data.files as string[] | undefined)?.forEach((url) => {
          if (typeof url === "string" && url) removedImagesSet.push(url);
        });

        // counters only for published posts
        if (data.status !== "Published") continue;

        // normalize createdAt -> epoch ms for month key
        const createdAtMs =
          typeof (data as any).createdAt === "number"
            ? (data as any).createdAt
            : ((data as any).createdAt?.toMillis?.() ?? Date.now());

        const monthKey = getMonthKey(createdAtMs);

        archiveDeltas.set(monthKey, (archiveDeltas.get(monthKey) ?? 0) - 1);

        const category = data.category;
        categoryDeltas.set(category, (categoryDeltas.get(category) ?? 0) - 1);
      }

      // Build affected counter doc refs
      const archiveRefs: DocumentReference[] = [...archiveDeltas.keys()].map((k) =>
        db.collection(NEWS_ARCHIVES_COLLECTION).doc(k),
      );

      const categoryRefs: DocumentReference[] = [...categoryDeltas.keys()].map((k) =>
        db.collection(NEWS_TOTAL_COUNT_COLLECTION).doc(k),
      );

      // READ PHASE for counters
      const [archiveSnaps, categorySnaps] = await Promise.all([
        Promise.all(archiveRefs.map((r) => tx.get(r))),
        Promise.all(categoryRefs.map((r) => tx.get(r))),
      ]);

      // WRITE PHASE: delete posts
      for (const s of postSnaps) {
        if (s.exists) tx.delete(s.ref);
      }

      // WRITE PHASE: apply archive deltas
      archiveSnaps.forEach((snap, i) => {
        const ref = archiveRefs[i];
        const key = ref.id;
        const delta = archiveDeltas.get(key) ?? 0;
        if (delta !== 0) updateCounter(tx, ref, delta, snap, { month: key });
      });

      // WRITE PHASE: apply category deltas
      categorySnaps.forEach((snap, i) => {
        const ref = categoryRefs[i];
        const category = ref.id;
        const delta = categoryDeltas.get(category) ?? 0;
        if (delta !== 0) updateCounter(tx, ref, delta, snap, { category });
      });

      this.cleanupFiles(removedImagesSet);

      return;
    });
  }

  async listPublished(limitCount = 10): Promise<WithId<CreatePostRecord>[]> {
    const qs = await this.col().orderBy("createdAt", "desc").limit(limitCount).get();
    return qs.docs.map((d) => ({ ...(d.data() as Post), id: d.id }));
  }

  async totalCount(): Promise<number> {
    const snap = await this.col().count().get();
    return snap.data().count;
  }

  async categoryList(): Promise<PostCategoryCount[]> {
    const qs = await this.db.collection(NEWS_TOTAL_COUNT_COLLECTION).get();

    return qs.docs.map((d) => ({
      category: d.id,
      totalPosts: d.data().totalPosts ?? 0,
    }));
  }

  async archivePostList(): Promise<PostArchiveCountByhMonth[]> {
    const qs = await this.db.collection(NEWS_ARCHIVES_COLLECTION).get();

    return qs.docs.map((d) => ({
      month: d.id,
      totalPosts: d.data().totalPosts ?? 0,
    }));
  }

  async currentMonthPostCount(): Promise<{ count: number }> {
    const monthKey = getMonthKey(new Date());

    const snap = await this.db.collection(NEWS_ARCHIVES_COLLECTION).doc(monthKey).get();
    return { count: snap.data()?.totalPosts ?? 0 };
  }

  async featuredPostList(): Promise<WithId<Post>[]> {
    const qs = await this.col().where("isFeatured", "==", true).limit(3).get();

    return qs.docs.map((d) => ({
      ...(d.data() as Post),
      id: d.id,
    }));
  }

  async updateFeaturedPost(id: string) {
    const snap = await this.col().doc(id).get();

    const newIsFeatured = !snap.data()?.isFeatured;

    return await this.col().doc(id).update({ isFeatured: newIsFeatured });
  }
}
