import { getSymbolById } from "../../shared/symbols.ts";
import type { DetectedSymbol, ScanResult } from "../../shared/types.ts";
import { parseDetectedColour } from "../../shared/colourParse.ts";
import { resolveScanResult } from "./resolution.ts";

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

export function buildScanResult(rawText: string): ScanResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonString(rawText));
  } catch (parseError) {
    const error = new Error("Failed to parse model response as JSON");
    (error as any).isParseError = true;
    throw error;
  }

  let rawSymbols: unknown = [];
  let rawColour: unknown = null;

  if (Array.isArray(parsed)) {
    rawSymbols = parsed;
    rawColour = null;
  } else if (typeof parsed === "object" && parsed !== null) {
    const record = parsed as Record<string, unknown>;
    rawSymbols = record.symbols;
    rawColour = record.colour;
  }

  const detected: DetectedSymbol[] = [];
  if (Array.isArray(rawSymbols)) {
    for (const item of rawSymbols) {
      if (
        typeof item?.symbolId === "string" &&
        getSymbolById(item.symbolId) &&
        (item.confidence === "high" ||
          item.confidence === "medium" ||
          item.confidence === "low")
      ) {
        detected.push({
          symbolId: item.symbolId,
          confidence: item.confidence,
        });
      }
    }
  }

  const colour = rawColour ? parseDetectedColour(rawColour) : null;
  const baseResult = resolveScanResult(detected);

  return {
    ...baseResult,
    colour,
  };
}
