import { describe, expect, test } from "bun:test";
import { CARE_SYMBOLS } from "../../shared/symbols.ts";
import { SUPPORTED_SYMBOL_IDS } from "./SymbolIcon.tsx";

describe("SymbolIcon", () => {
  test("every CARE_SYMBOL has an icon implementation", () => {
    const supportedSet = new Set<string>(SUPPORTED_SYMBOL_IDS);
    const missing: string[] = [];

    for (const symbol of CARE_SYMBOLS) {
      if (!supportedSet.has(symbol.id)) {
        missing.push(symbol.id);
      }
    }

    expect(missing).toEqual([]);
  });

  test("SUPPORTED_SYMBOL_IDS contains at least 19 symbols", () => {
    expect(SUPPORTED_SYMBOL_IDS.length).toBeGreaterThanOrEqual(19);
  });
});
