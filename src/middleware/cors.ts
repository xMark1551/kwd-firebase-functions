import cors from "cors";

export const corsConfig = cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://us-central1-kwd-official-website.cloudfunctions.net/api",
    "https://kwdkldn.netlify.app",
    "https://kwdldn.gov.ph",
    "https://www.kwdldn.gov.ph",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
  credentials: true,
});
