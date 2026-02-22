"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("firebase-admin/firestore");
const post_repository_1 = require("../repositories/post.repository");
// mock helper modules used inside repository
const transaction_helper_1 = require("../utils/transaction.helper");
const date_converter_1 = require("../utils/date.converter");
jest.mock("../utils/transaction.helper", () => ({
    updateCounter: jest.fn(),
}));
jest.mock("../utils/date.converter", () => ({
    getMonthKey: jest.fn(),
}));
jest.mock("../storage/deleteFile", () => ({
    deleteFile: jest.fn(),
}));
function makeSnap(exists, dataObj) {
    return { exists, data: () => dataObj };
}
function makeDb() {
    return {
        collection: jest.fn((name) => ({
            doc: jest.fn((id) => ({ id, path: `${name}/${id}` })),
        })),
    };
}
describe("NewsRepository.patchWithCounters", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        date_converter_1.getMonthKey.mockReturnValue("2026-02");
        jest.spyOn(firestore_1.FieldValue, "serverTimestamp").mockReturnValue("SERVER_TIME");
    });
    test("throws if post not found", async () => {
        const db = {}; // not used directly
        const repo = new post_repository_1.NewsRepository(db);
        const tx = { get: jest.fn(), update: jest.fn() };
        const fakeDb = makeDb();
        // tx.get(postRef) -> not exists
        tx.get.mockResolvedValueOnce(makeSnap(false, null));
        // stub runTx to inject tx/db
        repo.runTx = jest.fn(async (fn) => fn(tx, fakeDb));
        repo.cleanupFiles = jest.fn(); // avoid actual cleanup
        await expect(repo.patchWithCounters("p1", { status: "Published" })).rejects.toThrow("Post with id p1 not found");
        expect(tx.update).not.toHaveBeenCalled();
        expect(transaction_helper_1.updateCounter).not.toHaveBeenCalled();
    });
    test("Draft → Published, category NOT changed: archive +1 and oldCategory +1", async () => {
        const db = {};
        const repo = new post_repository_1.NewsRepository(db);
        const tx = { get: jest.fn(), update: jest.fn() };
        const fakeDb = makeDb();
        const post = {
            status: "Draft",
            category: "Sports",
            createdAt: Date.now(),
            files: [],
        };
        // Call order in patchWithCounters:
        // 1) tx.get(postRef)
        // then Promise.all -> oldCategoryRef, newCategoryRef, archiveRef
        tx.get
            .mockResolvedValueOnce(makeSnap(true, post)) // postSnap
            .mockResolvedValueOnce(makeSnap(true, { totalPosts: 10 })) // oldCategorySnap
            .mockResolvedValueOnce(makeSnap(true, { totalPosts: 10 })) // newCategorySnap
            .mockResolvedValueOnce(makeSnap(true, { totalPosts: 3 })); // archiveSnap
        repo.runTx = jest.fn(async (fn) => fn(tx, fakeDb));
        repo.cleanupFiles = jest.fn();
        await repo.patchWithCounters("p1", { status: "Published" });
        // main update
        expect(tx.update).toHaveBeenCalledTimes(1);
        const [postRef, updatePayload] = tx.update.mock.calls[0];
        expect(postRef.path).toBe("news_and_updates/p1"); // <-- update to your actual NEWS_AND_UPDATES_COLLECTION value
        expect(updatePayload.status).toBe("Published");
        expect(updatePayload.updatedAt).toBe("SERVER_TIME");
        // counters
        expect(transaction_helper_1.updateCounter).toHaveBeenCalledTimes(2);
        // 1) archive +1
        const call1 = transaction_helper_1.updateCounter.mock.calls[0];
        expect(call1[1].path).toBe("news_archives/2026-02"); // <-- update to your NEWS_ARCHIVES_COLLECTION value
        expect(call1[2]).toBe(1);
        expect(call1[4]).toEqual({ month: "2026-02" });
        // 2) oldCategory +1
        const call2 = transaction_helper_1.updateCounter.mock.calls[1];
        expect(call2[1].path).toBe("news_total_count/Sports"); // <-- update to your NEWS_TOTAL_COUNT_COLLECTION value
        expect(call2[2]).toBe(1);
        expect(call2[4]).toEqual({ category: "Sports" });
    });
    test("Published → Published, category changed: old -1 and new +1 (no archive update)", async () => {
        const db = {};
        const repo = new post_repository_1.NewsRepository(db);
        const tx = { get: jest.fn(), update: jest.fn() };
        const fakeDb = makeDb();
        const post = {
            status: "Published",
            category: "Sports",
            createdAt: Date.now(),
            files: [],
        };
        tx.get
            .mockResolvedValueOnce(makeSnap(true, post)) // postSnap
            .mockResolvedValueOnce(makeSnap(true, { totalPosts: 10 })) // oldCategorySnap
            .mockResolvedValueOnce(makeSnap(true, { totalPosts: 1 })) // newCategorySnap
            .mockResolvedValueOnce(makeSnap(true, { totalPosts: 3 })); // archiveSnap
        repo.runTx = jest.fn(async (fn) => fn(tx, fakeDb));
        repo.cleanupFiles = jest.fn();
        await repo.patchWithCounters("p1", { category: "Tech" });
        expect(transaction_helper_1.updateCounter).toHaveBeenCalledTimes(2);
        const c1 = transaction_helper_1.updateCounter.mock.calls[0];
        expect(c1[1].path).toBe("news_total_count/Sports"); // old
        expect(c1[2]).toBe(-1);
        const c2 = transaction_helper_1.updateCounter.mock.calls[1];
        expect(c2[1].path).toBe("news_total_count/Tech"); // new
        expect(c2[2]).toBe(1);
    });
});
