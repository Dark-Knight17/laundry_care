import { GoogleGenAI } from "@google/genai";
import { CARE_SYMBOLS } from "../../shared/symbols.ts";
import type { DetectedSymbol } from "../../shared/types.ts";
import { CANDIDATE_MODELS } from "../config.ts";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const symbolReference = CARE_SYMBOLS.map(
  (symbol) => `- id: "${symbol.id}"\n  label: "${symbol.label}"\n  iconDescription: "${symbol.iconDescription}"`
).join("\n\n");

const PROMPT = `You are an expert garment care tag symbol analyzer.
Analyze the provided image of a garment care tag and identify all ISO 3758 care symbols present.

Here is the reference list of known symbols:
${symbolReference}

Instructions:
1. Examine the image carefully.
2. For each symbol detected, match it strictly to the exact "id" from the reference list above.
3. Assign a confidence rating ("high", "medium", or "low") for each detected symbol:
   - "high": The symbol is clear, distinct, and unambiguous.
   - "medium": The symbol is partially visible, faded, wrinkled, or slightly ambiguous.
   - "low": The symbol is faint, blurred, or a best-guess match.
4. If no known symbols are detected, return an empty array [].
5. Respond with ONLY valid JSON (no markdown formatting, no commentary, no code fences) conforming to this shape:
[
  {
    "symbolId": "wash_30_normal",
    "confidence": "high"
  }
]`;

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

export interface DetectSymbolsInput {
  base64Data: string;
  mimeType: string;
}

export async function detectCareSymbols({
  base64Data,
  mimeType,
}: DetectSymbolsInput): Promise<DetectedSymbol[]> {
  let response;
  let lastError: unknown;

  for (const model of CANDIDATE_MODELS) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: PROMPT,
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response) {
        break;
      }
    } catch (modelError: any) {
      lastError = modelError;
      console.warn(`Model ${model} failed:`, modelError?.status || modelError?.message);

      const isTransient =
        modelError?.status === 503 ||
        modelError?.status === 429 ||
        modelError?.status === 404 ||
        modelError?.name === "TimeoutError" ||
        modelError?.message?.includes("high demand");

      if (isTransient) {
        console.log(`Falling back to next model in candidate list...`);
        continue;
      }

      throw modelError;
    }
  }

  if (!response) {
    throw lastError || new Error("All candidate models failed to respond");
  }

  const rawText = response.text ?? "[]";
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonString(rawText));
  } catch (parseError) {
    console.error("Failed to parse Gemini JSON output:", rawText, parseError);
    const error = new Error("Failed to parse model response as JSON");
    (error as any).isParseError = true;
    throw error;
  }

  const detected: DetectedSymbol[] = [];
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (
        typeof item?.symbolId === "string" &&
        (item.confidence === "high" || item.confidence === "medium" || item.confidence === "low")
      ) {
        detected.push({
          symbolId: item.symbolId,
          confidence: item.confidence,
        });
      }
    }
  }

  return detected;
}
