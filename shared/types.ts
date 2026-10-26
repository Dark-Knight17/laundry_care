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
