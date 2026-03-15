// src/utils/firestore.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { storage as adminStorage } from "firebase-admin";
import serviceAccount from "../kwd-official-website-firebase-adminsdk-fbsvc-c8d5065761.json";
import type { ServiceAccount } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    storageBucket: process.env.STORAGE_BUCKET,
  });
}

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

export const getBucket = () => adminStorage().bucket();
