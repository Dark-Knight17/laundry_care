import { describe, expect, test } from "bun:test";
import { buildScanResult } from "./buildScanResult.ts";

describe("backend/lib/buildScanResult.ts", () => {
  test("symbols plus colour", () => {
    const raw = JSON.stringify({
      symbols: [
        { symbolId: "wash_30_normal", confidence: "high" },
        { symbolId: "bleach_do_not", confidence: "low" },
      ],
      colour: {
        colourId: "navy",
        pattern: "solid",
        confidence: "high",
      },
    });

    const result = buildScanResult(raw);
    expect(result.detected).toEqual([
      { symbolId: "wash_30_normal", confidence: "high" },
      { symbolId: "bleach_do_not", confidence: "low" },
    ]);
    expect(result.instructions.length).toBe(2);
    expect(result.lowConfidenceWarning).toBe(true);
    expect(result.colour).toEqual({
      colourId: "navy",
      pattern: "solid",
      confidence: "high",
    });
  });

  test("JSON inside code fences", () => {
    const json = JSON.stringify({
      symbols: [{ symbolId: "wash_40_normal", confidence: "high" }],
      colour: {
        colourId: "red",
        pattern: "graphic_print",
        confidence: "medium",
      },
    });

    const fenced = `\`\`\`json\n${json}\n\`\`\``;
    const result = buildScanResult(fenced);
    expect(result.detected).toEqual([
      { symbolId: "wash_40_normal", confidence: "high" },
    ]);
    expect(result.colour).toEqual({
      colourId: "red",
      pattern: "graphic_print",
      confidence: "medium",
    });
  });

  test("unknown symbol id dropped", () => {
    const raw = JSON.stringify({
      symbols: [
        { symbolId: "wash_30_normal", confidence: "high" },
        { symbolId: "unknown_fictional_symbol", confidence: "high" },
      ],
      colour: null,
    });

    const result = buildScanResult(raw);
    expect(result.detected).toEqual([
      { symbolId: "wash_30_normal", confidence: "high" },
    ]);
    expect(result.colour).toBeNull();
  });

  test("invalid colour id gives colour null with symbols kept", () => {
    const raw = JSON.stringify({
      symbols: [{ symbolId: "wash_30_normal", confidence: "high" }],
      colour: {
        colourId: "neon_chartreuse",
        pattern: "solid",
        confidence: "high",
      },
    });

    const result = buildScanResult(raw);
    expect(result.detected).toEqual([
      { symbolId: "wash_30_normal", confidence: "high" },
    ]);
    expect(result.colour).toBeNull();
  });

  test("colour missing gives null", () => {
    const raw = JSON.stringify({
      symbols: [{ symbolId: "wash_30_normal", confidence: "high" }],
    });

    const result = buildScanResult(raw);
    expect(result.detected).toEqual([
      { symbolId: "wash_30_normal", confidence: "high" },
    ]);
    expect(result.colour).toBeNull();
  });

  test("legacy array format gives colour null", () => {
    const raw = JSON.stringify([
      { symbolId: "wash_30_normal", confidence: "high" },
    ]);

    const result = buildScanResult(raw);
    expect(result.detected).toEqual([
      { symbolId: "wash_30_normal", confidence: "high" },
    ]);
    expect(result.colour).toBeNull();
  });

  test("garbled colour object gives null", () => {
    const raw = JSON.stringify({
      symbols: [{ symbolId: "wash_30_normal", confidence: "high" }],
      colour: {
        garbageKey: 42,
        nested: [1, 2, 3],
      },
    });

    const result = buildScanResult(raw);
    expect(result.detected).toEqual([
      { symbolId: "wash_30_normal", confidence: "high" },
    ]);
    expect(result.colour).toBeNull();
  });

  test("malformed JSON behaves as before (throws with isParseError)", () => {
    const raw = "not a valid json { broken";
    expect(() => buildScanResult(raw)).toThrow();
    try {
      buildScanResult(raw);
    } catch (err: any) {
      expect(err.isParseError).toBe(true);
      expect(err.message).toBe("Failed to parse model response as JSON");
    }
  });
});
