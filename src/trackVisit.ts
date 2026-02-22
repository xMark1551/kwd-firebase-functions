// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import cors from "cors";

const db = admin.firestore();

const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "https://your-production-domain.com", // Replace with your real domain
];

const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
});

export const trackVisit = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const ip = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress;

      if (!ip) {
        return res.status(400).send({ error: "IP address not found" });
      }

      // Get start and end of today
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      // Query if this IP was already recorded today
      const existing = await db
        .collection("visitors")
        .where("ip", "==", ip)
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
        .where("timestamp", "<", admin.firestore.Timestamp.fromDate(endOfDay))
        .get();

      if (!existing.empty) {
        return res.status(200).send({ success: true, message: "Already recorded today" });
      }

      // Record new visit
      await db.collection("visitors").add({
        ip,
        timestamp: admin.firestore.Timestamp.now(),
      });

      res.status(200).send({ success: true, message: "Visit recorded" });
    } catch (error: any) {
      console.error("Error tracking visit:", error);
      res.status(500).send({ error: error.message });
    }
  });
});
