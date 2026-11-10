import { corsHeaders } from "../config.ts";
import { colourToColumns } from "../lib/colourColumns.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import {
  createScanRecord,
  listUserScans,
  uploadGarmentPhoto,
} from "../services/supabase.ts";
import { parseDetectedColour } from "../../shared/colourParse.ts";
import type { DetectedColour } from "../../shared/types.ts";

export async function handleListScans(
  req: AuthenticatedRequest
): Promise<Response> {
  try {
    const scans = await listUserScans(req.userId);
    return new Response(JSON.stringify(scans), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Failed to list scans:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to list scans" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

export async function handleCreateScan(
  req: AuthenticatedRequest
): Promise<Response> {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(
      JSON.stringify({ error: "Content-Type must be multipart/form-data" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  let formData;
  try {
    formData = await req.formData();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to parse multipart form data" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const file = formData.get("garmentPhoto");
  if (!file || !(file instanceof Blob)) {
    return new Response(
      JSON.stringify({
        error: "Field 'garmentPhoto' is required and must be an image file",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const rawDetected =
    formData.get("detectedSymbols") || formData.get("detected_symbols");
  let detectedSymbols: any[] = [];
  if (typeof rawDetected === "string") {
    try {
      detectedSymbols = JSON.parse(rawDetected);
    } catch {
      detectedSymbols = [];
    }
  }

  const rawInstructions = formData.get("instructions");
  let instructions: string[] = [];
  if (typeof rawInstructions === "string") {
    try {
      instructions = JSON.parse(rawInstructions);
    } catch {
      instructions = [rawInstructions];
    }
  }

  const rawColour = formData.get("colour");
  let detectedColour: DetectedColour | null = null;
  if (rawColour !== null && rawColour !== undefined && rawColour !== "") {
    let parsedJson: unknown = rawColour;
    if (typeof rawColour === "string") {
      try {
        parsedJson = JSON.parse(rawColour);
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid JSON for 'colour'" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }
    const validated = parseDetectedColour(parsedJson);
    if (!validated) {
      return new Response(
        JSON.stringify({ error: "Invalid colour value" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    detectedColour = validated;
  }

  const colourCols = colourToColumns(detectedColour);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";

    const uploadResult = await uploadGarmentPhoto(
      req.userId,
      buffer,
      mimeType
    );

    const scanRecord = await createScanRecord({
      userId: req.userId,
      garmentPhotoUrl: uploadResult.publicUrl || uploadResult.path,
      detectedSymbols,
      instructions,
      colourCols,
    });

    return new Response(JSON.stringify(scanRecord), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("Failed to save scan record:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to save scan record" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
