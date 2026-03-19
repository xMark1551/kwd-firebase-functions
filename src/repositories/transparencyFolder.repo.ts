import type { Firestore } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";

import { TRANSPARENCY_SEAL_FOLDER } from "../const/collection.name";

import { TransparencyFolder } from "../validation/transparency.schema";

export class TransparencyFolderRepository extends FirestoreRepository<TransparencyFolder> {
  constructor(db: Firestore) {
    super(db, TRANSPARENCY_SEAL_FOLDER);
  }
}
