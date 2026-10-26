import { API_BASE_URL } from "../config.ts";
import type { ScanResult } from "../../shared/types.ts";

export async function scanCareTag(imageBlob: Blob): Promise<ScanResult> {
  const formData = new FormData();
  formData.append("image", imageBlob, "tag.jpg");

  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
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
