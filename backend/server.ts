import { GoogleGenAI } from "@google/genai";
import { CARE_SYMBOLS, getSymbolById } from "../shared/symbols.ts";
import type { DetectedSymbol, ScanResult } from "../shared/types.ts";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required to start the server.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method === "GET" && url.pathname === "/") {
      return new Response("Laundry Tag Scanner API running", {
        headers: { "Content-Type": "text/plain", ...corsHeaders },
      });
    }

    if (req.method === "POST" && url.pathname === "/scan") {
      const contentType = req.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return new Response(
          JSON.stringify({ error: "Content-Type must be multipart/form-data" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      let formData;
      try {
        formData = await req.formData();
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Failed to parse multipart form data" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const file = formData.get("image");
      if (!file || !(file instanceof Blob)) {
        return new Response(
          JSON.stringify({ error: "Field 'image' is required and must be an image file" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "image/jpeg";

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
          return new Response(
            JSON.stringify({ error: "Failed to parse model response as JSON" }),
            { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const detected: DetectedSymbol[] = [];
        const instructions: string[] = [];
        let lowConfidenceWarning = false;

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (
              typeof item?.symbolId === "string" &&
              (item.confidence === "high" || item.confidence === "medium" || item.confidence === "low")
            ) {
              const detectedSymbol: DetectedSymbol = {
                symbolId: item.symbolId,
                confidence: item.confidence,
              };
              detected.push(detectedSymbol);

              if (item.confidence === "low") {
                lowConfidenceWarning = true;
              }

              const symbol = getSymbolById(item.symbolId);
              if (symbol) {
                instructions.push(symbol.instruction);
              }
            }
          }
        }

        const scanResult: ScanResult = {
          detected,
          instructions,
          lowConfidenceWarning,
        };

        return new Response(JSON.stringify(scanResult), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (geminiError: any) {
        console.error("Gemini API call failed:", geminiError);
        const isUnavailable =
          geminiError?.status === 503 ||
          geminiError?.message?.includes("high demand");

        const status = isUnavailable ? 503 : 500;
        const message = isUnavailable
          ? "Gemini API is currently experiencing high demand. Please try again in a few moments or pick symbols manually."
          : "Failed to process image with Gemini API";

        return new Response(
          JSON.stringify({ error: message }),
          { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});

console.log(`Server listening on port ${server.port}`);
