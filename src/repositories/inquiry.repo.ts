import type { Firestore } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";

import { INQUIRY_COLLECTION } from "../const/collection.name";

import { Timestamp } from "firebase-admin/firestore";

import { inquirySchema, Inquiry } from "../validation/inquiry.schema";

export class InquiryRepository extends FirestoreRepository<Inquiry> {
  constructor(db: Firestore) {
    super(db, INQUIRY_COLLECTION, inquirySchema);
  }

  async toggleReadStatus(id: string) {
    const doc = await this.getById(id);

    if (!doc) throw new Error("Document not found");

    //2. Toggle read status
    const newIsRead = !doc.isRead;

    //3. Update Firestore
    const result = await this.update(id, { isRead: newIsRead });

    return result;
  }

  async markAllAsRead(ids: string[]): Promise<{ updatedIds: string[] }> {
    const result = await this.bulkUpdate(ids.map((id) => ({ id, patch: { isRead: true } })));

    return result;
  }

  async CurrentMonthInquiryCount(): Promise<{ count: number }> {
    // Get the start and end of the current month
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // 1st day of the month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Last day of the month

    // Firestore requires Timestamp objects for comparisons
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    // Filter by `date` range and unread
    const querySnapshot = await this.col()
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .get();

    return { count: querySnapshot.size };
  }

  async UnreadInquiryCount(): Promise<{ count: number; isUnread: boolean }> {
    const querySnapshot = await this.col().where("isRead", "==", false).get();
    return { count: querySnapshot.size, isUnread: querySnapshot.size > 0 };
  }
}
