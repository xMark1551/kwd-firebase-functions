import Busboy from "busboy";
import type { RequestHandler } from "express";
import type { UploadInput } from "../storage/upload";
import { matchesAllowed } from "../utils/multiplart.helper";

type MultipartOpts = {
  maxFiles?: number;
  maxFileSizeBytes?: number;

  /**
   * Accept patterns (any mix):
   * - Exact mime: "application/pdf"
   * - Wildcard:   "image/*"
   * - Extension:  ".pdf"  ".png"
   */
  allowedTypes?: string[];

  /**
   * If true, allow when mime is unknown but extension matches allowedTypes.
   * Default true.
   */
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

    const raw = (req as any).rawBody ?? req.body;

    if (!raw || !(raw instanceof Buffer)) {
      return next({
        ok: false,
        status: 400,
        message: "Multipart body not available as Buffer (rawBody missing).",
      });
    }

    const bb = Busboy({
      headers: req.headers,
      limits: { files: maxFiles, fileSize: maxFileSizeBytes },
    });

    const fields: Record<string, any> = {};
    const files: UploadInput[] = [];

    let fileCount = 0;
    let aborted = false;
    let responded = false;

    const activeStreams: Set<NodeJS.ReadableStream> = new Set();

    const cleanup = () => {
      activeStreams.forEach((stream) => {
        if (typeof (stream as any).resume === "function") (stream as any).resume();
      });
      activeStreams.clear();
      bb.removeAllListeners();
    };

    const fail = (message: string, details?: any) => {
      if (responded || res.headersSent) return;
      responded = true;
      cleanup();
      next({
        ok: false,
        status: 400,
        message,
        details: details?.message ?? String(details ?? ""),
      });
    };

    const handleAbort = () => {
      aborted = true;
      responded = true;
      cleanup();
    };

    req.on("aborted", handleAbort);
    req.on("close", () => {
      if (!responded) handleAbort();
    });

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

      activeStreams.add(file);

      fileCount += 1;
      if (fileCount > maxFiles) {
        file.resume();
        activeStreams.delete(file);
        fail(`Too many files (max ${maxFiles})`);
        return;
      }

      const filename = info.filename || "";
      const mimeType = (info.mimeType || "").toLowerCase();

      if (!filename) {
        file.resume();
        activeStreams.delete(file);
        return;
      }

      if (allowedTypes?.length) {
        const ok = matchesAllowed(allowedTypes, mimeType, filename);

        // Some clients send application/octet-stream or empty mime
        const maybeUnknown = !mimeType || mimeType === "application/octet-stream" || mimeType === "binary/octet-stream";

        const okWithFallback =
          ok || (allowExtensionFallback && maybeUnknown && matchesAllowed(allowedTypes, "", filename));

        if (!okWithFallback) {
          file.resume();
          activeStreams.delete(file);
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
        if (responded || hitLimit || aborted) return;
        chunks.push(d);
      });

      file.on("limit", () => {
        hitLimit = true;
        file.resume();
        activeStreams.delete(file);
        fail(`File too large (>${maxFileSizeBytes} bytes)`);
      });

      file.on("error", (err) => {
        file.resume();
        activeStreams.delete(file);
        fail("File stream error", err);
      });

      file.on("end", () => {
        activeStreams.delete(file);
        if (responded || hitLimit || aborted) return;

        files.push({
          filename,
          data: Buffer.concat(chunks),
          contentType: mimeType,
        });
      });
    });

    bb.on("error", (err) => fail("Malformed multipart form data", err));

    bb.on("finish", () => {
      if (responded || aborted) {
        cleanup();
        return;
      }

      req.removeListener("aborted", handleAbort);
      bb.removeAllListeners();

      (req as any).body = fields;
      req.filesToUpload = files; // or your typed property

      next();
    });

    bb.end(raw);
  };
};
