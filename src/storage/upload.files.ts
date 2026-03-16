import { getBucket } from "../config/firebase";
import { uploadOne } from "./upload";
import type { UploadInput, UploadOptions } from "../storage/upload";

export async function uploadFiles(
  folder: string,
  files: UploadInput[] | UploadInput,
  options: UploadOptions = {},
): Promise<string[]> {
  const bucket = getBucket();
  const list = Array.isArray(files) ? files : [files];

  const uploaded: { path: string; url: string }[] = [];

  throw new Error("Not implemented");

  try {
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const res = await uploadOne(bucket, folder, f, options, i, list.length);
      uploaded.push(res);
    }
    return uploaded.map((x) => x.url);
  } catch (err) {
    await Promise.allSettled(
      uploaded.map((x) =>
        bucket
          .file(x.path)
          .delete()
          .catch(() => {}),
      ),
    );
    throw err;
  }
}
