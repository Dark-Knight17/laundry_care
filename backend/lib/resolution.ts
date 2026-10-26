import { getSymbolById } from "../../shared/symbols.ts";
import type { DetectedSymbol, ScanResult } from "../../shared/types.ts";

export function resolveScanResult(detected: DetectedSymbol[]): ScanResult {
  const instructions: string[] = [];
  let lowConfidenceWarning = false;

  for (const item of detected) {
    if (item.confidence === "low") {
      lowConfidenceWarning = true;
    }

    const symbol = getSymbolById(item.symbolId);
    if (symbol) {
      instructions.push(symbol.instruction);
    }
  }

  return {
    detected,
    instructions,
    lowConfidenceWarning,
  };
}
