import type { CareSymbol } from "./types.ts";

export const CARE_SYMBOLS: CareSymbol[] = [
  // Wash
  {
    id: "wash_30_normal",
    category: "wash",
    label: "30°C normal",
    instruction:
      "You can wash this in a washing machine using cool water (up to 30°C) on a regular wash setting.",
    iconDescription:
      "A wash tub basin outline with a wavy water line across the top and the number '30' written in the center.",
  },
  {
    id: "wash_40_normal",
    category: "wash",
    label: "40°C normal",
    instruction:
      "Wash this in a washing machine with warm water (up to 40°C) on a regular wash setting.",
    iconDescription:
      "A wash tub basin outline with a wavy water line across the top and the number '40' written in the center.",
  },
  {
    id: "wash_40_gentle",
    category: "wash",
    label: "40°C gentle",
    instruction:
      "Wash this in a washing machine with warm water (up to 40°C), but use a soft wash setting to protect the fabric.",
    iconDescription:
      "A wash tub basin outline with a wavy water line, the number '40' in the center, and a single horizontal bar directly underneath the tub.",
  },
  {
    id: "wash_hand",
    category: "wash",
    label: "Hand wash only",
    instruction:
      "Wash this by hand in a basin or sink with lukewarm water (up to 40°C). Don't put it in a washing machine.",
    iconDescription:
      "A wash tub basin outline with a wavy water surface and an open hand reaching down into the water.",
  },
  {
    id: "wash_do_not",
    category: "wash",
    label: "Do not wash",
    instruction:
      "Don't wash this in water or put it in a washing machine at all, as it could ruin the fabric.",
    iconDescription:
      "A wash tub basin outline with a wavy water line, crossed out with a large 'X'.",
  },

  // Bleach
  {
    id: "bleach_any",
    category: "bleach",
    label: "Any bleach allowed",
    instruction:
      "You can safely use any kind of bleach on this if you need to remove stains or brighten it.",
    iconDescription: "A hollow equilateral triangle outline with nothing inside.",
  },
  {
    id: "bleach_non_chlorine",
    category: "bleach",
    label: "Non-chlorine bleach only",
    instruction:
      "Only use color-safe or non-chlorine bleach when needed. Avoid regular chlorine bleach because it can damage or discolor the fabric.",
    iconDescription:
      "An equilateral triangle outline with two parallel diagonal lines slanting upward from bottom-left toward top-right inside.",
  },
  {
    id: "bleach_do_not",
    category: "bleach",
    label: "Do not bleach",
    instruction:
      "Don't use any bleach on this, as it will damage the material or ruin the color.",
    iconDescription:
      "An equilateral triangle outline crossed out with a large 'X'.",
  },

  // Dry
  {
    id: "dry_tumble_normal",
    category: "dry",
    label: "Tumble dry normal",
    instruction:
      "You can dry this in a dryer machine (the one that spins and blows hot air to dry clothes) on a standard heat setting.",
    iconDescription:
      "A square outline containing an inscribed circle with two dots in the center.",
  },
  {
    id: "dry_tumble_low",
    category: "dry",
    label: "Tumble dry low",
    instruction:
      "You can use a dryer machine (the one that spins and blows hot air to dry clothes), but keep it on a low heat setting so it doesn't shrink or get damaged.",
    iconDescription:
      "A square outline containing an inscribed circle with a single dot in the center.",
  },
  {
    id: "dry_tumble_do_not",
    category: "dry",
    label: "Do not tumble dry",
    instruction:
      "Don't put this in a dryer machine (the one that spins and blows hot air to dry clothes). Let it dry naturally instead.",
    iconDescription:
      "A square outline containing an inscribed circle, crossed out with a large 'X'.",
  },
  {
    id: "dry_line",
    category: "dry",
    label: "Line dry",
    instruction:
      "Hang this out to dry on a clothesline, hanger, or drying rack.",
    iconDescription:
      "A square outline with a curved line drooping downward like a sagging clothesline from the top corners inside.",
  },
  {
    id: "dry_flat",
    category: "dry",
    label: "Dry flat",
    instruction:
      "Lay this flat on a towel or drying rack to dry, rather than hanging it, so it keeps its shape.",
    iconDescription:
      "A square outline containing a single horizontal straight line across the middle.",
  },

  // Iron
  {
    id: "iron_low",
    category: "iron",
    label: "Low heat",
    instruction:
      "Iron this on a low iron setting by turning your iron dial to the one-dot (•) mark. Avoid using steam as it might damage the fabric.",
    iconDescription:
      "An iron silhouette outline with a single dot inside the body of the iron.",
  },
  {
    id: "iron_medium",
    category: "iron",
    label: "Medium heat",
    instruction:
      "Iron this on a medium iron setting by turning your iron dial to the two-dot (••) mark.",
    iconDescription:
      "An iron silhouette outline with two dots arranged horizontally inside the body of the iron.",
  },
  {
    id: "iron_high",
    category: "iron",
    label: "High heat",
    instruction:
      "Iron this on a high iron setting by turning your iron dial to the three-dot (•••) mark.",
    iconDescription:
      "An iron silhouette outline with three dots inside the body of the iron.",
  },
  {
    id: "iron_do_not",
    category: "iron",
    label: "Do not iron",
    instruction:
      "Don't iron this or use steam on it, as the heat can melt or ruin the fabric.",
    iconDescription:
      "An iron silhouette outline crossed out with a large 'X'.",
  },

  // Professional care
  {
    id: "dry_clean_any",
    category: "professional_care",
    label: "Dry clean any solvent",
    instruction:
      "Take this to a dry cleaner for a chemical wash, where they can clean it using standard cleaning solvents.",
    iconDescription:
      "A plain circle outline with the letter 'P' or 'A' inside (or an empty circle).",
  },
  {
    id: "dry_clean_do_not",
    category: "professional_care",
    label: "Do not dry clean",
    instruction:
      "Don't take this to a dry cleaner for a chemical wash, as dry cleaning chemicals can ruin the garment.",
    iconDescription:
      "A circle outline crossed out with a large 'X'.",
  },
];

export function getSymbolById(id: string): CareSymbol | undefined {
  return CARE_SYMBOLS.find((symbol) => symbol.id === id);
}
