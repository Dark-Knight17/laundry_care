import { corsHeaders } from "../config.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { createScanRecord, uploadGarmentPhoto } from "../services/supabase.ts";

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
