import { getBucket } from "../config/firebase";

export async function deleteFile(imageRefs: string[] | string = []): Promise<void> {
  const bucket = getBucket();
  const arr = Array.isArray(imageRefs) ? imageRefs : [imageRefs];

  const toObjectPath = (value: string): string | null => {
    if (value.startsWith("gs://")) {
      const without = value.replace("gs://", "");
      const slash = without.indexOf("/");
      return slash >= 0 ? without.slice(slash + 1) : null;
    }

    if (value.includes("/o/")) {
      try {
        const encoded = value.split("/o/")[1]?.split("?")[0];
        if (!encoded) return null;
        return decodeURIComponent(encoded);
      } catch {
        return null;
      }
    }

    if (value.includes("storage.googleapis.com/")) {
      const parts = value.split("storage.googleapis.com/")[1];
      if (!parts) return null;
      const firstSlash = parts.indexOf("/");
      return firstSlash >= 0 ? decodeURI(parts.slice(firstSlash + 1)) : null;
    }

    return value.trim() || null;
  };

  await Promise.allSettled(
    arr
      .filter((v) => typeof v === "string" && v.trim())
      .map(async (v) => {
        const objPath = toObjectPath(v);
        if (!objPath) return;
        await bucket.file(objPath).delete({ ignoreNotFound: true });
      }),
  );
}
