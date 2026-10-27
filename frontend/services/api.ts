import { API_BASE_URL } from "../config.ts";
import { supabase } from "./supabaseClient.ts";
import type { ScanResult } from "../../shared/types.ts";

export interface SavedScan {
  id: string;
  garment_photo_url: string;
  detected_symbols?: any[];
  instructions: string[];
  created_at: string;
}

export async function scanCareTag(
  imageBlob: Blob,
  accessToken?: string
): Promise<ScanResult> {
  const formData = new FormData();
  formData.append("image", imageBlob, "tag.jpg");

  let token = accessToken;
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && typeof errJson.error === "string") {
        errorMsg = errJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const result: ScanResult = await response.json();
  return result;
}

export async function saveScan(
  garmentBlob: Blob,
  scanResult: ScanResult,
  accessToken?: string
): Promise<SavedScan> {
  const formData = new FormData();
  formData.append("garmentPhoto", garmentBlob, "garment.jpg");
  formData.append("detectedSymbols", JSON.stringify(scanResult.detected));
  formData.append("instructions", JSON.stringify(scanResult.instructions));

  let token = accessToken;
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/scans`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && typeof errJson.error === "string") {
        errorMsg = errJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await response.json();
}

export async function fetchSavedScans(accessToken?: string): Promise<SavedScan[]> {
  let token = accessToken;
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/scans`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && typeof errJson.error === "string") {
        errorMsg = errJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await response.json();
}
