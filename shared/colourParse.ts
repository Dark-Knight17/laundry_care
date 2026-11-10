import type {
  ColourId,
  ColourInput,
  DetectedColour,
  GarmentPattern,
} from "./types.ts";
import { getColourById } from "./colours.ts";

const VALID_PATTERNS = new Set<GarmentPattern>([
  "solid",
  "patterned",
  "graphic_print",
]);

const VALID_CONFIDENCES = new Set<"high" | "medium" | "low">([
  "high",
  "medium",
  "low",
]);

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

export function parseColourInput(input: unknown): ColourInput | null {
  if (!isObject(input)) {
    return null;
  }

  const { colourId, pattern } = input;

  if (typeof colourId !== "string" || !getColourById(colourId)) {
    return null;
  }

  if (typeof pattern !== "string" || !VALID_PATTERNS.has(pattern as GarmentPattern)) {
    return null;
  }

  return {
    colourId: colourId as ColourId,
    pattern: pattern as GarmentPattern,
  };
}

export function parseDetectedColour(input: unknown): DetectedColour | null {
  const base = parseColourInput(input);
  if (!base || !isObject(input)) {
    return null;
  }

  const { confidence } = input;
  if (
    typeof confidence !== "string" ||
    !VALID_CONFIDENCES.has(confidence as "high" | "medium" | "low")
  ) {
    return null;
  }

  return {
    colourId: base.colourId,
    pattern: base.pattern,
    confidence: confidence as "high" | "medium" | "low",
  };
}
