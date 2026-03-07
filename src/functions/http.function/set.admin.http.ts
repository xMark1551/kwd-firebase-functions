import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const setAdmin = functions.https.onRequest(async (req, res) => {
  const SECRET = process.env.ADMIN_SECRET_KEY;

  if (req.headers.authorization !== `Bearer ${SECRET}`) {
    res.status(403).json({ error: "Unauthorized" });
    return; // ✅ just return void
  }

  const uid = req.body.uid;

  await admin.auth().setCustomUserClaims(uid, { admin: true });

  res.json({ message: "Admin set successfully!" });
  return; // ✅ return void
});
