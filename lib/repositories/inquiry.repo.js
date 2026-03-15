"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiryRepository = void 0;
const base_repository_1 = require("./base.repository");
const collection_name_1 = require("../const/collection.name");
const firestore_1 = require("firebase-admin/firestore");
const inquiry_model_schema_1 = require("../model/inquiry.model.schema");
class InquiryRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.INQUIRY_COLLECTION, inquiry_model_schema_1.inquirySchema);
    }
    async toggleReadStatus(id) {
        const doc = await this.getById(id);
        if (!doc)
            throw new Error("Document not found");
        //2. Toggle read status
        const newIsRead = !doc.isRead;
        //3. Update Firestore
        const result = await this.update(id, { isRead: newIsRead });
        return result;
    }
    async markAllAsRead(ids) {
        const result = await this.bulkUpdate(ids.map((id) => ({ id, patch: { isRead: true } })));
        return result;
    }
    async CurrentMonthInquiryCount() {
        // Get the start and end of the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // 1st day of the month
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Last day of the month
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
