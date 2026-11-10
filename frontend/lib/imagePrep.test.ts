import { describe, expect, test } from "bun:test";
import {
  fitWithin,
  TAG_PRESET,
  GARMENT_PRESET,
  ImagePrepError,
  mapScanUploadError,
  prepareImage,
} from "./imagePrep.ts";

describe("fitWithin", () => {
  test("landscape image larger than maxEdge scales down keeping aspect ratio", () => {
    // 2400x1200 with maxEdge 1600 -> 1600x800
    const result = fitWithin(2400, 1200, 1600);
    expect(result).toEqual({ width: 1600, height: 800 });
    expect(result.width).toBeLessThanOrEqual(1600);
    expect(result.height).toBeLessThanOrEqual(1600);
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
    expect(result.width / result.height).toBe(2400 / 1200);
  });

  test("portrait image larger than maxEdge scales down keeping aspect ratio", () => {
    // 1080x1920 with maxEdge 1280 -> 720x1280
    const result = fitWithin(1080, 1920, 1280);
    expect(result).toEqual({ width: 720, height: 1280 });
    expect(result.width).toBeLessThanOrEqual(1280);
    expect(result.height).toBeLessThanOrEqual(1280);
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
    expect(result.width / result.height).toBeCloseTo(1080 / 1920, 5);
  });

  test("image already smaller than maxEdge is unchanged and never upscaled", () => {
    const landscape = fitWithin(800, 600, 1280);
    expect(landscape).toEqual({ width: 800, height: 600 });

    const portrait = fitWithin(600, 800, 1600);
    expect(portrait).toEqual({ width: 600, height: 800 });

    const exact = fitWithin(1600, 900, 1600);
    expect(exact).toEqual({ width: 1600, height: 900 });
  });

  test("square image larger than maxEdge scales down to maxEdge square", () => {
    const largeSquare = fitWithin(2048, 2048, 1280);
    expect(largeSquare).toEqual({ width: 1280, height: 1280 });

    const smallSquare = fitWithin(500, 500, 1280);
    expect(smallSquare).toEqual({ width: 500, height: 500 });
  });

  test("odd sizes produce whole numbers and preserve aspect ratio within one pixel", () => {
    const oddCases = [
      { w: 1921, h: 1083, max: 1600 },
      { w: 1083, h: 1921, max: 1280 },
      { w: 3001, h: 1999, max: 1600 },
      { w: 1337, h: 777, max: 1000 },
      { w: 777, h: 1337, max: 1000 },
      { w: 4032, h: 3024, max: 1280 }, // typical mobile 12MP photo
      { w: 3024, h: 4032, max: 1600 }, // mobile portrait
    ];

    for (const { w, h, max } of oddCases) {
      const result = fitWithin(w, h, max);

      // Whole numbers
      expect(Number.isInteger(result.width)).toBe(true);
      expect(Number.isInteger(result.height)).toBe(true);

      // Never exceeds maxEdge
      expect(result.width).toBeLessThanOrEqual(max);
      expect(result.height).toBeLessThanOrEqual(max);

      // Check ideal aspect-ratio scale
      const longest = Math.max(w, h);
      const scale = longest > max ? max / longest : 1;
      const idealW = w * scale;
      const idealH = h * scale;

      expect(Math.abs(result.width - idealW)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(result.height - idealH)).toBeLessThanOrEqual(0.5);
    }
  });

  test("handles zero and negative dimensions safely", () => {
    expect(fitWithin(0, 100, 1600)).toEqual({ width: 0, height: 0 });
    expect(fitWithin(100, 0, 1600)).toEqual({ width: 0, height: 0 });
    expect(fitWithin(100, 100, 0)).toEqual({ width: 0, height: 0 });
  });
});

describe("Presets & Error definitions", () => {
  test("TAG_PRESET and GARMENT_PRESET match required constants", () => {
    expect(TAG_PRESET).toEqual({
      maxEdge: 1600,
      quality: 0.85,
      targetBytes: 900_000,
    });
    expect(GARMENT_PRESET).toEqual({
      maxEdge: 1280,
      quality: 0.8,
      targetBytes: 600_000,
    });
  });

  test("ImagePrepError is an Error with name ImagePrepError", () => {
    const err = new ImagePrepError("Canvas export failed");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ImagePrepError");
    expect(err.message).toBe("Canvas export failed");
  });
});

describe("mapScanUploadError", () => {
  test("maps 413 or photo_too_large to friendly message without status or codes", () => {
    expect(mapScanUploadError({ status: 413 })).toBe(
      "That photo is too large to send. Please retake it."
    );
    expect(mapScanUploadError({ code: "photo_too_large" })).toBe(
      "That photo is too large to send. Please retake it."
    );
    expect(mapScanUploadError(new Error("photo_too_large"))).toBe(
      "That photo is too large to send. Please retake it."
    );
    expect(mapScanUploadError(new Error("Request failed with 413 photo_too_large"))).toBe(
      "That photo is too large to send. Please retake it."
    );
  });

  test("maps 400 or invalid_file to friendly message", () => {
    expect(mapScanUploadError({ status: 400 })).toBe(
      "That file isn't a photo. Please retake it."
    );
    expect(mapScanUploadError({ code: "invalid_file" })).toBe(
      "That file isn't a photo. Please retake it."
    );
    expect(mapScanUploadError(new Error("invalid_file"))).toBe(
      "That file isn't a photo. Please retake it."
    );
  });

  test("maps ImagePrepError to friendly message", () => {
    expect(mapScanUploadError(new ImagePrepError("Corrupted bitmap"))).toBe(
      "Couldn't process that photo. Please retake it."
    );
  });

  test("keeps other failure messages without exposing status codes, error codes or file sizes", () => {
    expect(mapScanUploadError(new Error("Failed to scan care tag"))).toBe(
      "Scan error: Failed to scan care tag"
    );
    // Strips status code (500)
    expect(mapScanUploadError(new Error("Server error (500)"))).toBe(
      "Scan error: Server error"
    );
    // Strips file size
    expect(mapScanUploadError(new Error("File exceeded 10 MB limit"))).toBe(
      "Scan error: File exceeded  limit"
    );
  });
});

describe("prepareImage retry progression", () => {
  test("mock canvas retries when image exceeds targetBytes", async () => {
    let callCount = 0;
    const qualities: number[] = [];
    const sizes: number[] = [1_200_000, 1_000_000, 800_000]; // 1st > target, 2nd > target, 3rd <= target

    // Set up mock window / document / canvas environment
    const originalDocument = (globalThis as any).document;
    const originalWindow = (globalThis as any).window;

    try {
      (globalThis as any).window = {};
      (globalThis as any).document = {
        createElement: (tag: string) => {
          if (tag === "canvas") {
            return {
              width: 0,
              height: 0,
              getContext: () => ({
                drawImage: () => {},
              }),
              toBlob: (cb: (b: Blob | null) => void, _type: string, quality: number) => {
                qualities.push(quality);
                const size = sizes[callCount] ?? 500_000;
                callCount++;
                const fakeBlob = new Blob([new Uint8Array(size)], { type: "image/jpeg" });
                cb(fakeBlob);
              },
            };
          }
          return {};
        },
      };

      const fakeCanvas = {
        width: 2400,
        height: 1600,
      } as any;

      // Mock canvas instanceof check
      (globalThis as any).HTMLCanvasElement = function () {};
      Object.setPrototypeOf(fakeCanvas, (globalThis as any).HTMLCanvasElement.prototype);

      const result = await prepareImage(fakeCanvas, TAG_PRESET);
      // TAG_PRESET targetBytes is 900_000. 3rd attempt was 800_000.
      expect(result.size).toBe(800_000);
      // First attempt at 0.85, 2nd at 0.7, 3rd at 0.6
      expect(qualities).toEqual([0.85, 0.7, 0.6]);
    } finally {
      (globalThis as any).document = originalDocument;
      (globalThis as any).window = originalWindow;
      delete (globalThis as any).HTMLCanvasElement;
    }
  });
});
