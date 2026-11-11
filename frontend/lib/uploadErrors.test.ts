import { describe, expect, test } from "bun:test";
import {
  hasUploadErrorCode,
  sanitizeErrorMessage,
  uploadErrorMessage,
} from "./uploadErrors.ts";

describe("uploadErrorMessage", () => {
  describe("the two JSON codes", () => {
    test("shows message when body is JSON with error 'photo_too_large'", () => {
      const body = {
        error: "photo_too_large",
        message: "That photo is too large to process. Please retake it.",
      };
      expect(uploadErrorMessage(413, body)).toBe(
        "That photo is too large to process. Please retake it."
      );
      // Even if status were something else
      expect(uploadErrorMessage(500, body)).toBe(
        "That photo is too large to process. Please retake it."
      );
    });

    test("shows message when body is JSON with error 'invalid_file'", () => {
      const body = {
        error: "invalid_file",
        message: "That file isn't a photo. Please retake it.",
      };
      expect(uploadErrorMessage(400, body)).toBe(
        "That file isn't a photo. Please retake it."
      );
    });

    test("handles JSON string containing the error codes", () => {
      const jsonString = JSON.stringify({
        error: "photo_too_large",
        message: "Photo exceeds size limit from server.",
      });
      expect(uploadErrorMessage(413, jsonString)).toBe(
        "Photo exceeds size limit from server."
      );
    });
  });

  describe("a bare 413", () => {
    test("returns 'That photo is too large to send. Please retake it.' when status is 413 without body", () => {
      expect(uploadErrorMessage(413)).toBe(
        "That photo is too large to send. Please retake it."
      );
      expect(uploadErrorMessage(413, undefined)).toBe(
        "That photo is too large to send. Please retake it."
      );
      expect(uploadErrorMessage(413, null)).toBe(
        "That photo is too large to send. Please retake it."
      );
      expect(uploadErrorMessage(413, "")).toBe(
        "That photo is too large to send. Please retake it."
      );
    });

    test("returns 'That photo is too large to send. Please retake it.' when status is 413 with unrelated JSON", () => {
      expect(uploadErrorMessage(413, { error: "payload_too_large" })).toBe(
        "That photo is too large to send. Please retake it."
      );
    });
  });

  describe("a bare 400", () => {
    test("returns 'That file isn't a photo. Please retake it.' when status is 400 without body", () => {
      expect(uploadErrorMessage(400)).toBe(
        "That file isn't a photo. Please retake it."
      );
      expect(uploadErrorMessage(400, undefined)).toBe(
        "That file isn't a photo. Please retake it."
      );
      expect(uploadErrorMessage(400, null)).toBe(
        "That file isn't a photo. Please retake it."
      );
      expect(uploadErrorMessage(400, "")).toBe(
        "That file isn't a photo. Please retake it."
      );
    });

    test("returns 'That file isn't a photo. Please retake it.' when status is 400 with unrelated JSON", () => {
      expect(uploadErrorMessage(400, { error: "bad_request" })).toBe(
        "That file isn't a photo. Please retake it."
      );
    });
  });

  describe("an unknown status", () => {
    test("keeps existing message or returns sanitized server error on 500", () => {
      expect(uploadErrorMessage(500)).toBe("Server error");
      expect(uploadErrorMessage(503)).toBe("Server error");
      expect(uploadErrorMessage(404)).toBe("Server error");
    });

    test("never shows status codes in candidate messages", () => {
      expect(uploadErrorMessage(500, undefined, "Server error (500)")).toBe(
        "Server error"
      );
      expect(uploadErrorMessage(503, undefined, "HTTP 503 Service Unavailable")).toBe(
        "Service Unavailable"
      );
    });

    test("never shows error codes in candidate messages", () => {
      expect(uploadErrorMessage(500, { error: "internal_server_error" })).toBe(
        "Server error"
      );
    });

    test("preserves plain custom message without status codes", () => {
      expect(
        uploadErrorMessage(500, { message: "Database connection failed" })
      ).toBe("Database connection failed");
      expect(
        uploadErrorMessage(500, undefined, "Connection timed out")
      ).toBe("Connection timed out");
    });
  });

  describe("a non-JSON body", () => {
    test("returns 413 message when non-JSON body accompanies 413", () => {
      expect(
        uploadErrorMessage(413, "<html>413 Request Entity Too Large</html>")
      ).toBe("That photo is too large to send. Please retake it.");
    });

    test("returns 400 message when non-JSON body accompanies 400", () => {
      expect(uploadErrorMessage(400, "Bad Request")).toBe(
        "That file isn't a photo. Please retake it."
      );
    });

    test("returns sanitized message when non-JSON body accompanies unknown status", () => {
      expect(
        uploadErrorMessage(502, "<html>502 Bad Gateway</html>")
      ).toBe("Server error");
      expect(
        uploadErrorMessage(500, "File size 12 MB exceeds 10 MB limit")
      ).toBe("File size exceeds limit");
    });
  });
});

describe("sanitizeErrorMessage", () => {
  test("removes parenthesized status codes", () => {
    expect(sanitizeErrorMessage("Server error (500)")).toBe("Server error");
    expect(sanitizeErrorMessage("Not found (404)")).toBe("Not found");
  });

  test("removes HTTP phrases", () => {
    expect(sanitizeErrorMessage("HTTP 500 Internal Error")).toBe(
      "Internal Error"
    );
    expect(sanitizeErrorMessage("status 503 service unavailable")).toBe(
      "service unavailable"
    );
  });

  test("removes file sizes", () => {
    expect(sanitizeErrorMessage("Exceeded 10 MB limit")).toBe(
      "Exceeded limit"
    );
    expect(sanitizeErrorMessage("Image of 10485760 bytes is too large")).toBe(
      "Image of is too large"
    );
  });

  test("converts snake_case error codes to 'Server error'", () => {
    expect(sanitizeErrorMessage("model_unavailable")).toBe("Server error");
    expect(sanitizeErrorMessage("rate_limit_exceeded")).toBe("Server error");
  });
});

describe("hasUploadErrorCode", () => {
  test("identifies photo_too_large and invalid_file in objects and strings", () => {
    expect(hasUploadErrorCode({ error: "photo_too_large" })).toBe(true);
    expect(hasUploadErrorCode({ error: "invalid_file" })).toBe(true);
    expect(
      hasUploadErrorCode(JSON.stringify({ error: "photo_too_large" }))
    ).toBe(true);
    expect(hasUploadErrorCode({ error: "other_error" })).toBe(false);
    expect(hasUploadErrorCode(null)).toBe(false);
    expect(hasUploadErrorCode("plain text")).toBe(false);
  });
});
