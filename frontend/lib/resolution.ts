import { getSymbolById } from "../../shared/symbols.ts";
import type { DetectedSymbol, ScanResult } from "../../shared/types.ts";

export function resolveSymbolsToScanResult(selectedIds: string[]): ScanResult {
  const instructions: string[] = [];
  const detected: DetectedSymbol[] = [];

  for (const id of selectedIds) {
    const symbol = getSymbolById(id);
    if (symbol) {
      instructions.push(symbol.instruction);
      detected.push({ symbolId: id, confidence: "high" });
    }
  }

  return {
    detected,
    instructions,
    lowConfidenceWarning: false,
  };
}
