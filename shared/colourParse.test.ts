import { describe, expect, test } from "bun:test";
import { parseColourInput, parseDetectedColour } from "./colourParse.ts";

describe("shared/colourParse.ts", () => {
  describe("parseColourInput", () => {
    test("valid input returns ColourInput", () => {
      expect(parseColourInput({ colourId: "navy", pattern: "solid" })).toEqual({
        colourId: "navy",
        pattern: "solid",
      });
      expect(parseColourInput({ colourId: "white", pattern: "graphic_print" })).toEqual({
        colourId: "white",
        pattern: "graphic_print",
      });
      expect(parseColourInput({ colourId: "multicolour", pattern: "patterned" })).toEqual({
        colourId: "multicolour",
        pattern: "patterned",
      });
    });

    test("unknown colour id returns null", () => {
      expect(parseColourInput({ colourId: "neon_green", pattern: "solid" })).toBeNull();
      expect(parseColourInput({ colourId: "", pattern: "solid" })).toBeNull();
      expect(parseColourInput({ colourId: "WHITE", pattern: "solid" })).toBeNull();
    });

    test("unknown pattern returns null", () => {
      expect(parseColourInput({ colourId: "navy", pattern: "striped" })).toBeNull();
      expect(parseColourInput({ colourId: "navy", pattern: "dotted" })).toBeNull();
    });

    test("missing fields return null", () => {
      expect(parseColourInput({ colourId: "navy" })).toBeNull();
      expect(parseColourInput({ pattern: "solid" })).toBeNull();
      expect(parseColourInput({})).toBeNull();
    });

    test("wrong types return null", () => {
      expect(parseColourInput({ colourId: 123, pattern: "solid" })).toBeNull();
      expect(parseColourInput({ colourId: "navy", pattern: true })).toBeNull();
      expect(parseColourInput("navy")).toBeNull();
      expect(parseColourInput(123)).toBeNull();
      expect(parseColourInput([])).toBeNull();
      expect(parseColourInput(true)).toBeNull();
    });

    test("null and undefined return null", () => {
      expect(parseColourInput(null)).toBeNull();
      expect(parseColourInput(undefined)).toBeNull();
    });
  });

  describe("parseDetectedColour", () => {
    test("valid input returns DetectedColour", () => {
      expect(
        parseDetectedColour({
          colourId: "black",
          pattern: "solid",
          confidence: "high",
        })
      ).toEqual({
        colourId: "black",
        pattern: "solid",
        confidence: "high",
      });
      expect(
        parseDetectedColour({
          colourId: "pastel",
          pattern: "patterned",
          confidence: "medium",
        })
      ).toEqual({
        colourId: "pastel",
        pattern: "patterned",
        confidence: "medium",
      });
      expect(
        parseDetectedColour({
          colourId: "cream",
          pattern: "graphic_print",
          confidence: "low",
        })
      ).toEqual({
        colourId: "cream",
        pattern: "graphic_print",
        confidence: "low",
      });
    });

    test("unknown colour id returns null", () => {
      expect(
        parseDetectedColour({
          colourId: "magenta_ultra",
          pattern: "solid",
          confidence: "high",
        })
      ).toBeNull();
    });

    test("unknown pattern returns null", () => {
      expect(
        parseDetectedColour({
          colourId: "black",
          pattern: "stripes",
          confidence: "high",
        })
      ).toBeNull();
    });

    test("unknown confidence returns null", () => {
      expect(
        parseDetectedColour({
          colourId: "black",
          pattern: "solid",
          confidence: "very_high",
        })
      ).toBeNull();
      expect(
        parseDetectedColour({
          colourId: "black",
          pattern: "solid",
          confidence: "unknown",
        })
      ).toBeNull();
    });

    test("missing fields return null", () => {
      expect(parseDetectedColour({ colourId: "black", pattern: "solid" })).toBeNull();
      expect(parseDetectedColour({ colourId: "black", confidence: "high" })).toBeNull();
      expect(parseDetectedColour({ pattern: "solid", confidence: "high" })).toBeNull();
      expect(parseDetectedColour({})).toBeNull();
    });

    test("wrong types return null", () => {
      expect(
        parseDetectedColour({
          colourId: "black",
          pattern: "solid",
          confidence: 100,
        })
      ).toBeNull();
      expect(parseDetectedColour("black")).toBeNull();
      expect(parseDetectedColour(42)).toBeNull();
      expect(parseDetectedColour(["black", "solid", "high"])).toBeNull();
    });

    test("null and undefined return null", () => {
      expect(parseDetectedColour(null)).toBeNull();
      expect(parseDetectedColour(undefined)).toBeNull();
    });
  });
});
