import type { Firestore } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";

import { INQUIRY_COLLECTION } from "../const/collection.name";

import { cleanupFiles } from "../storage/deleteFile";

import { Timestamp } from "firebase-admin/firestore";

import { inquirySchema, Inquiry } from "../model/inquiry.model.schema";

export class InquiryRepository extends FirestoreRepository<Inquiry> {
  constructor(db: Firestore) {
    super(db, INQUIRY_COLLECTION, inquirySchema);
  }

  async toggleReadStatus(id: string): Promise<void> {
    const doc = await this.getById(id);

    if (!doc) throw new Error("Document not found");

    //2. Toggle read status
    const newIsRead = !doc.isRead;

    //3. Update Firestore
    await this.update(id, { isRead: newIsRead });
  }

  async markAllAsRead(ids: string[]): Promise<void> {
    await this.bulkUpdate(ids.map((id) => ({ id, patch: { isRead: true } })));
  }

  async deleteInquiry(id: string): Promise<void> {
    const docData = (await this.getById(id)) as Inquiry;

    if (!docData) throw new Error("Document not found");

    if (docData.file) await cleanupFiles(docData.file.url);

    await this.delete(id);
  }

  async bulkDeleteInquiries(ids: string[]): Promise<void> {
    // read all docs to get file urls
    const docData = await this.getByIds(ids);

    // collect only valid file URLs
    const files = docData.map((doc) => doc.file?.url).filter((url): url is string => Boolean(url)); // only keep valid strings
    cleanupFiles(files);

    // delete files from Firebase Storage
    await this.bulkDelete(ids);
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
