export const PORT = Number(process.env.PORT) || 3000;

export const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

export const SCANS_TABLE = process.env.SUPABASE_SCANS_TABLE || "scans";

export const GARMENT_PHOTOS_BUCKET =
  process.env.SUPABASE_GARMENT_PHOTOS_BUCKET || "garment_photos";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
