import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { COLOURS } from "./colours.ts";
import { buildColourCare, resolveInstructions } from "./colourCare.ts";
import { CARE_SYMBOLS, getSymbolById } from "./symbols.ts";
import type { ColourId, GarmentPattern } from "./types.ts";

const ALL_COLOUR_IDS: ColourId[] = COLOURS.map((c) => c.id);
const ALL_PATTERNS: GarmentPattern[] = ["solid", "patterned", "graphic_print"];

const WASH_SYMBOLS = [
  null,
  "wash_30_normal",
  "wash_40_normal",
  "wash_40_gentle",
  "wash_hand",
  "wash_do_not",
];

const BLEACH_SYMBOLS = [
  null,
  "bleach_any",
  "bleach_non_chlorine",
  "bleach_do_not",
];

const DRY_SYMBOLS = [
  null,
  "dry_tumble_normal",
  "dry_tumble_low",
  "dry_tumble_do_not",
  "dry_line",
  "dry_flat",
];

describe("shared/colourCare.ts - specific cases", () => {
  test("black solid + wash_30_normal -> wash row has the darks sentence appended", () => {
    const rows = resolveInstructions({
      symbolIds: ["wash_30_normal"],
      colour: { colourId: "black", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(true);
    expect(rows[0]?.text).toContain(
      "Dissolve the detergent in water before adding the clothes, and measure it carefully. Too much detergent leaves white marks on dark clothes."
    );
  });

  test("white solid + wash_30_normal -> unchanged", () => {
    const base = getSymbolById("wash_30_normal")!.instruction;
    const rows = resolveInstructions({
      symbolIds: ["wash_30_normal"],
      colour: { colourId: "white", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(false);
    expect(rows[0]?.text).toBe(base);
  });

  test("red + bleach_any -> row text is exactly the coloured replacement and adjustedForColour true", () => {
    const rows = resolveInstructions({
      symbolIds: ["bleach_any"],
      colour: { colourId: "red", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(true);
    expect(rows[0]?.text).toBe(
      "Don't use bleach on this cloth. It's coloured, and bleach can remove the colour."
    );
  });

  test("white solid + bleach_any -> base text", () => {
    const base = getSymbolById("bleach_any")!.instruction;
    const rows = resolveInstructions({
      symbolIds: ["bleach_any"],
      colour: { colourId: "white", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(false);
    expect(rows[0]?.text).toBe(base);
  });

  test("white graphic_print + bleach_any -> the print replacement", () => {
    const rows = resolveInstructions({
      symbolIds: ["bleach_any"],
      colour: { colourId: "white", pattern: "graphic_print" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(true);
    expect(rows[0]?.text).toBe(
      "Don't use bleach on this cloth. It has a print, and bleach can damage it."
    );
  });

  test("pastel + bleach_any -> the coloured replacement", () => {
    const rows = resolveInstructions({
      symbolIds: ["bleach_any"],
      colour: { colourId: "pastel", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(true);
    expect(rows[0]?.text).toBe(
      "Don't use bleach on this cloth. It's coloured, and bleach can remove the colour."
    );
  });

  test("any colour + wash_do_not -> buildColourCare returns null and all rows are unchanged", () => {
    for (const colourId of ALL_COLOUR_IDS) {
      const care = buildColourCare({
        symbolIds: ["wash_do_not", "bleach_any", "dry_flat"],
        colour: { colourId, pattern: "solid" },
      });
      expect(care).toBeNull();

      const rows = resolveInstructions({
        symbolIds: ["wash_do_not", "bleach_any", "dry_flat"],
        colour: { colourId, pattern: "solid" },
      });
      for (const row of rows) {
        expect(row.adjustedForColour).toBe(false);
        const base = getSymbolById(row.symbolId)!.instruction;
        expect(row.text).toBe(base);
      }
    }
  });

  test("navy + dry_flat -> the shade_inside_out suffix", () => {
    const rows = resolveInstructions({
      symbolIds: ["dry_flat"],
      colour: { colourId: "navy", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(true);
    expect(rows[0]?.text).toContain(
      "Turn it inside out and dry it in the shade, because strong sun makes colour fade."
    );
  });

  test("white + dry_line -> the sun_ok suffix", () => {
    const rows = resolveInstructions({
      symbolIds: ["dry_line"],
      colour: { colourId: "white", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(true);
    expect(rows[0]?.text).toContain("The sun helps keep whites bright.");
  });

  test("pastel + dry_line -> the shade suffix", () => {
    const rows = resolveInstructions({
      symbolIds: ["dry_line"],
      colour: { colourId: "pastel", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.adjustedForColour).toBe(true);
    expect(rows[0]?.text).toContain(
      "Dry it in the shade, because strong sun can fade it."
    );
  });

  test("any colour + dry_tumble_normal -> never contains sun or shade", () => {
    for (const colourId of ALL_COLOUR_IDS) {
      for (const pattern of ALL_PATTERNS) {
        const rows = resolveInstructions({
          symbolIds: ["dry_tumble_normal"],
          colour: { colourId, pattern },
        });
        expect(rows[0]?.text.toLowerCase()).not.toContain("sun");
        expect(rows[0]?.text.toLowerCase()).not.toContain("shade");
      }
    }
  });

  test("black + dry_tumble_low -> inside-out-in-the-dryer sentence", () => {
    const rows = resolveInstructions({
      symbolIds: ["dry_tumble_low"],
      colour: { colourId: "black", pattern: "solid" },
    });
    expect(rows[0]?.adjustedForColour).toBe(true);
    expect(rows[0]?.text).toContain(
      "Turn it inside out before putting it in the dryer."
    );
  });

  test("white solid + dry_tumble_low -> unchanged", () => {
    const base = getSymbolById("dry_tumble_low")!.instruction;
    const rows = resolveInstructions({
      symbolIds: ["dry_tumble_low"],
      colour: { colourId: "white", pattern: "solid" },
    });
    expect(rows[0]?.adjustedForColour).toBe(false);
    expect(rows[0]?.text).toBe(base);
  });

  test("drying is null when a dry symbol is present and non-null when none is present", () => {
    const withDry = buildColourCare({
      symbolIds: ["wash_30_normal", "dry_line"],
      colour: { colourId: "blue", pattern: "solid" },
    });
    expect(withDry?.drying).toBeNull();

    const withoutDry = buildColourCare({
      symbolIds: ["wash_30_normal"],
      colour: { colourId: "blue", pattern: "solid" },
    });
    expect(withoutDry?.drying).not.toBeNull();
  });

  test("multicolour -> washWith text mentions Ankara", () => {
    const care = buildColourCare({
      symbolIds: ["wash_30_normal"],
      colour: { colourId: "multicolour", pattern: "patterned" },
    });
    expect(care?.washWith.text).toContain("Ankara and wax prints");
  });

  test("rows come out ordered by category", () => {
    const rows = resolveInstructions({
      symbolIds: [
        "dry_clean_any",
        "dry_flat",
        "wash_30_normal",
        "iron_low",
        "bleach_any",
      ],
      colour: { colourId: "green", pattern: "solid" },
    });
    expect(rows.map((r) => r.category)).toEqual([
      "wash",
      "bleach",
      "dry",
      "iron",
      "professional_care",
    ]);
  });

  test("unknown symbol ids are skipped", () => {
    const rows = resolveInstructions({
      symbolIds: ["non_existent_1", "wash_30_normal", "non_existent_2"],
      colour: { colourId: "white", pattern: "solid" },
    });
    expect(rows.length).toBe(1);
    expect(rows[0]?.symbolId).toBe("wash_30_normal");
  });
});

describe("shared/colourCare.ts - Consistency matrix test", () => {
  test("assert all rules (a) through (g) across entire matrix", () => {
    for (const colourId of ALL_COLOUR_IDS) {
      for (const pattern of ALL_PATTERNS) {
        const isColoured = colourId !== "white" && colourId !== "cream";
        const hasPrint = pattern === "graphic_print";

        for (const washSym of WASH_SYMBOLS) {
          for (const bleachSym of BLEACH_SYMBOLS) {
            for (const drySym of DRY_SYMBOLS) {
              const symbolIds: string[] = [];
              if (washSym) symbolIds.push(washSym);
              if (bleachSym) symbolIds.push(bleachSym);
              if (drySym) symbolIds.push(drySym);

              const colour = { colourId, pattern };
              const care = buildColourCare({ colour, symbolIds });
              const rows = resolveInstructions({ symbolIds, colour });

              // Combine all text for checking contradictions
              const allTextParts: string[] = rows.map((r) => r.text);
              if (care) {
                allTextParts.push(care.insideOut.text);
                allTextParts.push(care.washWith.text);
                if (care.drying) {
                  allTextParts.push(care.drying.text);
                }
              }
              const combinedText = allTextParts.join(" ");

              // (a) if wash_do_not is present, colour care is null and no row is adjusted
              if (symbolIds.includes("wash_do_not")) {
                expect(care).toBeNull();
                for (const row of rows) {
                  expect(row.adjustedForColour).toBe(false);
                }
              }

              // (b) no combined output contains both "You can use bleach" and "Don't use bleach"
              const hasCanBleach = combinedText.includes("You can use bleach");
              const hasDontBleach = combinedText.includes("Don't use bleach");
              expect(hasCanBleach && hasDontBleach).toBe(false);

              // (c) when bleach_any is present and the colour is coloured or pattern is graphic_print,
              // the bleach row starts with "Don't use bleach"
              if (bleachSym === "bleach_any" && !symbolIds.includes("wash_do_not")) {
                const bleachRow = rows.find((r) => r.symbolId === "bleach_any");
                if (isColoured || hasPrint) {
                  expect(bleachRow?.text.startsWith("Don't use bleach")).toBe(true);
                }
              }

              // (d) no combined output contains both "The sun helps" and "in the shade"
              const hasSunHelps = combinedText.includes("The sun helps");
              const hasInShade = combinedText.includes("in the shade");
              expect(hasSunHelps && hasInShade).toBe(false);

              // (e) a tumble-dry-allowed symbol never produces text containing "sun" or "shade"
              if (drySym === "dry_tumble_normal" || drySym === "dry_tumble_low") {
                const tumbleRow = rows.find((r) => r.symbolId === drySym);
                expect(tumbleRow?.text.toLowerCase()).not.toContain("sun");
                expect(tumbleRow?.text.toLowerCase()).not.toContain("shade");
              }

              // (f) drying is null exactly when a dry symbol is present
              const hasDrySymbol = drySym !== null;
              if (symbolIds.includes("wash_do_not")) {
                expect(care).toBeNull();
              } else {
                expect(care?.drying === null).toBe(hasDrySymbol);
              }

              // (g) every unadjusted row equals its symbol's base instruction
              for (const row of rows) {
                if (!row.adjustedForColour) {
                  const base = getSymbolById(row.symbolId)!.instruction;
                  expect(row.text).toBe(base);
                }
              }
            }
          }
        }
      }
    }
  });
});

describe("shared/colourCare.ts - Brand-name test", () => {
  const FORBIDDEN_BRANDS = [
    "hypo",
    "jik",
    "omo",
    "ariel",
    "sunlight",
    "viva",
    "klin",
    "canoe",
  ];

  test("no forbidden brand names in shared/colours.ts, shared/colourCare.ts or the 7 edited symbols", () => {
    const coloursFile = fs.readFileSync(
      path.resolve(import.meta.dir, "colours.ts"),
      "utf-8"
    );
    const colourCareFile = fs.readFileSync(
      path.resolve(import.meta.dir, "colourCare.ts"),
      "utf-8"
    );

    const editedSymbolIds = [
      "wash_30_normal",
      "wash_40_normal",
      "wash_40_gentle",
      "wash_hand",
      "bleach_any",
      "bleach_non_chlorine",
      "bleach_do_not",
    ];

    const editedInstructions = editedSymbolIds
      .map((id) => getSymbolById(id)!.instruction)
      .join(" ");

    const allContent = `${coloursFile} ${colourCareFile} ${editedInstructions}`.toLowerCase();

    for (const brand of FORBIDDEN_BRANDS) {
      const regex = new RegExp(`\\b${brand}\\b`, "i");
      expect(regex.test(allContent)).toBe(false);
    }
  });
});
