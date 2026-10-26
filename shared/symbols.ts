import type { CareSymbol } from "./types.ts";

export const CARE_SYMBOLS: CareSymbol[] = [
  // Wash
  {
    id: "wash_30_normal",
    category: "wash",
    label: "30°C normal",
    instruction: "Machine wash at or below 30°C on normal cycle.",
    iconDescription:
      "A wash tub basin outline with a wavy water line across the top and the number '30' written in the center.",
  },
  {
    id: "wash_40_normal",
    category: "wash",
    label: "40°C normal",
    instruction: "Machine wash at or below 40°C on normal cycle.",
    iconDescription:
      "A wash tub basin outline with a wavy water line across the top and the number '40' written in the center.",
  },
  {
    id: "wash_40_gentle",
    category: "wash",
    label: "40°C gentle",
    instruction: "Machine wash at or below 40°C on gentle / mild cycle.",
    iconDescription:
      "A wash tub basin outline with a wavy water line, the number '40' in the center, and a single horizontal bar directly underneath the tub.",
  },
  {
    id: "wash_hand",
    category: "wash",
    label: "Hand wash only",
    instruction: "Hand wash only at a maximum temperature of 40°C; do not machine wash.",
    iconDescription:
      "A wash tub basin outline with a wavy water surface and an open hand reaching down into the water.",
  },
  {
    id: "wash_do_not",
    category: "wash",
    label: "Do not wash",
    instruction: "Do not wash with water.",
    iconDescription:
      "A wash tub basin outline with a wavy water line, crossed out with a large 'X'.",
  },

  // Bleach
  {
    id: "bleach_any",
    category: "bleach",
    label: "Any bleach allowed",
    instruction: "Any bleach permitted (both chlorine and non-chlorine bleach).",
    iconDescription: "A hollow equilateral triangle outline with nothing inside.",
  },
  {
    id: "bleach_non_chlorine",
    category: "bleach",
    label: "Non-chlorine bleach only",
    instruction: "Use only non-chlorine or oxygen bleach when needed; do not use chlorine bleach.",
    iconDescription:
      "An equilateral triangle outline with two parallel diagonal lines slanting upward from bottom-left toward top-right inside.",
  },
  {
    id: "bleach_do_not",
    category: "bleach",
    label: "Do not bleach",
    instruction: "Do not bleach or use chlorine-based cleaning agents.",
    iconDescription:
      "An equilateral triangle outline crossed out with a large 'X'.",
  },

  // Dry
  {
    id: "dry_tumble_normal",
    category: "dry",
    label: "Tumble dry normal",
    instruction: "Tumble dry on normal cycle with medium to high heat.",
    iconDescription:
      "A square outline containing an inscribed circle with two dots in the center.",
  },
  {
    id: "dry_tumble_low",
    category: "dry",
    label: "Tumble dry low",
    instruction: "Tumble dry on low heat.",
    iconDescription:
      "A square outline containing an inscribed circle with a single dot in the center.",
  },
  {
    id: "dry_tumble_do_not",
    category: "dry",
    label: "Do not tumble dry",
    instruction: "Do not tumble dry in a dryer.",
    iconDescription:
      "A square outline containing an inscribed circle, crossed out with a large 'X'.",
  },
  {
    id: "dry_line",
    category: "dry",
    label: "Line dry",
    instruction: "Line dry / hang to dry outdoors or on a clothesline.",
    iconDescription:
      "A square outline with a curved line drooping downward like a sagging clothesline from the top corners inside.",
  },
  {
    id: "dry_flat",
    category: "dry",
    label: "Dry flat",
    instruction: "Dry flat horizontally to preserve garment shape.",
    iconDescription:
      "A square outline containing a single horizontal straight line across the middle.",
  },

  // Iron
  {
    id: "iron_low",
    category: "iron",
    label: "Low heat",
    instruction: "Iron at a maximum soleplate temperature of 110°C (low heat); steam ironing may cause damage.",
    iconDescription:
      "An iron silhouette outline with a single dot inside the body of the iron.",
  },
  {
    id: "iron_medium",
    category: "iron",
    label: "Medium heat",
    instruction: "Iron at a maximum soleplate temperature of 150°C (medium heat).",
    iconDescription:
      "An iron silhouette outline with two dots arranged horizontally inside the body of the iron.",
  },
  {
    id: "iron_high",
    category: "iron",
    label: "High heat",
    instruction: "Iron at a maximum soleplate temperature of 200°C (high heat).",
    iconDescription:
      "An iron silhouette outline with three dots inside the body of the iron.",
  },
  {
    id: "iron_do_not",
    category: "iron",
    label: "Do not iron",
    instruction: "Do not iron or steam.",
    iconDescription:
      "An iron silhouette outline crossed out with a large 'X'.",
  },

  // Professional care
  {
    id: "dry_clean_any",
    category: "professional_care",
    label: "Dry clean any solvent",
    instruction: "Professional dry cleaning in any solvent or standard cleaning solvents.",
    iconDescription:
      "A plain circle outline with the letter 'P' or 'A' inside (or an empty circle).",
  },
  {
    id: "dry_clean_do_not",
    category: "professional_care",
    label: "Do not dry clean",
    instruction: "Do not dry clean.",
    iconDescription:
      "A circle outline crossed out with a large 'X'.",
  },
];

export function getSymbolById(id: string): CareSymbol | undefined {
  return CARE_SYMBOLS.find((symbol) => symbol.id === id);
}
