import { API_BASE_URL } from "../config.ts";
import { supabase } from "./supabaseClient.ts";
import type { ScanResult } from "../../shared/types.ts";
import { uploadErrorMessage } from "../lib/uploadErrors.ts";

export interface SavedScan {
  id: string;
  garment_photo_url: string;
  detected_symbols?: any[];
  instructions: string[];
  created_at: string;
}

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return undefined;
    }
  }
}

export async function scanCareTag(
  imageBlob: Blob,
  accessToken?: string,
  signal?: AbortSignal
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
    signal,
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    const errorMsg = uploadErrorMessage(response.status, body);
    throw new ApiError(errorMsg, response.status, body);
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
    const body = await parseResponseBody(response);
    const errorMsg = uploadErrorMessage(response.status, body);
    throw new ApiError(errorMsg, response.status, body);
  }

  return await response.json();
}

export async function updateScan(
  scanId: string,
  symbolIds: string[],
  accessToken?: string
): Promise<SavedScan> {
  let token = accessToken;
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/scans/${scanId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ symbolIds }),
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    const errorMsg = uploadErrorMessage(response.status, body);
    throw new ApiError(errorMsg, response.status, body);
  }

  return await response.json();
}

export async function deleteScan(
  scanId: string,
  accessToken?: string
): Promise<void> {
  let token = accessToken;
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/scans/${scanId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    const errorMsg = uploadErrorMessage(response.status, body);
    throw new ApiError(errorMsg, response.status, body);
  }
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
    const body = await parseResponseBody(response);
    const errorMsg = uploadErrorMessage(response.status, body);
    throw new ApiError(errorMsg, response.status, body);
  }

  return await response.json();
}
