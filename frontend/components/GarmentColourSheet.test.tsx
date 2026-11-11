import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { GarmentColourSheet, MULTICOLOUR_GRADIENT, PATTERNS } from "./GarmentColourSheet.tsx";
import { COLOURS } from "../../shared/colours.ts";

describe("GarmentColourSheet component", () => {
  test("renders sheet with all 16 colours, patterns, cancel and apply buttons", () => {
    const html = renderToString(
      <GarmentColourSheet
        open={true}
        initialColour={{ colourId: "blue", pattern: "solid", confidence: "high" }}
        onApply={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toContain("Garment colour");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="garment-colour-sheet-title"');

    // All 16 colours present
    for (const colour of COLOURS) {
      expect(html).toContain(colour.label);
      expect(html).toContain(`value="${colour.id}"`);
    }

    // Gradient on multicolour
    expect(html).toContain(MULTICOLOUR_GRADIENT);

    // All 3 patterns
    for (const pattern of PATTERNS) {
      expect(html).toContain(pattern.label);
      expect(html).toContain(`value="${pattern.id}"`);
    }

    // Action buttons
    expect(html).toContain("Cancel");
    expect(html).toContain("Apply");
  });

  test("disables Apply button when no initial colour is selected", () => {
    const html = renderToString(
      <GarmentColourSheet
        open={true}
        initialColour={null}
        onApply={() => {}}
        onClose={() => {}}
      />
    );

    // Apply button has disabled attribute
    expect(html).toContain('disabled="" class="bottom-sheet-btn bottom-sheet-btn-apply"');
  });

  test("does not render when open is false", () => {
    const html = renderToString(
      <GarmentColourSheet
        open={false}
        initialColour={null}
        onApply={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toBe("");
  });
});
