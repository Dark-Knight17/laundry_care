import { corsHeaders } from "../config.ts";
import { resolveSymbolIdsToScanResult } from "../lib/resolution.ts";
import { colourToColumns, type ColourColumns } from "../lib/colourColumns.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { updateScanRecord } from "../services/supabase.ts";
import { parseColourInput } from "../../shared/colourParse.ts";
import { getSymbolById } from "../../shared/symbols.ts";
import type { DetectedColour, DetectedSymbol } from "../../shared/types.ts";

export async function handleUpdateScan(
  req: AuthenticatedRequest,
  scanId: string
): Promise<Response> {
  if (!scanId || typeof scanId !== "string") {
    return new Response(JSON.stringify({ error: "Scan ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const isBodyArray = Array.isArray(body);
  const isBodyObj = typeof body === "object" && body !== null && !isBodyArray;

  const hasSymbols =
    isBodyArray ||
    (isBodyObj && (body.symbolIds !== undefined || body.symbol_ids !== undefined));
  const hasColour = isBodyObj && "colour" in body;

  if (!hasSymbols && !hasColour) {
    return new Response(
      JSON.stringify({
        error: "At least one of 'symbolIds' or 'colour' is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  let detectedSymbols: DetectedSymbol[] | undefined;
  let instructions: string[] | undefined;

  if (hasSymbols) {
    const rawSymbolIds = isBodyArray
      ? body
      : body.symbolIds !== undefined
      ? body.symbolIds
      : body.symbol_ids;

    if (!Array.isArray(rawSymbolIds)) {
      return new Response(
        JSON.stringify({
          error: "Field 'symbolIds' must be an array of strings",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate every symbol id exists in CARE_SYMBOLS; return 400 otherwise
    for (const id of rawSymbolIds) {
      if (typeof id !== "string" || !getSymbolById(id)) {
        return new Response(
          JSON.stringify({ error: `Invalid symbol id: '${id}'` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    const resolved = resolveSymbolIdsToScanResult(rawSymbolIds);
    detectedSymbols = resolved.detected;
    instructions = resolved.instructions;
  }

  let colourCols: ColourColumns | undefined;

  if (hasColour) {
    if (body.colour === null) {
      colourCols = colourToColumns(null);
    } else {
      const parsedColour = parseColourInput(body.colour);
      if (!parsedColour) {
        return new Response(
          JSON.stringify({ error: "Invalid colour input" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      const confirmedColour: DetectedColour = {
        ...parsedColour,
        confidence: "high",
      };
      colourCols = colourToColumns(confirmedColour);
    }
  }

  try {
    // Ownership: query filtered by both scanId and req.userId; returns null (404) if no match
    const updated = await updateScanRecord(scanId, req.userId, {
      detectedSymbols,
      instructions,
      colourCols,
    });

    if (!updated) {
      return new Response(JSON.stringify({ error: "Scan not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Failed to update scan:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to update scan" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
