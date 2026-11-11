import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { ResultsDisplay } from "./ResultsDisplay.tsx";
import type { ScanResult } from "../../shared/types.ts";

describe("ResultsDisplay Colour care section", () => {
  test("state 'ready': renders header, Inside out, Wash with, chips, and Drying for high-confidence colour", () => {
    const result: ScanResult = {
      detected: [
        { symbolId: "wash_40_normal", confidence: "high" },
        { symbolId: "bleach_do_not", confidence: "high" },
      ],
      instructions: ["Machine wash at 40°C", "Do not bleach"],
      lowConfidenceWarning: false,
      colour: {
        colourId: "blue",
        pattern: "solid",
        confidence: "high",
      },
    };

    const html = renderToString(<ResultsDisplay result={result} />);

    expect(html).toContain("Blue · Plain");
    expect(html).toContain("Change");
    expect(html).toContain("Inside out");
    expect(html).toContain("Turn it inside out before washing");
    expect(html).toContain("Wash with");
    expect(html).toContain("Wash it with other bright colours");
    expect(html).toContain("Royal blue");
    expect(html).toContain("Drying");
    expect(html).toContain("Spread it out to dry inside out, in the shade");
  });

  test("state 'ready' with dry symbol: omits Drying line", () => {
    const result: ScanResult = {
      detected: [
        { symbolId: "wash_30_normal", confidence: "high" },
        { symbolId: "dry_tumble_low", confidence: "high" },
      ],
      instructions: ["Machine wash at 30°C", "Tumble dry at low temperature"],
      lowConfidenceWarning: false,
      colour: {
        colourId: "white",
        pattern: "solid",
        confidence: "high",
      },
    };

    const html = renderToString(<ResultsDisplay result={result} />);

    expect(html).toContain("White · Plain");
    expect(html).toContain("Inside out");
    expect(html).toContain("Wash with");
    expect(html).not.toContain("colour-care-label\">Drying<");
  });

  test("state 'confirm': renders question with lowercase colour label and Yes / No buttons; no advice", () => {
    const result: ScanResult = {
      detected: [{ symbolId: "wash_30_normal", confidence: "high" }],
      instructions: ["Machine wash at 30°C"],
      lowConfidenceWarning: false,
      colour: {
        colourId: "navy",
        pattern: "solid",
        confidence: "low",
      },
    };

    const html = renderToString(<ResultsDisplay result={result} />);

    expect(html).toContain("Is this garment navy?");
    expect(html).toContain("Yes");
    expect(html).toContain("No, choose another");

    // No colour advice shown in confirm state
    expect(html).not.toContain("Inside out");
    expect(html).not.toContain("Wash with");
    expect(html).not.toContain("Drying");
  });

  test("state 'missing': renders prompt to add colour and Choose colour button", () => {
    const result: ScanResult = {
      detected: [{ symbolId: "wash_30_normal", confidence: "high" }],
      instructions: ["Machine wash at 30°C"],
      lowConfidenceWarning: false,
      colour: null,
    };

    const html = renderToString(<ResultsDisplay result={result} />);

    expect(html).toContain("Add this garment&#x27;s colour for colour care tips.");
    expect(html).toContain("Choose colour");
    expect(html).not.toContain("Inside out");
    expect(html).not.toContain("Wash with");
    expect(html).not.toContain("Is this garment");
  });

  test("state 'hidden': renders nothing for colour care when wash_do_not is present", () => {
    const result: ScanResult = {
      detected: [
        { symbolId: "wash_do_not", confidence: "high" },
        { symbolId: "professional_dryclean_p", confidence: "high" },
      ],
      instructions: ["Do not wash", "Dry clean with any solvent except trichloroethylene"],
      lowConfidenceWarning: false,
      colour: {
        colourId: "red",
        pattern: "solid",
        confidence: "high",
      },
    };

    const html = renderToString(<ResultsDisplay result={result} />);

    expect(html).not.toContain("colour-care-section");
    expect(html).not.toContain("Choose colour");
    expect(html).not.toContain("Is this garment");
    expect(html).not.toContain("Inside out");
    expect(html).not.toContain("Wash with");
    expect(html).not.toContain("Drying");
  });
});
