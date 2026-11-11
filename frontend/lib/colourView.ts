import type { ColourInput, DetectedColour } from "../../shared/types.ts";

export type ColourViewState = "hidden" | "missing" | "confirm" | "ready";

/**
 * Returns the colour input (colourId and pattern) only when confidence is "high" or "medium".
 * Otherwise returns undefined.
 */
export function confirmedColour(
  colour?: DetectedColour | null
): ColourInput | undefined {
  if (!colour) return undefined;
  if (colour.confidence === "high" || colour.confidence === "medium") {
    return {
      colourId: colour.colourId,
      pattern: colour.pattern,
    };
  }
  return undefined;
}

/**
 * Derives the colour care view state from the current colour and symbol IDs:
 * - "hidden" when symbolIds includes "wash_do_not"
 * - "missing" when colour is null/undefined
 * - "confirm" when colour confidence is "low"
 * - "ready" otherwise (confidence is "high" or "medium")
 */
export function colourViewState(input: {
  colour?: DetectedColour | null;
  symbolIds: string[];
}): ColourViewState {
  if (input.symbolIds.includes("wash_do_not")) {
    return "hidden";
  }
  if (!input.colour) {
    return "missing";
  }
  if (input.colour.confidence === "low") {
    return "confirm";
  }
  return "ready";
}
