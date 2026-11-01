import { corsHeaders } from "../config.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import {
  deleteGarmentPhoto,
  deleteScanRecord,
  getScanRecord,
} from "../services/supabase.ts";

export async function handleDeleteScan(
  req: AuthenticatedRequest,
  scanId: string
): Promise<Response> {
  if (!scanId || typeof scanId !== "string") {
    return new Response(JSON.stringify({ error: "Scan ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // 1. Look up the row filtered by id AND user_id (404 if none)
    const scan = await getScanRecord(scanId, req.userId);
    if (!scan) {
      return new Response(JSON.stringify({ error: "Scan not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 2. Delete the garment photo from storage bucket first, treating "object not found" as success
    try {
      if (scan.garment_photo_url) {
        await deleteGarmentPhoto(scan.garment_photo_url);
      }
    } catch (storageErr: any) {
      console.error(
        "Storage deletion failed, preserving database row:",
        storageErr
      );
      return new Response(
        JSON.stringify({
          error:
            "Failed to delete garment photo from storage. Scan record was preserved.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 3. Delete the table row
    await deleteScanRecord(scanId, req.userId);

    return new Response(JSON.stringify({ success: true, id: scanId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Failed to delete scan:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to delete scan" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
