import { describe, expect, test } from "bun:test";
import { COLOURS, WASH_GROUPS } from "./colours.ts";
import type { ColourId, WashGroup } from "./types.ts";

const ALL_COLOUR_IDS: ColourId[] = [
  "white",
  "cream",
  "light_grey",
  "pastel",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "green",
  "blue",
  "navy",
  "brown",
  "grey",
  "black",
  "multicolour",
];

const VALID_GROUPS: WashGroup[] = ["lights", "brights", "darks", "multicolour"];

describe("shared/colours.ts", () => {
  test("every ColourId has exactly one COLOURS entry with a valid group, a non-empty description and a valid hex", () => {
    expect(COLOURS.length).toBe(ALL_COLOUR_IDS.length);

    for (const id of ALL_COLOUR_IDS) {
      const matches = COLOURS.filter((c) => c.id === id);
      expect(matches.length).toBe(1);
      const colour = matches[0]!;

      expect(VALID_GROUPS).toContain(colour.group);
      expect(colour.description.trim().length).toBeGreaterThan(0);
      expect(colour.description.split(/\s+/).length).toBeLessThanOrEqual(8);

      if (id === "multicolour") {
        expect(colour.hex).toBeNull();
      } else {
        expect(colour.hex).not.toBeNull();
        expect(colour.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  test("lights, brights and darks each have exactly 10 examples with valid hex values; multicolour has 6 names and no hex", () => {
    const lights = WASH_GROUPS.find((g) => g.id === "lights")!;
    const brights = WASH_GROUPS.find((g) => g.id === "brights")!;
    const darks = WASH_GROUPS.find((g) => g.id === "darks")!;
    const multicolour = WASH_GROUPS.find((g) => g.id === "multicolour")!;

    expect(lights.examples.length).toBe(10);
    for (const ex of lights.examples) {
      expect(ex.hex).toBeDefined();
      expect(ex.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }

    expect(brights.examples.length).toBe(10);
    for (const ex of brights.examples) {
      expect(ex.hex).toBeDefined();
      expect(ex.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }

    expect(darks.examples.length).toBe(10);
    for (const ex of darks.examples) {
      expect(ex.hex).toBeDefined();
      expect(ex.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }

    expect(multicolour.examples.length).toBe(6);
    for (const ex of multicolour.examples) {
      expect(ex.name.trim().length).toBeGreaterThan(0);
      expect(ex.hex).toBeUndefined();
    }
  });
});
