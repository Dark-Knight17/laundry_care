import { corsHeaders } from "../config.ts";
import { resolveScanResult } from "../lib/resolution.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { detectCareSymbols } from "../services/gemini.ts";

export async function handleScan(
  req: AuthenticatedRequest | Request
): Promise<Response> {
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

    const detected = await detectCareSymbols({ base64Data, mimeType });
    const scanResult = resolveScanResult(detected);

    return new Response(JSON.stringify(scanResult), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    if (error?.isParseError) {
      return new Response(
        JSON.stringify({ error: "Failed to parse model response as JSON" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.error("Gemini API call failed:", error);
    const isUnavailable =
      error?.status === 503 || error?.message?.includes("high demand");

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
