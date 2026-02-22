import * as functions from "firebase-functions";

export const errUnauth = (msg = "You must be logged in") => new functions.https.HttpsError("unauthenticated", msg);

export const errPerm = (msg = "Permission denied") => new functions.https.HttpsError("permission-denied", msg);

export const errBad = (msg = "Invalid request") => new functions.https.HttpsError("invalid-argument", msg);
