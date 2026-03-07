import Busboy from "busboy";
import type { RequestHandler } from "express";
import type { UploadInput } from "../storage/upload";
import { matchesAllowed } from "../utils/multiplart.helper";

type MultipartOpts = {
  maxFiles?: number;
  maxFileSizeBytes?: number;
  allowedTypes?: string[];
  allowExtensionFallback?: boolean;
};

export const multipartBusboy = (opts?: MultipartOpts): RequestHandler => {
  const maxFiles = opts?.maxFiles ?? 10;
  const maxFileSizeBytes = opts?.maxFileSizeBytes ?? 10 * 1024 * 1024;
  const allowedTypes = opts?.allowedTypes;
  const allowExtensionFallback = opts?.allowExtensionFallback ?? true;

  return (req, res, next) => {
    const ct = String(req.headers["content-type"] ?? "");
    if (!ct.includes("multipart/form-data")) return next();

    const bb = Busboy({
      headers: req.headers,
      limits: { files: maxFiles, fileSize: maxFileSizeBytes },
    });

    const fields: Record<string, any> = {};
    const files: UploadInput[] = [];

    let fileCount = 0;
    let responded = false;

    const fail = (message: string, details?: any) => {
      if (responded || res.headersSent) return;
      responded = true;
      bb.removeAllListeners();
      next({
        ok: false,
        status: 400,
        message,
        details: details?.message ?? String(details ?? ""),
      });
    };

    const arrayFields = new Set(["files"]);

    bb.on("field", (name, val) => {
      if (responded) return;
      if (arrayFields.has(name)) {
        const prev = fields[name];
        fields[name] = prev ? (Array.isArray(prev) ? [...prev, val] : [prev, val]) : [val];
      } else {
        fields[name] = val;
      }
    });

    bb.on("file", (_fieldname, file, info) => {
      if (responded) {
        file.resume();
        return;
      }

      fileCount += 1;
      if (fileCount > maxFiles) {
        file.resume();
        fail(`Too many files (max ${maxFiles})`);
        return;
      }

      const filename = info.filename || "";
      const mimeType = (info.mimeType || "").toLowerCase();

      if (!filename) {
        file.resume();
        return;
      }

      if (allowedTypes?.length) {
        const maybeUnknown = !mimeType || mimeType === "application/octet-stream" || mimeType === "binary/octet-stream";
        const ok = matchesAllowed(allowedTypes, mimeType, filename);
        const okWithFallback =
          ok || (allowExtensionFallback && maybeUnknown && matchesAllowed(allowedTypes, "", filename));

        if (!okWithFallback) {
          file.resume();
          fail(
            `Unsupported file type`,
            `got mime="${mimeType || "unknown"}" filename="${filename}" allowed=${allowedTypes.join(", ")}`,
          );
          return;
        }
      }

      const chunks: Buffer[] = [];
      let hitLimit = false;

      file.on("data", (d: Buffer) => {
        if (responded || hitLimit) return;
        chunks.push(d);
      });

      file.on("limit", () => {
        hitLimit = true;
        file.resume();
        fail(`File too large (>${maxFileSizeBytes} bytes)`);
      });

      file.on("error", (err) => {
        file.resume();
        fail("File stream error", err);
      });

      file.on("end", () => {
        if (responded || hitLimit) return;
        files.push({ filename, data: Buffer.concat(chunks), contentType: mimeType });
      });
    });

    bb.on("error", (err) => fail("Malformed multipart form data", err));

    bb.on("finish", () => {
      if (responded) return;
      bb.removeAllListeners();
      (req as any).body = fields;
      req.filesToUpload = files;
      next();
    });

    // ✅ KEY FIX: write + end separately instead of bb.end(raw)
    const raw = (req as any).rawBody;
    if (raw instanceof Buffer) {
      bb.write(raw);
      bb.end();
    } else {
      // Fallback: pipe directly from request stream
      req.pipe(bb);
    }
  };
};
