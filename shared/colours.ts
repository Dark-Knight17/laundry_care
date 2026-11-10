import type {
  ColourId,
  ColourInfo,
  WashGroup,
  WashGroupInfo,
} from "./types.ts";

export const COLOURS: ColourInfo[] = [
  {
    id: "white",
    label: "White",
    hex: "#FFFFFF",
    group: "lights",
    description: "clean white or off-white",
  },
  {
    id: "cream",
    label: "Cream",
    hex: "#F5F0DC",
    group: "lights",
    description: "warm cream ivory or vanilla",
  },
  {
    id: "light_grey",
    label: "Light grey",
    hex: "#D3D3D3",
    group: "lights",
    description: "pale silver or light grey",
  },
  {
    id: "pastel",
    label: "Pastel",
    hex: "#F4C2D0",
    group: "lights",
    description: "soft pale pastel shade",
  },
  {
    id: "yellow",
    label: "Yellow",
    hex: "#FFD60A",
    group: "brights",
    description: "bright yellow or gold",
  },
  {
    id: "orange",
    label: "Orange",
    hex: "#F77F00",
    group: "brights",
    description: "warm vibrant orange",
  },
  {
    id: "red",
    label: "Red",
    hex: "#D62828",
    group: "brights",
    description: "bright or dark red",
  },
  {
    id: "pink",
    label: "Pink",
    hex: "#FF4DA6",
    group: "brights",
    description: "light rose or hot pink",
  },
  {
    id: "purple",
    label: "Purple",
    hex: "#7B2CBF",
    group: "brights",
    description: "deep purple or violet",
  },
  {
    id: "green",
    label: "Green",
    hex: "#2DC653",
    group: "brights",
    description: "medium or bright green",
  },
  {
    id: "blue",
    label: "Blue",
    hex: "#1F4FD8",
    group: "brights",
    description: "mid blue or royal blue",
  },
  {
    id: "navy",
    label: "Navy",
    hex: "#1B2A49",
    group: "darks",
    description: "very dark navy blue",
  },
  {
    id: "brown",
    label: "Brown",
    hex: "#6B4226",
    group: "darks",
    description: "warm tan or dark brown",
  },
  {
    id: "grey",
    label: "Grey",
    hex: "#6B6B6B",
    group: "darks",
    description: "medium charcoal grey",
  },
  {
    id: "black",
    label: "Black",
    hex: "#111111",
    group: "darks",
    description: "deep black",
  },
  {
    id: "multicolour",
    label: "Multicolour",
    hex: null,
    group: "multicolour",
    description: "multiple colours or printed pattern",
  },
];

export const WASH_GROUPS: WashGroupInfo[] = [
  {
    id: "lights",
    label: "Lights",
    bleedRisk: "low",
    washAloneFirst: false,
    examples: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Ivory", hex: "#FFFFF0" },
      { name: "Cream", hex: "#F5F0DC" },
      { name: "Beige", hex: "#D9C9A8" },
      { name: "Light grey", hex: "#D3D3D3" },
      { name: "Baby pink", hex: "#F4C2D0" },
      { name: "Baby blue", hex: "#A9D1F0" },
      { name: "Mint", hex: "#BFE8D0" },
      { name: "Lavender", hex: "#D8CCF0" },
      { name: "Light yellow", hex: "#FFF3B0" },
    ],
  },
  {
    id: "brights",
    label: "Brights",
    bleedRisk: "high",
    washAloneFirst: true,
    examples: [
      { name: "Red", hex: "#D62828" },
      { name: "Orange", hex: "#F77F00" },
      { name: "Bright yellow", hex: "#FFD60A" },
      { name: "Hot pink", hex: "#FF4DA6" },
      { name: "Magenta", hex: "#C2188B" },
      { name: "Purple", hex: "#7B2CBF" },
      { name: "Royal blue", hex: "#1F4FD8" },
      { name: "Turquoise", hex: "#11B5B0" },
      { name: "Bright green", hex: "#2DC653" },
      { name: "Coral", hex: "#FF6F61" },
    ],
  },
  {
    id: "darks",
    label: "Darks",
    bleedRisk: "medium",
    washAloneFirst: true,
    examples: [
      { name: "Black", hex: "#111111" },
      { name: "Charcoal", hex: "#36454F" },
      { name: "Dark grey", hex: "#4A4A4A" },
      { name: "Navy blue", hex: "#1B2A49" },
      { name: "Dark denim", hex: "#2A3F5F" },
      { name: "Dark brown", hex: "#4B2E1E" },
      { name: "Forest green", hex: "#1E4D2B" },
      { name: "Maroon", hex: "#6D1A1A" },
      { name: "Dark purple", hex: "#3B1F5C" },
      { name: "Dark teal", hex: "#134E4A" },
    ],
  },
  {
    id: "multicolour",
    label: "Mixed colours and prints",
    bleedRisk: "high",
    washAloneFirst: true,
    examples: [
      { name: "Ankara or wax print" },
      { name: "Stripes" },
      { name: "Checks" },
      { name: "Tie-dye" },
      { name: "Flowery prints" },
      { name: "Camouflage" },
    ],
  },
];

export function getColourById(id: string): ColourInfo | undefined {
  return COLOURS.find((c) => c.id === id);
}

export function getWashGroup(id: WashGroup): WashGroupInfo | undefined {
  return WASH_GROUPS.find((g) => g.id === id);
}
