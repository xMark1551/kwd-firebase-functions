import type { Firestore } from "firebase-admin/firestore";
import { FirestoreRepository, WithId } from "./base.repository";
import type { WhereFilter } from "./base.repository";

import { deleteFile } from "../storage/deleteFile";

import { TRANSPARENCY_SEAL_COLLECTION, TRANSPARENCY_FOLDER } from "../const/collection.name";

import type { TransparencySeal, TransparencyFolder } from "../types/transparency.type";

export class TransparencyRepository extends FirestoreRepository<TransparencySeal> {
  constructor(db: Firestore) {
    super(db, TRANSPARENCY_SEAL_COLLECTION);
  }

  async createTransparency(payload: TransparencySeal): Promise<string> {
    const { id } = await this.create(payload);
    return id;
  }

  async createTransparencyFolder(payload: TransparencyFolder): Promise<string> {
    const ref = await this.db.collection(TRANSPARENCY_FOLDER).add(payload); // creates doc
    return ref.id; // ✅ return only id
  }

  async updateTransparency(id: string, payload: Partial<TransparencySeal>): Promise<void> {
    const docData = (await this.getById(id)) as TransparencySeal;

    // old file url
    const oldFileUrl = docData.file.url;

    // new file url
    const newFileUrl = payload.file && payload.file.url;

    delete (payload as any).createdAt;

    // if files not same get delete old file
    if (oldFileUrl !== newFileUrl) {
      await deleteFile(oldFileUrl);
    }

    await this.update(id, payload);
  }

  async updateTransparencyFolder(id: string, payload: Partial<TransparencyFolder>): Promise<void> {
    await this.db.collection(TRANSPARENCY_FOLDER).doc(id).update(payload);
  }

  async deleteTransparency(id: string): Promise<void> {
    const docData = (await this.getById(id)) as TransparencySeal;
    await this.delete(id);
    await deleteFile(docData.file.url);
  }

  async bulkDeleteTransparency(ids: string[]): Promise<void> {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return;

    // 1) Fetch docs (chunked) so we can delete old files
    const fileUrlsToDelete: string[] = [];

    for (let i = 0; i < unique.length; i += 500) {
      const chunk = unique.slice(i, i + 500);

      const refs = chunk.map((id) => this.col().doc(id));
      const snaps = await this.db.getAll(...refs);

      for (const s of snaps) {
        if (!s.exists) continue;
        const data = s.data() as TransparencySeal;

        const url = data?.file?.url; // adjust if your structure differs
        if (url) fileUrlsToDelete.push(url);
      }
    }

    // 2) Delete files (best-effort)
    // If you want strict behavior, remove try/catch and let it throw.
    await Promise.allSettled(fileUrlsToDelete.map((u) => deleteFile(u)));

    // 3) Delete docs
    await this.bulkDelete(unique);
  }

  async deleteTransparencyFolder(id: string): Promise<void> {
    const filters: any[] = [];

    // filter by folderId
    filters.push({ field: "folderId", op: "==", value: id });

    // get all transparency document in this folder
    const docData = (await this.listAllWithFilters(filters)) as TransparencySeal[];

    // delete files from Firebase Storage
    if (docData.length > 0) {
      const files = docData.map((doc) => doc.file.url).filter((url): url is string => Boolean(url)); // only keep valid strings
      if (files.length > 0) await deleteFile(files);
    }

    // get all document id in this folder
    const docIds = docData.map((doc) => doc.id);

    // delete transparency documents in this folder if exists
    if (docIds.length > 0) {
      await this.bulkDeleteTransparency(docIds);
    }

    // delete folder
    await this.db.collection(TRANSPARENCY_FOLDER).doc(id).delete();
  }

  async listTransparencyFolders(filters: WhereFilter[] = []): Promise<WithId<TransparencyFolder>[]> {
    let q: FirebaseFirestore.Query = this.db.collection(TRANSPARENCY_FOLDER);
    for (const f of filters) q = q.where(f.field, f.op, f.value);

    const snap = await q.get();
    return snap.docs.map((d) => ({ ...(d.data() as TransparencyFolder), id: d.id }));
  }
}
