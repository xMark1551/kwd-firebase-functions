import { getBucket } from "../config/firebase";
import { uploadOne } from "./upload";
import type { UploadInput, UploadOptions } from "../storage/upload";

export async function uploadFile(
  folder: string,
  file: UploadInput,
  options: UploadOptions = {},
): Promise<{ url: string; name: string }> {
  const bucket = getBucket();

  if (!file) throw new Error("No file provided");

  const uploaded = await uploadOne(bucket, folder, file, options, 0, 1);

  return {
    url: uploaded.url,
    name: uploaded.fileName,
  };
}
