/**
 * Strips status codes, raw error codes, and file sizes from error messages
 * so users are never exposed to technical diagnostics.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return "";

  // If the message is a raw snake_case identifier like "photo_too_large" or "server_error"
  if (/^[a-z0-9_]+$/i.test(message.trim()) && message.includes("_")) {
    return "Server error";
  }

  let sanitized = message;
  // Remove parenthesized status codes e.g. "(500)", "(404)"
  sanitized = sanitized.replace(/\s*\(\d{3}\)/g, "");
  // Remove phrases like "status 500", "code 500", "HTTP 500", "HTTP 503"
  sanitized = sanitized.replace(/\b(?:status|code|HTTP)\s*\d{3}\b/gi, "");
  // Remove standalone status code e.g. "Server error 500" -> "Server error"
  sanitized = sanitized.replace(/\b(?:error|status|code)\s+\d{3}\b/gi, "error");
  // Remove file size patterns e.g. "10 MB", "10MB", "10485760 bytes", "500 KB"
  sanitized = sanitized.replace(/\b\d+(\.\d+)?\s*(?:MB|KB|bytes|B)\b/gi, "");
  // Collapse duplicate whitespace and trim
  sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

  return sanitized || "Server error";
}

/**
 * Maps upload responses from POST /scan and POST /scans to plain, user-friendly messages.
 * Never shows status codes, error codes, or file sizes.
 */
export function uploadErrorMessage(
  status: number,
  body?: unknown,
  existingMessage?: string
): string {
  // 1. Try to parse JSON body if provided as a string or object
  let parsed: Record<string, unknown> | null = null;
  if (body && typeof body === "object") {
    parsed = body as Record<string, unknown>;
  } else if (typeof body === "string") {
    try {
      const result = JSON.parse(body);
      if (result && typeof result === "object") {
        parsed = result as Record<string, unknown>;
      }
    } catch {
      // Non-JSON body
    }
  }

  // 2. When the response body is JSON with a "message" string and an "error" code
  // of "photo_too_large" or "invalid_file", show that message.
  if (parsed) {
    const error = typeof parsed.error === "string" ? parsed.error : undefined;
    const message =
      typeof parsed.message === "string" ? parsed.message.trim() : undefined;

    if (
      (error === "photo_too_large" || error === "invalid_file") &&
      message
    ) {
      return message;
    }
  }

  // 3. Otherwise, when the status is 413, show "That photo is too large to send. Please retake it."
  if (status === 413) {
    return "That photo is too large to send. Please retake it.";
  }

  // 4. Otherwise, when the status is 400, show "That file isn't a photo. Please retake it."
  if (status === 400) {
    return "That file isn't a photo. Please retake it.";
  }

  // 5. Any other failure keeps the existing message (sanitized of codes and sizes)
  let candidate = existingMessage || "";
  if (!candidate && parsed && typeof parsed.message === "string" && parsed.message.trim()) {
    candidate = parsed.message.trim();
  } else if (!candidate && typeof body === "string" && !body.includes("<") && body.trim()) {
    candidate = body.trim();
  }

  if (!candidate) {
    candidate = "Server error";
  }

  return sanitizeErrorMessage(candidate);
}

/**
 * Checks whether a response body has a photo_too_large or invalid_file error code.
 */
export function hasUploadErrorCode(body: unknown): boolean {
  if (!body) return false;
  if (typeof body === "object") {
    const code = (body as Record<string, unknown>).error;
    return code === "photo_too_large" || code === "invalid_file";
  }
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object") {
        return (
          parsed.error === "photo_too_large" || parsed.error === "invalid_file"
        );
      }
    } catch {
      // Non-JSON
    }
  }
  return false;
}
