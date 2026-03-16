import dotenv from "dotenv";
dotenv.config();

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { storage as adminStorage } from "firebase-admin";
import type { ServiceAccount } from "firebase-admin/app";

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT!);

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
