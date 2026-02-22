import * as functions from "firebase-functions/v2";
import fetch from "node-fetch";

// Define your environment parameter
const RECAPTCHA_SECRET = functions.params.defineString("RECAPTCHA_SECRET");

export const verifyRecaptcha2 = functions.https.onCall(async (data) => {
  console.log("Received token:", data.data.token);
  const token = data.data.token;

  // Access secret using .value()
  const secret = RECAPTCHA_SECRET.value();

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${secret}&response=${token}`,
  });

  const result = await response.json();
  return result; // { success: true/false, score, etc. }
});
