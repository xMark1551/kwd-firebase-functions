import "express";
import type { AuthedUser } from "../middleware/auth";
import type { UploadInput } from "../config/storage";

declare global {
  namespace Express {
    interface Request {
      user: AuthedUser;
      filesToUpload: UploadInput[];
      validatedQuery: any;
    }
  }
}
