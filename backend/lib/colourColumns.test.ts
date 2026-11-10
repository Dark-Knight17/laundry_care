import { describe, expect, test } from "bun:test";
import { colourToColumns, columnsToColour } from "./colourColumns.ts";
import type { DetectedColour } from "../../shared/types.ts";

describe("backend/lib/colourColumns.ts", () => {
  test("colourToColumns with null returns all null columns", () => {
    expect(colourToColumns(null)).toEqual({
      colour_id: null,
      colour_pattern: null,
      colour_confidence: null,
    });
  });

  test("columnsToColour with null/undefined row returns null", () => {
    expect(columnsToColour(null)).toBeNull();
    expect(columnsToColour(undefined)).toBeNull();
  });

  test("columnsToColour with any null/missing column returns null", () => {
    expect(
      columnsToColour({
        colour_id: "navy",
        colour_pattern: null,
        colour_confidence: "high",
      })
    ).toBeNull();
    expect(
      columnsToColour({
        colour_id: null,
        colour_pattern: "solid",
        colour_confidence: "high",
      })
    ).toBeNull();
    expect(
      columnsToColour({
        colour_id: "navy",
        colour_pattern: "solid",
        colour_confidence: null,
      })
    ).toBeNull();
    expect(columnsToColour({})).toBeNull();
  });

  test("columnsToColour with invalid column values returns null", () => {
    expect(
      columnsToColour({
        colour_id: "invalid_color",
        colour_pattern: "solid",
        colour_confidence: "high",
      })
    ).toBeNull();
    expect(
      columnsToColour({
        colour_id: "navy",
        colour_pattern: "invalid_pattern",
        colour_confidence: "high",
      })
    ).toBeNull();
    expect(
      columnsToColour({
        colour_id: "navy",
        colour_pattern: "solid",
        colour_confidence: "invalid_confidence",
      })
    ).toBeNull();
  });

  test("round trip: colourToColumns -> columnsToColour", () => {
    const original: DetectedColour = {
      colourId: "navy",
      pattern: "solid",
      confidence: "high",
    };

    const columns = colourToColumns(original);
    expect(columns).toEqual({
      colour_id: "navy",
      colour_pattern: "solid",
      colour_confidence: "high",
    });

    const parsed = columnsToColour(columns);
    expect(parsed).toEqual(original);
  });
});
