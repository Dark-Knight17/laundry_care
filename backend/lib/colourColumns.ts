import type { DetectedColour } from "../../shared/types.ts";
import { parseDetectedColour } from "../../shared/colourParse.ts";

export interface ColourColumns {
  colour_id: string | null;
  colour_pattern: string | null;
  colour_confidence: string | null;
}

export function colourToColumns(colour: DetectedColour | null): ColourColumns {
  if (!colour) {
    return {
      colour_id: null,
      colour_pattern: null,
      colour_confidence: null,
    };
  }

  return {
    colour_id: colour.colourId,
    colour_pattern: colour.pattern,
    colour_confidence: colour.confidence,
  };
}

export function columnsToColour(row: unknown): DetectedColour | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const { colour_id, colour_pattern, colour_confidence } = row as Record<
    string,
    unknown
  >;

  if (
    colour_id === null ||
    colour_id === undefined ||
    colour_pattern === null ||
    colour_pattern === undefined ||
    colour_confidence === null ||
    colour_confidence === undefined
  ) {
    return null;
  }

  return parseDetectedColour({
    colourId: colour_id,
    pattern: colour_pattern,
    confidence: colour_confidence,
  });
}
