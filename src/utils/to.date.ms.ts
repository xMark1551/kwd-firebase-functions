type FirestoreTimestampLike = { _seconds: number; _nanoseconds?: number };

const toDateMs = (raw: any): number | null => {
  if (!raw) return null;

  // Firestore Timestamp from Admin SDK is usually {seconds, nanoseconds} or a Timestamp object.
  // But when stored/plain (like in Algolia hits) you might see _seconds/_nanoseconds.
  if (typeof raw === "object") {
    if ("_seconds" in raw) {
      const t = raw as FirestoreTimestampLike;
      return t._seconds * 1000 + Math.floor((t._nanoseconds ?? 0) / 1_000_000);
    }
    if ("seconds" in raw) {
      return raw.seconds * 1000 + Math.floor((raw.nanoseconds ?? 0) / 1_000_000);
    }
    if (typeof raw.toDate === "function") {
      return raw.toDate().getTime();
    }
  }

  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
};

export default toDateMs;
