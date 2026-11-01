import { corsHeaders } from "../config.ts";
import { resolveSymbolIdsToScanResult } from "../lib/resolution.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { updateScanRecord } from "../services/supabase.ts";
import { getSymbolById } from "../../shared/symbols.ts";

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

  const rawSymbolIds = Array.isArray(body)
    ? body
    : body?.symbolIds || body?.symbol_ids;

  if (!Array.isArray(rawSymbolIds)) {
    return new Response(
      JSON.stringify({ error: "Field 'symbolIds' must be an array of strings" }),
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

  // Server rebuilds instructions from shared/symbols.ts using shared resolution function (lib/)
  const resolved = resolveSymbolIdsToScanResult(rawSymbolIds);

  try {
    // Ownership: query filtered by both scanId and req.userId; returns null (404) if no match
    const updated = await updateScanRecord(
      scanId,
      req.userId,
      resolved.detected,
      resolved.instructions
    );

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
