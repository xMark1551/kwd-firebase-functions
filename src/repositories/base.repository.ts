// src/repositories/base.repository.ts
import type { CollectionReference, DocumentData, Firestore, Query, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import { Timestamp } from "firebase-admin/firestore";

import type { DocumentReference, SetOptions, UpdateData } from "firebase-admin/firestore";

import { ZodSchema } from "zod";

export type WithId<T> = T & { id: string };

// Store timestamps as Firestore Timestamp in DB
export type BaseDoc = {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type WhereFilter = {
  field: string;
  op: FirebaseFirestore.WhereFilterOp;
  value: any;
};

export type PageCursor = {
  // page number
  page: number;
  limit: number;

  // createdAt of the FIRST item you received
  firstCreatedAt: number | Timestamp;
  // id of the FIRST item you received
  firstId: string;
  // createdAt of the LAST item you received
  lastCreatedAt: number | Timestamp;
  // id of the LAST item you received (tie-breaker)
  lastId: string;
};

export type WalkCursor = {
  createdAt?: number | Timestamp;
  id?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: {
    currentPage: number;
    pageSize: number;
  };
  nextCursor: PageCursor | null;
};

const MAX_BATCH_SIZE = 500; // Firestore hard limit per batch

// import type { WithId, BaseDoc } from "./types";

export class FirestoreRepository<T extends BaseDoc> {
  constructor(
    protected readonly db: Firestore,
    protected readonly collectionName: string,
    private readonly schema?: ZodSchema<T>, // add schema
  ) {}

  protected col(): CollectionReference<DocumentData> {
    return this.db.collection(this.collectionName);
  }

  protected doc(id: string): DocumentReference<DocumentData> {
    return this.col().doc(id);
  }

  // helper to validate Firestore data
  protected validateData(data: any, toClient = true): T {
    if (!this.schema) {
      // fallback: just normalize timestamps
      const normalized = { ...data };
      if (toClient) {
        if (normalized.createdAt) normalized.createdAt = (normalized.createdAt as Timestamp).toMillis();
        if (normalized.updatedAt) normalized.updatedAt = (normalized.updatedAt as Timestamp).toMillis();
      }

      return normalized as T;
    }

    // Zod validation, strips unknown fields
    const parsed = this.schema.parse(data);

    // normalize timestamps if requested
    if (toClient) {
      const withTimestamps = { ...parsed } as any;
      if (withTimestamps.createdAt) withTimestamps.createdAt = (withTimestamps.createdAt as Timestamp).toMillis();
      if (withTimestamps.updatedAt) withTimestamps.updatedAt = (withTimestamps.updatedAt as Timestamp).toMillis();
      return withTimestamps as T;
    }

    return parsed;
  }

  /**
   * Walks forward through pages to find the cursor position just before `targetPage`.
   * - If `startCursor` is provided, walking begins from there (forward jump).
   * - If `startCursor` is null, walking begins from page 1 (scratch / backward).
   * Returns the cursor sitting at the end of page (targetPage - 1), or null if page 1.
   */
  protected async resolveCursorForPage(
    qBase: Query<DocumentData>,
    targetPage: number,
    pageSize: number,
    orderField: string,
    startCursor: WalkCursor | null = null,
    startPage: number = 1,
  ): Promise<{ cursor: WalkCursor | null; pageFetched: string[] }> {
    if (targetPage === 1) return { cursor: null, pageFetched: [] };

    const pageFetched: string[] = [];

    let walkCursor: WalkCursor | null = startCursor;

    for (let p = startPage; p < targetPage; p++) {
      let q = qBase.limit(pageSize);

      pageFetched.push(`page${p}`);

      // console.log(`[resolveCursorForPage] Fetching page ${p}...`);

      if (walkCursor) {
        q = q.startAfter(walkCursor.createdAt, walkCursor.id);
      }

      const snap = await q.get();
      const last = snap.docs[snap.docs.length - 1];
      if (!last) return { cursor: null, pageFetched: [] };

      const lastCreatedAt = last.get(orderField) as Timestamp | undefined;
      if (!lastCreatedAt) return { cursor: null, pageFetched: [] };

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

  async runTx<T>(fn: (tx: Transaction, db: Firestore) => Promise<T>): Promise<T> {
    return this.db.runTransaction((tx) => {
      const wrappedTx: Transaction = Object.assign(Object.create(Object.getPrototypeOf(tx)), tx, {
        set: (ref: DocumentReference, data: DocumentData, options?: SetOptions) => {
          const withTimestamps = {
            ...data,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };
          return options ? tx.set(ref, withTimestamps, options) : tx.set(ref, withTimestamps);
        },
        update: <D extends DocumentData>(ref: DocumentReference, data: UpdateData<D>) => {
          return tx.update(ref, {
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
          });
        },
      });

      return fn(wrappedTx, this.db);
    });
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">, id?: string): Promise<WithId<T>> {
    console.log("payload:", data);

    const ref = id ? this.col().doc(id) : this.col().doc();
    const payload = {
      ...(data as object),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await ref.set(payload);

    // Return client-friendly (timestamps not resolved yet)
    return this.validateData({ ...payload, id: ref.id }) as WithId<T>;
  }

  async update(id: string, patch: Partial<T>): Promise<WithId<T>> {
    const ref = this.col().doc(id);

    await ref.update({
      ...(patch as object),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { id, ...patch } as WithId<T>;
  }

  async bulkUpdate(
    items: Array<{
      id: string;
      patch: Partial<Omit<T, "createdAt" | "updatedAt">>;
    }>,
  ): Promise<{ updatedIds: string[] }> {
    const clean = (items ?? [])
      .filter((x) => x?.id)
      // de-dupe by id (last patch wins)
      .reduce((acc, cur) => {
        acc.set(cur.id, cur.patch ?? {});
        return acc;
      }, new Map<string, Partial<Omit<T, "createdAt" | "updatedAt">>>());

    if (clean.size === 0) return { updatedIds: [] };

    const entries = Array.from(clean.entries()); // [id, patch]
    const updatedIds: string[] = [];

    for (let i = 0; i < entries.length; i += 500) {
      const chunk = entries.slice(i, i + 500);

      const batch = this.db.batch();
      for (const [id, patch] of chunk) {
        batch.update(this.col().doc(id), {
          ...(patch as object),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      updatedIds.push(...chunk.map(([id]) => id));
    }

    return { updatedIds };
  }

  async set(
    id: string,
    data: Partial<Omit<T, "createdAt" | "updatedAt">>,
    opts: { merge?: boolean } = { merge: true },
  ): Promise<void> {
    const ref = this.col().doc(id);
    await ref.set(
      {
        ...(data as object),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: opts.merge ?? true },
    );
  }

  async delete(id: string): Promise<void> {
    await this.col().doc(id).delete();
  }

  async bulkDelete(ids: string[]): Promise<{ deletedIds: string[]; failedIds: string[] }> {
    // Deduplicate and remove any null/undefined/empty string IDs
    const unique = [...new Set(ids)].filter((id): id is string => typeof id === "string" && id.trim() !== "");

    if (unique.length === 0) return { deletedIds: [], failedIds: [] };

    const deletedIds: string[] = [];
    const failedIds: string[] = [];

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
      } catch (error) {
        // Track failed IDs separately instead of crashing the whole operation
        console.error(`[bulkDelete] Batch ${Math.floor(i / MAX_BATCH_SIZE) + 1} failed:`, error);
        failedIds.push(...chunk);
      }
    }

    return { deletedIds, failedIds };
  }

  async getById(id: string): Promise<T | null> {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) return null;

    return this.validateData({ id: snap.id, ...(snap.data() as T) });
  }

  async getByIds(ids: string[]): Promise<T[]> {
    if (!ids.length) return [];

    const refs = ids.map((id) => this.col().doc(id));
    const snaps = await this.db.getAll(...refs);

    return snaps.map((snap) => this.validateData({ id: snap.id, ...(snap.data() as Partial<T>) }));
  }

  // Optional: list latest docs
  async listAllWithFilters(filters: WhereFilter[] = []): Promise<T[]> {
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.col();

    for (const f of filters) {
      q = q.where(f.field, f.op, f.value);
    }

    const qs = await q.get();

    return qs.docs.map((d) => this.validateData({ id: d.id, ...(d.data() as T) }));
  }

  async getPaginated(params?: {
    page?: number;
    pageSize?: number;
    cursor?: PageCursor | null;
    filters?: WhereFilter[];
    order?: { field: string; direction: FirebaseFirestore.OrderByDirection };
  }): Promise<PaginatedResult<T>> {
    const page = params?.page ?? 1;
    const pageSize = Number(params?.pageSize ?? 10);
    const filters = params?.filters ?? [];

    // If a cursor is provided and it matches the page size, use it as the starting point
    const cursor: PageCursor | null = params?.cursor?.limit === pageSize && page > 1 ? params.cursor : null;

    if (page < 1) throw new Error("page must be >= 1");

    const delta = cursor ? page - cursor.page : null;

    // For backward jumps, flip the Firestore order so we can walk in reverse
    const isBackward = delta != null && delta < 0;
    const orderDirection: FirebaseFirestore.OrderByDirection = isBackward ? "asc" : "desc";
    const order = params?.order ?? { field: "createdAt", direction: orderDirection };

    if (order.field !== "createdAt") {
      throw new Error(`Page jump supported only for order.field="createdAt" (got "${order.field}")`);
    }

    // Build base query
    let qBase: Query<DocumentData> = this.col();
    for (const f of filters) {
      qBase = qBase.where(f.field, f.op, f.value);
    }
    qBase = qBase.orderBy(order.field, order.direction).orderBy("__name__", order.direction);

    // Re-hydrate cursor timestamps
    if (cursor) {
      cursor.lastCreatedAt = Timestamp.fromMillis(cursor.lastCreatedAt as number);
      cursor.firstCreatedAt = Timestamp.fromMillis(cursor.firstCreatedAt as number);
    }

    console.log("[getPaginated] Cursor", cursor);

    // Set default cursor
    let walkCursor: WalkCursor | null = cursor ? { createdAt: cursor.lastCreatedAt, id: cursor.lastId } : null;

    if (cursor?.page != null && delta != null) {
      if (delta === 1) {
        console.log("[getPaginated] Sequential forward — use cursor as-is", { page, delta });
        // cursor is already the last doc of the previous page — perfect
      } else if (delta > 1) {
        console.log("[getPaginated] Jump forward", { page, delta });
        walkCursor = {
          createdAt: cursor.lastCreatedAt,
          id: cursor.lastId,
        };

        const { cursor: currentCursor, pageFetched } = await this.resolveCursorForPage(
          qBase,
          page,
          pageSize,
          order.field,
          walkCursor,
          cursor.page! + 1,
        );

        walkCursor = currentCursor;
        console.log("[getPaginated] Jump forward", { pageFetched });
      } else {
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
        } else {
          // Multi-page backward: walk stepsBack - 1 extra pages from cursorFirst

          const { cursor: currentCursor, pageFetched } = await this.resolveCursorForPage(
            qBase,
            stepsBack, // walk stepsBack - 1 pages (loop is p < targetPage)
            pageSize,
            order.field,
            walkCursor,
            1,
          );

          walkCursor = currentCursor;
          console.log("[getPaginated] Jump backward", { pageFetched });
        }
      }
    } else if (!cursor && page > 1) {
      console.log("[getPaginated] No cursor, walk from scratch", { page });

      const { cursor: currentCursor, pageFetched } = await this.resolveCursorForPage(
        qBase,
        page,
        pageSize,
        order.field,
        null,
        1,
      );

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
      const doc = d.data() as T;
      return this.validateData({ id: d.id, ...doc });
    });

    const last = docs[docs.length - 1];
    const first = docs[0];
    const lastCreatedAt = last?.get(order.field) as Timestamp;
    const firstCreatedAt = first?.get(order.field) as Timestamp;

    const nextCursor: PageCursor | null =
      last && lastCreatedAt && first && firstCreatedAt
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

  async totalCount(filters: WhereFilter[] = []): Promise<number> {
    let q: Query<DocumentData> = this.col();

    for (const f of filters) {
      q = q.where(f.field, f.op, f.value);
    }

    const snap = await q.count().get();
    return snap.data().count;
  }
}
