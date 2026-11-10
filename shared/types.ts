export type SymbolCategory =
  | "wash"
  | "bleach"
  | "dry"
  | "iron"
  | "professional_care";

export interface CareSymbol {
  id: string;
  category: SymbolCategory;
  label: string;
  instruction: string;
  iconDescription: string;
}

export interface DetectedSymbol {
  symbolId: string;
  confidence: "high" | "medium" | "low";
}

export interface ScanResult {
  detected: DetectedSymbol[];
  instructions: string[];
  lowConfidenceWarning: boolean;
}

export type ColourId =
  | "white"
  | "cream"
  | "light_grey"
  | "pastel"
  | "yellow"
  | "orange"
  | "red"
  | "pink"
  | "purple"
  | "green"
  | "blue"
  | "navy"
  | "brown"
  | "grey"
  | "black"
  | "multicolour";

export type GarmentPattern = "solid" | "patterned" | "graphic_print";

export type WashGroup = "lights" | "brights" | "darks" | "multicolour";

export interface DetectedColour {
  colourId: ColourId;
  pattern: GarmentPattern;
  confidence: "high" | "medium" | "low";
}

export interface ColourInput {
  colourId: ColourId;
  pattern: GarmentPattern;
}

export interface ShadeExample {
  name: string;
  hex?: string;
}

export interface ColourInfo {
  id: ColourId;
  label: string;
  hex: string | null;
  group: WashGroup;
  description: string;
}

export interface WashGroupInfo {
  id: WashGroup;
  label: string;
  examples: ShadeExample[];
  bleedRisk: "low" | "medium" | "high";
  washAloneFirst: boolean;
}

export interface ColourCare {
  insideOut: { value: boolean; text: string };
  washWith: { group: WashGroup; examples: ShadeExample[]; text: string };
  drying: { text: string } | null;
}

export interface ResolvedInstruction {
  symbolId: string;
  category: SymbolCategory;
  text: string;
  adjustedForColour: boolean;
}
