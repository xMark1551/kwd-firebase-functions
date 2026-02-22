"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiryRepository = void 0;
const base_repository_1 = require("./base.repository");
const collection_name_1 = require("../const/collection.name");
const emailHelper_1 = require("../utils/emailHelper");
const deleteFile_1 = require("../storage/deleteFile");
const firestore_1 = require("firebase-admin/firestore");
class InquiryRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.INQUIRY_COLLECTION);
    }
    async createInquiry(payload) {
        const data = { ...payload, isRead: false };
        // 4️⃣ Send email to admin
        await (0, emailHelper_1.sendInquiryEmail)({
            to: "markkings1551@yahoo.com",
            name: payload.name,
            subject: payload.reason,
            message: payload.message,
            attachmentUrl: payload.file?.url,
        });
        return this.create(data);
    }
    async toggleReadStatus(id) {
        const doc = await this.getById(id);
        if (!doc)
            return;
        //2. Toggle read status
        const newIsRead = !doc.isRead;
        //3. Update Firestore
        await this.update(id, { isRead: newIsRead });
    }
    async markAllAsRead(ids) {
        await this.bulkUpdate(ids.map((id) => ({ id, patch: { isRead: true } })));
    }
    async deleteInquiry(id) {
        const doc = (await this.getById(id));
        if (!doc)
            return;
        if (doc.file) {
            // Delete file from storage
            await (0, deleteFile_1.deleteFile)(doc.file.url);
        }
        await this.delete(id);
    }
    async bulkDeleteInquiries(ids) {
        const unique = [...new Set(ids)].filter(Boolean);
        if (unique.length === 0)
            return;
        // 1) Fetch docs (chunked) so we can delete old files
        const fileUrlsToDelete = [];
        for (let i = 0; i < unique.length; i += 500) {
            const chunk = unique.slice(i, i + 500);
            const refs = chunk.map((id) => this.col().doc(id));
            const snaps = await this.db.getAll(...refs);
            for (const s of snaps) {
                if (!s.exists)
                    continue;
                const data = s.data();
                const url = data?.file?.url; // adjust if your structure differs
                if (url)
                    fileUrlsToDelete.push(url);
            }
        }
        // 2) Delete files (best-effort)
        // If you want strict behavior, remove try/catch and let it throw.
        await Promise.allSettled(fileUrlsToDelete.map((u) => (0, deleteFile_1.deleteFile)(u)));
        // 3) Delete docs
        await this.bulkDelete(unique);
    }
    async CurrentMonthInquiryCount() {
        // Get the start and end of the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        // Firestore requires Timestamp objects for comparisons
        const startTimestamp = firestore_1.Timestamp.fromDate(startOfMonth);
        const endTimestamp = firestore_1.Timestamp.fromDate(endOfMonth);
        // Filter by `date` range and unread
        const querySnapshot = await this.col()
            .where("createdAt", ">=", startTimestamp)
            .where("createdAt", "<=", endTimestamp)
            .get();
        return { count: querySnapshot.size };
    }
    async UnreadInquiryCount() {
        const querySnapshot = await this.col().where("isRead", "==", false).get();
        return { count: querySnapshot.size, isUnread: querySnapshot.size > 0 };
    }
}
exports.InquiryRepository = InquiryRepository;
