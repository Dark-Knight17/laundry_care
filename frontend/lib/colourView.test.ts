import { describe, expect, test } from "bun:test";
import type { DetectedColour } from "../../shared/types.ts";
import { colourViewState, confirmedColour } from "./colourView.ts";

describe("confirmedColour", () => {
  test("returns undefined when colour is null or undefined", () => {
    expect(confirmedColour(null)).toBeUndefined();
    expect(confirmedColour(undefined)).toBeUndefined();
  });

  test("returns undefined when confidence is low", () => {
    const colour: DetectedColour = {
      colourId: "navy",
      pattern: "solid",
      confidence: "low",
    };
    expect(confirmedColour(colour)).toBeUndefined();
  });

  test("returns ColourInput when confidence is medium", () => {
    const colour: DetectedColour = {
      colourId: "red",
      pattern: "patterned",
      confidence: "medium",
    };
    expect(confirmedColour(colour)).toEqual({
      colourId: "red",
      pattern: "patterned",
    });
  });

  test("returns ColourInput when confidence is high", () => {
    const colour: DetectedColour = {
      colourId: "black",
      pattern: "graphic_print",
      confidence: "high",
    };
    expect(confirmedColour(colour)).toEqual({
      colourId: "black",
      pattern: "graphic_print",
    });
  });
});

describe("colourViewState", () => {
  const lowColour: DetectedColour = {
    colourId: "blue",
    pattern: "solid",
    confidence: "low",
  };
  const mediumColour: DetectedColour = {
    colourId: "green",
    pattern: "patterned",
    confidence: "medium",
  };
  const highColour: DetectedColour = {
    colourId: "white",
    pattern: "solid",
    confidence: "high",
  };

  describe("do-not-wash (wash_do_not) with each colour state", () => {
    const doNotWash = ["wash_do_not", "bleach_do_not"];

    test("returns 'hidden' when colour is null", () => {
      expect(colourViewState({ symbolIds: doNotWash, colour: null })).toBe(
        "hidden"
      );
    });

    test("returns 'hidden' when colour is undefined", () => {
      expect(colourViewState({ symbolIds: doNotWash, colour: undefined })).toBe(
        "hidden"
      );
    });

    test("returns 'hidden' when colour has low confidence", () => {
      expect(colourViewState({ symbolIds: doNotWash, colour: lowColour })).toBe(
        "hidden"
      );
    });

    test("returns 'hidden' when colour has medium confidence", () => {
      expect(
        colourViewState({ symbolIds: doNotWash, colour: mediumColour })
      ).toBe("hidden");
    });

    test("returns 'hidden' when colour has high confidence", () => {
      expect(colourViewState({ symbolIds: doNotWash, colour: highColour })).toBe(
        "hidden"
      );
    });
  });

  describe("without do-not-wash", () => {
    const normalSymbols = ["wash_30_normal", "bleach_do_not", "dry_line"];

    test("returns 'missing' when colour is null", () => {
      expect(
        colourViewState({ symbolIds: normalSymbols, colour: null })
      ).toBe("missing");
    });

    test("returns 'missing' when colour is undefined", () => {
      expect(
        colourViewState({ symbolIds: normalSymbols, colour: undefined })
      ).toBe("missing");
    });

    test("returns 'confirm' when colour confidence is low", () => {
      expect(
        colourViewState({ symbolIds: normalSymbols, colour: lowColour })
      ).toBe("confirm");
    });

    test("returns 'ready' when colour confidence is medium", () => {
      expect(
        colourViewState({ symbolIds: normalSymbols, colour: mediumColour })
      ).toBe("ready");
    });

    test("returns 'ready' when colour confidence is high", () => {
      expect(
        colourViewState({ symbolIds: normalSymbols, colour: highColour })
      ).toBe("ready");
    });
  });
});
