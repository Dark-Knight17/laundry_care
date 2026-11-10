import type {
  ColourCare,
  ColourInput,
  ResolvedInstruction,
  SymbolCategory,
  WashGroup,
} from "./types.ts";
import { getColourById, getWashGroup } from "./colours.ts";
import { getSymbolById } from "./symbols.ts";

const CATEGORY_ORDER: SymbolCategory[] = [
  "wash",
  "bleach",
  "dry",
  "iron",
  "professional_care",
];

type DryingMode = "shade_inside_out" | "sun_ok" | "shade";

function getDryingMode(
  colour: ColourInput,
  group: WashGroup,
  hasPrint: boolean
): DryingMode {
  if (
    hasPrint ||
    group === "brights" ||
    group === "darks" ||
    group === "multicolour"
  ) {
    return "shade_inside_out";
  }
  if (colour.colourId === "white" || colour.colourId === "cream") {
    return "sun_ok";
  }
  return "shade";
}

export function buildColourCare(input: {
  colour: ColourInput;
  symbolIds: string[];
}): ColourCare | null {
  if (input.symbolIds.includes("wash_do_not")) {
    return null;
  }

  const group: WashGroup =
    getColourById(input.colour.colourId)?.group ?? "multicolour";
  const hasPrint = input.colour.pattern === "graphic_print";
  const dryingMode = getDryingMode(input.colour, group, hasPrint);

  const insideOutValue = group !== "lights" || hasPrint;
  let insideOutText: string;
  if (hasPrint) {
    insideOutText = "Turn it inside out before washing. This protects the print.";
  } else if (insideOutValue) {
    insideOutText =
      "Turn it inside out before washing. This protects the colour and stops fading.";
  } else {
    insideOutText = "No need to turn it inside out.";
  }

  const washGroupInfo = getWashGroup(group);
  const examples = washGroupInfo?.examples ?? [];

  let washWithText: string;
  switch (group) {
    case "lights":
      washWithText =
        "Wash it with whites and light colours. Don't wash it with dark or bright clothes.";
      break;
    case "brights":
      washWithText =
        "Wash it with other bright colours. Keep it away from whites and light colours. For the first few washes, wash it alone because new bright colours can run.";
      break;
    case "darks":
      washWithText =
        "Wash it with other dark colours. Keep it away from whites and light colours. For the first few washes, wash it alone because dark colours can run.";
      break;
    case "multicolour":
      washWithText =
        "Wash it alone or with other printed clothes. Keep it away from whites and light colours. Ankara and wax prints can run in the first few washes.";
      break;
  }

  const hasDrySymbol = input.symbolIds.some((id) => {
    const sym = getSymbolById(id);
    return sym?.category === "dry";
  });

  let drying: { text: string } | null = null;
  if (!hasDrySymbol) {
    switch (dryingMode) {
      case "sun_ok":
        drying = {
          text: "Spread it out to dry. The sun helps keep whites bright.",
        };
        break;
      case "shade":
        drying = {
          text: "Spread it out to dry in the shade, because strong sun can fade it.",
        };
        break;
      case "shade_inside_out":
        drying = {
          text: "Spread it out to dry inside out, in the shade, because strong sun makes colour fade.",
        };
        break;
    }
  }

  return {
    insideOut: {
      value: insideOutValue,
      text: insideOutText,
    },
    washWith: {
      group,
      examples,
      text: washWithText,
    },
    drying,
  };
}

export function resolveInstructions(input: {
  symbolIds: string[];
  colour?: ColourInput;
}): ResolvedInstruction[] {
  const knownSymbols = input.symbolIds
    .map((id) => getSymbolById(id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  const orderedSymbols: typeof knownSymbols = [];
  for (const cat of CATEGORY_ORDER) {
    for (const sym of knownSymbols) {
      if (sym.category === cat) {
        orderedSymbols.push(sym);
      }
    }
  }

  if (!input.colour || input.symbolIds.includes("wash_do_not")) {
    return orderedSymbols.map((sym) => ({
      symbolId: sym.id,
      category: sym.category,
      text: sym.instruction,
      adjustedForColour: false,
    }));
  }

  const group: WashGroup =
    getColourById(input.colour.colourId)?.group ?? "multicolour";
  const hasPrint = input.colour.pattern === "graphic_print";
  const coloured =
    input.colour.colourId !== "white" && input.colour.colourId !== "cream";
  const dryingMode = getDryingMode(input.colour, group, hasPrint);

  return orderedSymbols.map((sym) => {
    let text = sym.instruction;
    let adjusted = false;

    if (
      sym.id === "wash_30_normal" ||
      sym.id === "wash_40_normal" ||
      sym.id === "wash_40_gentle" ||
      sym.id === "wash_hand"
    ) {
      if (group === "brights" || group === "multicolour") {
        text = `${text} Dissolve the detergent in water before adding the clothes, so it doesn't leave patches on the colour.`;
        adjusted = true;
      } else if (group === "darks") {
        text = `${text} Dissolve the detergent in water before adding the clothes, and measure it carefully. Too much detergent leaves white marks on dark clothes.`;
        adjusted = true;
      }
    } else if (sym.id === "bleach_any") {
      if (coloured) {
        text = "Don't use bleach on this cloth. It's coloured, and bleach can remove the colour.";
        adjusted = true;
      } else if (hasPrint) {
        text = "Don't use bleach on this cloth. It has a print, and bleach can damage it.";
        adjusted = true;
      }
    } else if (
      sym.id === "dry_line" ||
      sym.id === "dry_flat" ||
      sym.id === "dry_tumble_do_not"
    ) {
      if (dryingMode === "sun_ok") {
        text = `${text} The sun helps keep whites bright.`;
        adjusted = true;
      } else if (dryingMode === "shade") {
        text = `${text} Dry it in the shade, because strong sun can fade it.`;
        adjusted = true;
      } else if (dryingMode === "shade_inside_out") {
        text = `${text} Turn it inside out and dry it in the shade, because strong sun makes colour fade.`;
        adjusted = true;
      }
    } else if (
      sym.id === "dry_tumble_normal" ||
      sym.id === "dry_tumble_low"
    ) {
      if (group !== "lights" || hasPrint) {
        text = `${text} Turn it inside out before putting it in the dryer.`;
        adjusted = true;
      }
    }

    return {
      symbolId: sym.id,
      category: sym.category,
      text,
      adjustedForColour: adjusted,
    };
  });
}
