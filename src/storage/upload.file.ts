import { getBucket } from "../config/firebase";
import { uploadOne } from "./upload";
import type { UploadInput, UploadOptions } from "../storage/upload";

export async function uploadFile(
  folder: string,
  file: UploadInput,
  options: UploadOptions = {},
): Promise<{ url: string; fileName: string }> {
  const bucket = getBucket();

  const uploaded = await uploadOne(bucket, folder, file, options, 0, 1);

  return {
    url: uploaded.url,
    fileName: uploaded.fileName,
  };
}
