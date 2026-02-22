import type { Firestore } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";

import { INQUIRY_COLLECTION } from "../const/collection.name";
import { sendInquiryEmail } from "../utils/emailHelper";

import { deleteFile } from "../storage/deleteFile";

import type { Inquiry, CreateInquiry } from "../types/inquiry.type";

import { Timestamp } from "firebase-admin/firestore";

export class InquiryRepository extends FirestoreRepository<Inquiry> {
  constructor(db: Firestore) {
    super(db, INQUIRY_COLLECTION);
  }

  async createInquiry(payload: CreateInquiry): Promise<{ id: string }> {
    const data = { ...payload, isRead: false };
    // 4️⃣ Send email to admin
    await sendInquiryEmail({
      to: "markkings1551@yahoo.com",
      name: payload.name,
      subject: payload.reason,
      message: payload.message,
      attachmentUrl: payload.file?.url,
    });

    return this.create(data);
  }

  async toggleReadStatus(id: string): Promise<void> {
    const doc = await this.getById(id);

    if (!doc) return;

    //2. Toggle read status
    const newIsRead = !doc.isRead;

    //3. Update Firestore
    await this.update(id, { isRead: newIsRead });
  }

  async markAllAsRead(ids: string[]): Promise<void> {
    await this.bulkUpdate(ids.map((id) => ({ id, patch: { isRead: true } })));
  }

  async deleteInquiry(id: string): Promise<void> {
    const doc = (await this.getById(id)) as Inquiry;

    if (!doc) return;

    if (doc.file) {
      // Delete file from storage
      await deleteFile(doc.file.url);
    }

    await this.delete(id);
  }

  async bulkDeleteInquiries(ids: string[]): Promise<void> {
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
        const data = s.data() as Inquiry;

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

  async CurrentMonthInquiryCount(): Promise<{ count: number }> {
    // Get the start and end of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
