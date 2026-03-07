import type { Firestore } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";

import { TRANSPARENCY_SEAL_COLLECTION } from "../const/collection.name";

import { TransparencySeal } from "@/model/transparency.model.schema";

export class TransparencyRepository extends FirestoreRepository<TransparencySeal> {
  constructor(db: Firestore) {
    super(db, TRANSPARENCY_SEAL_COLLECTION);
  }

  async listTransparencyByFolderId(folderId: string): Promise<TransparencySeal[]> {
    if (!folderId) return [];

    const snap = await this.col().where("folderId", "==", folderId).get();
    return snap.docs.map((d) => ({ ...(d.data() as TransparencySeal), id: d.id }));
  }

  async getTransparencyCountThisYear(): Promise<{ count: number }> {
    const year = new Date().getFullYear();

    const snap = await this.col().where("year", "==", year).get();

    return { count: snap.size };
  }
}
