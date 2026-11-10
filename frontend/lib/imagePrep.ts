export interface ImagePreset {
  maxEdge: number;
  quality: number;
  targetBytes: number;
}

export const TAG_PRESET: ImagePreset = {
  maxEdge: 1600,
  quality: 0.85,
  targetBytes: 900_000,
};

export const GARMENT_PRESET: ImagePreset = {
  maxEdge: 1280,
  quality: 0.8,
  targetBytes: 600_000,
};

export class ImagePrepError extends Error {
  constructor(message: string = "Failed to process image") {
    super(message);
    this.name = "ImagePrepError";
  }
}

/**
 * Pure function that scales down width & height so the longest edge is at most maxEdge.
 * Keeps the aspect ratio, rounds to whole pixels, and NEVER scales up.
 */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number
): { width: number; height: number } {
  if (width <= 0 || height <= 0 || maxEdge <= 0) {
    return { width: 0, height: 0 };
  }

  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdge) {
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  const scale = maxEdge / longestEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImagePrepError("Canvas failed to export image/jpeg"));
        } else {
          resolve(blob);
        }
      },
      "image/jpeg",
      quality
    );
  });
}

function renderDrawableToCanvas(
  source: CanvasImageSource,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImagePrepError("Failed to obtain 2D canvas context");
  }
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas;
}

async function prepareFromDrawable(
  drawable: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  preset: ImagePreset
): Promise<Blob> {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new ImagePrepError("Invalid source dimensions");
  }

  // 1. Initial attempt: fitted size at preset.maxEdge and preset.quality
  const initialDims = fitWithin(sourceWidth, sourceHeight, preset.maxEdge);
  const canvas = renderDrawableToCanvas(
    drawable,
    initialDims.width,
    initialDims.height
  );
  const initialBlob = await exportCanvasToBlob(canvas, preset.quality);

  if (initialBlob.size <= preset.targetBytes) {
    return initialBlob;
  }

  let smallestBlob = initialBlob;

  // 2. Retry at quality 0.7
  const blobQ7 = await exportCanvasToBlob(canvas, 0.7);
  if (blobQ7.size < smallestBlob.size) {
    smallestBlob = blobQ7;
  }
  if (smallestBlob.size <= preset.targetBytes) {
    return smallestBlob;
  }

  // 3. Retry at quality 0.6
  const blobQ6 = await exportCanvasToBlob(canvas, 0.6);
  if (blobQ6.size < smallestBlob.size) {
    smallestBlob = blobQ6;
  }
  if (smallestBlob.size <= preset.targetBytes) {
    return smallestBlob;
  }

  // 4. Retry at 75% of maxEdge, and return the smallest result
  const scaledMaxEdge = Math.round(preset.maxEdge * 0.75);
  const scaledDims = fitWithin(sourceWidth, sourceHeight, scaledMaxEdge);
  const scaledCanvas = renderDrawableToCanvas(
    drawable,
    scaledDims.width,
    scaledDims.height
  );
  const blobScaled = await exportCanvasToBlob(scaledCanvas, 0.6);
  if (blobScaled.size < smallestBlob.size) {
    smallestBlob = blobScaled;
  }

  return smallestBlob;
}

/**
 * Prepares and shrinks an image source (Blob, HTMLCanvasElement or HTMLVideoElement)
 * according to the provided preset.
 */
export async function prepareImage(
  source: Blob | HTMLCanvasElement | HTMLVideoElement,
  preset: ImagePreset
): Promise<Blob> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new ImagePrepError("Canvas is not supported in this environment");
  }

  if (source instanceof Blob) {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(source, {
        imageOrientation: "from-image",
      });
    } catch (err) {
      throw new ImagePrepError(
        err instanceof Error ? err.message : "Failed to decode image blob"
      );
    }

    try {
      return await prepareFromDrawable(bitmap, bitmap.width, bitmap.height, preset);
    } finally {
      bitmap.close();
    }
  }

  if (typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement) {
    const width = source.videoWidth;
    const height = source.videoHeight;
    if (!width || !height) {
      throw new ImagePrepError("Video source has no dimensions");
    }
    return await prepareFromDrawable(source, width, height, preset);
  }

  if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
    const width = source.width;
    const height = source.height;
    if (!width || !height) {
      throw new ImagePrepError("Canvas source has no dimensions");
    }
    return await prepareFromDrawable(source, width, height, preset);
  }

  throw new ImagePrepError("Unsupported image source");
}

/**
 * Maps upload and capture errors to plain, friendly messages for the capture flow.
 * Never exposes status codes, error codes or file sizes to the user.
 */
export function mapScanUploadError(error: unknown): string {
  if (error instanceof ImagePrepError) {
    return "Couldn't process that photo. Please retake it.";
  }

  const errObj =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : null;
  const status =
    typeof errObj?.status === "number" ? errObj.status : undefined;
  const code =
    typeof errObj?.code === "string" ? errObj.code.toLowerCase() : undefined;
  const rawMsg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "";

  // 1. 413 or photo_too_large
  if (
    status === 413 ||
    code === "photo_too_large" ||
    rawMsg === "photo_too_large" ||
    rawMsg.includes("photo_too_large") ||
    rawMsg.includes("413")
  ) {
    return "That photo is too large to send. Please retake it.";
  }

  // 2. 400 or invalid_file
  if (
    status === 400 ||
    code === "invalid_file" ||
    rawMsg === "invalid_file" ||
    rawMsg.includes("invalid_file")
  ) {
    return "That file isn't a photo. Please retake it.";
  }

  // 3. Any other failure keeps the existing message, removing status codes, error codes or file sizes
  let sanitized = rawMsg;
  // Remove parenthesized status codes like (500) or (404)
  sanitized = sanitized.replace(/\s*\(\d{3}\)/g, "");
  // Remove phrases like "status 500", "code 500", "HTTP 500"
  sanitized = sanitized.replace(/\b(?:status|code|HTTP)\s*\d{3}\b/gi, "");
  // Remove file size patterns e.g. "10 MB", "10MB", "10485760 bytes"
  sanitized = sanitized.replace(/\b\d+(\.\d+)?\s*(?:MB|KB|bytes|B)\b/gi, "");
  sanitized = sanitized.trim();

  if (!sanitized) {
    sanitized = "Failed to scan care tag";
  }

  if (sanitized.startsWith("Scan error: ")) {
    return sanitized;
  }
  return `Scan error: ${sanitized}`;
}
