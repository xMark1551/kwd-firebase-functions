const SENSITIVE_FIELDS = ["password", "confirmPassword", "currentPassword", "newPassword", "token", "secret", "cvv"];

export function sanitizeBody(body: any): any {
  if (!body) return body;

  // If body is a Buffer (file upload)
  if (Buffer.isBuffer(body)) {
    return "[Buffer data omitted]";
  }

  // If array
  if (Array.isArray(body)) {
    return body.map((item) => sanitizeBody(item));
  }

  // If object
  if (typeof body === "object") {
    const sanitized: Record<string, any> = {};

    for (const key in body) {
      const value = body[key];

      // hide sensitive fields
      if (SENSITIVE_FIELDS.includes(key)) {
        sanitized[key] = "[REDACTED]";
        continue;
      }

      // remove buffers
      if (Buffer.isBuffer(value)) {
        sanitized[key] = "[Buffer data omitted]";
        continue;
      }

      // recurse nested objects
      sanitized[key] = sanitizeBody(value);
    }

    return sanitized;
  }

  return body;
}
