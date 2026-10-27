import { createClient } from "@supabase/supabase-js";
import { GARMENT_PHOTOS_BUCKET, SCANS_TABLE } from "../config.ts";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  console.error("Error: SUPABASE_URL environment variable is required.");
  process.exit(1);
}

if (!supabaseSecretKey) {
  console.error("Error: SUPABASE_SECRET_KEY environment variable is required.");
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey);

/**
 * Uploads a garment photo to the Supabase Storage bucket under {userId}/{generatedFilename}.
 */
export async function uploadGarmentPhoto(
  userId: string,
  file: Blob | Buffer,
  contentType: string = "image/jpeg"
): Promise<{ path: string; publicUrl: string }> {
  const extension = contentType.includes("png") ? "png" : "jpg";
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = `${userId}/${filename}`;

  let bucket = GARMENT_PHOTOS_BUCKET;
  let uploadRes = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  // If initial bucket fails because of naming convention differences, try alternate naming
  if (uploadRes.error && uploadRes.error.message.includes("not found")) {
    const alternateBucket = bucket.includes("_")
      ? bucket.replace(/_/g, "-")
      : bucket.replace(/-/g, "_");
    const fallbackRes = await supabase.storage
      .from(alternateBucket)
      .upload(filePath, file, {
        contentType,
        upsert: false,
      });

    if (!fallbackRes.error) {
      bucket = alternateBucket;
      uploadRes = fallbackRes;
    }
  }

  if (uploadRes.error) {
    throw new Error(`Failed to upload garment photo: ${uploadRes.error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    path: uploadRes.data.path,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Inserts a completed scan record into the database.
 */
export async function createScanRecord(scanData: {
  userId: string;
  garmentPhotoUrl: string;
  detectedSymbols: any[];
  instructions: string[];
}) {
  const { data, error } = await supabase
    .from(SCANS_TABLE)
    .insert({
      user_id: scanData.userId,
      garment_photo_url: scanData.garmentPhotoUrl,
      detected_symbols: scanData.detectedSymbols,
      instructions: scanData.instructions,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert scan record: ${error.message}`);
  }

  return data;
}
