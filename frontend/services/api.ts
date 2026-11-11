import { API_BASE_URL } from "../config.ts";
import { supabase } from "./supabaseClient.ts";
import { parseDetectedColour } from "../../shared/colourParse.ts";
import type {
  ColourInput,
  SavedScan,
  ScanResult,
} from "../../shared/types.ts";
import { uploadErrorMessage } from "../lib/uploadErrors.ts";

export type { SavedScan } from "../../shared/types.ts";

export interface UpdateScanPayload {
  symbolIds?: string[];
  colour?: ColourInput | null;
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
  garmentImageBlob?: Blob | null,
  accessToken?: string,
  signal?: AbortSignal
): Promise<ScanResult> {
  const formData = new FormData();
  formData.append("image", imageBlob, "tag.jpg");
  if (garmentImageBlob) {
    formData.append("garmentImage", garmentImageBlob, "garment.jpg");
  }

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
  // Treat any colour from the API that fails parseDetectedColour as null
  result.colour = parseDetectedColour(result.colour);
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
  if (scanResult.colour) {
    formData.append("colour", JSON.stringify(scanResult.colour));
  }

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
  payload: string[] | UpdateScanPayload,
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

  const body = Array.isArray(payload) ? { symbolIds: payload } : payload;

  const response = await fetch(`${API_BASE_URL}/scans/${scanId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
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
