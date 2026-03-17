import "express";
import type { AuthedUser } from "../model/auth.model.schema";
import type { UploadInput } from "../storage/upload";

declare global {
  namespace Express {
    interface Request {
      user: AuthedUser;
      filesToUpload: UploadInput[];
      validatedQuery: any;
    }
  }
}
