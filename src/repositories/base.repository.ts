// src/repositories/base.repository.ts
import type {
  CollectionReference,
  DocumentData,
  Firestore,
  Timestamp,
  Query,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

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
  // createdAt of the LAST item you received
  createdAt: Timestamp;
  // id of the LAST item you received (tie-breaker)
  id: string;
};

export type PaginatedResult<T> = {
  items: WithId<T>[];
  meta: {
    currentPage: number;
    pageSize: number;
  };
  nextCursor: PageCursor | null;
};

// import type { WithId, BaseDoc } from "./types";

export class FirestoreRepository<T extends BaseDoc> {
  constructor(
    protected readonly db: Firestore,
    protected readonly collectionName: string,
  ) {}

  protected col(): CollectionReference<DocumentData> {
    return this.db.collection(this.collectionName);
  }

  /**
   * ✅ Reusable transaction runner
   * - Keeps access to db + typed tx
   * - You can pass options if you want (maxAttempts)
   */
  protected runTx<T>(fn: (tx: Transaction, db: Firestore) => Promise<T>): Promise<T> {
    return this.db.runTransaction((tx) => fn(tx, this.db));
  }

  async create(data: Omit<T, "createdAt" | "updatedAt">, id?: string): Promise<WithId<T>> {
    const ref = id ? this.col().doc(id) : this.col().doc();
    const payload = {
      ...(data as object),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await ref.set(payload);

    // Return client-friendly (timestamps not resolved yet)
    return { id: ref.id, ...(data as T) };
  }

  async getById(id: string): Promise<WithId<T> | null> {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) return null;

    return { id: snap.id, ...(snap.data() as T) };
  }

  async update(id: string, patch: Partial<Omit<T, "createdAt" | "updatedAt">>): Promise<void> {
    const ref = this.col().doc(id);
    await ref.update({
      ...(patch as object),
      updatedAt: FieldValue.serverTimestamp(),
    });
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
    data: Omit<T, "createdAt" | "updatedAt">,
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

  async bulkDelete(ids: string[]): Promise<{ deletedIds: string[] }> {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return { deletedIds: [] };

    const deletedIds: string[] = [];

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
  async listLatest(limitCount = 10): Promise<WithId<T>[]> {
    const qs = await this.col().orderBy("createdAt", "desc").limit(limitCount).get();
    return qs.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
  }

  // Optional: list latest docs
  async listAllWithFilters(filters: WhereFilter[] = []): Promise<WithId<T>[]> {
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.col();

    for (const f of filters) {
      q = q.where(f.field, f.op, f.value);
    }

    const qs = await q.get();

    return qs.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
  }

  // ✅ Paginated list (cursor-based)
  async getPaginated(params?: {
    page?: number; // ✅ added
    pageSize?: number;
    cursor?: PageCursor | null;
    filters?: WhereFilter[];
    order?: { field: string; direction: FirebaseFirestore.OrderByDirection };
  }): Promise<PaginatedResult<T>> {
    const page = params?.page ?? 1; // ✅ added
    const pageSize = Number(params?.pageSize ?? 10);
    const filters = params?.filters ?? [];
    const order = params?.order ?? { field: "createdAt", direction: "desc" };

    if (page < 1) throw new Error("page must be >= 1");

    // NOTE: PageCursor shape assumes createdAt + id.
    // If you use order.field !== "createdAt", you should change PageCursor accordingly.
    if (order.field !== "createdAt") {
      throw new Error(`Page jump supported only for order.field="createdAt" (got "${order.field}")`);
    }

    // Build base query once (filters + stable ordering)
    let qBase: Query<DocumentData> = this.col();

    for (const f of filters) {
      qBase = qBase.where(f.field, f.op, f.value);
    }

    qBase = qBase.orderBy(order.field, order.direction).orderBy("__name__", order.direction);

    // Start cursor:
    // - if user provided cursor, it wins
    // - else if page>1, we will walk to compute cursor
    let cursor: PageCursor | null = params?.cursor ?? null;

    // ✅ jump pages by walking sequentially (Firestore limitation)
    if (!cursor && page > 1) {
      let walkCursor: PageCursor | null = null;

      for (let p = 1; p < page; p++) {
        let qWalk = qBase.limit(pageSize);
        if (walkCursor) qWalk = qWalk.startAfter(walkCursor.createdAt, walkCursor.id);

        const snap = await qWalk.get();
        const last = snap.docs[snap.docs.length - 1];

        // If we ran out of docs before reaching target page
        if (!last) {
          return { items: [], nextCursor: null, meta: { pageSize, currentPage: p } };
        }

        const lastCreatedAt = last.get(order.field) as Timestamp | undefined;
        if (!lastCreatedAt) {
          return { items: [], nextCursor: null, meta: { pageSize, currentPage: p } };
        }

        walkCursor = { createdAt: lastCreatedAt, id: last.id };
      }

      cursor = walkCursor; // cursor to start the requested page
    }

    // Final query for requested page
    let qFinal = qBase.limit(pageSize);
    if (cursor) qFinal = qFinal.startAfter(cursor.createdAt, cursor.id);

    const snap = await qFinal.get();

    const data = snap.docs.map((d) => {
      const doc = d.data() as T;
      const createdAt = doc.createdAt as Timestamp | undefined;

      return {
        id: d.id,
        ...doc,
        createdAt: createdAt ? createdAt.toMillis() : null, // ✅ convert for client
        updatedAt: doc.updatedAt ? (doc.updatedAt as Timestamp).toMillis() : null,
      };
    });

    const last = snap.docs[snap.docs.length - 1];
    const lastCreatedAt = last?.get(order.field) as Timestamp | undefined;

    const nextCursor: PageCursor | null = last && lastCreatedAt ? { createdAt: lastCreatedAt, id: last.id } : null;

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
