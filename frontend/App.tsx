import React, { useEffect, useRef, useState } from "react";
import type { ScanResult } from "../shared/types.ts";
import { ResultsDisplay } from "./ResultsDisplay.tsx";

type CaptureStep = "garment" | "tag";

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [step, setStep] = useState<CaptureStep>("garment");
  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null);
  const [tagBlob, setTagBlob] = useState<Blob | null>(null);
  const [tagImageUrl, setTagImageUrl] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;

    async function initCamera() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (!active) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(localStream);
      } catch (err: unknown) {
        if (!active) return;
        console.error("Camera access error:", err);
        const message = err instanceof Error ? err.message : "Unable to access camera";
        setError(`Camera access error: ${message}`);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const isFrozen =
    (step === "garment" && garmentImageUrl !== null) ||
    (step === "tag" && tagImageUrl !== null) ||
    scanResult !== null;

  useEffect(() => {
    if (!isFrozen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((playErr) => {
        console.error("Video play error:", playErr);
      });
    }
  }, [isFrozen, stream]);

  const captureFrameBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        resolve(null);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const handleCaptureGarment = async () => {
    setError(null);
    const blob = await captureFrameBlob();
    if (!blob) {
      setError("Unable to capture image from camera preview.");
      return;
    }

    if (garmentImageUrl) {
      URL.revokeObjectURL(garmentImageUrl);
    }
    const url = URL.createObjectURL(blob);
    setGarmentBlob(blob);
    setGarmentImageUrl(url);
  };

  const handleRetakeGarment = () => {
    if (garmentImageUrl) {
      URL.revokeObjectURL(garmentImageUrl);
    }
    setGarmentBlob(null);
    setGarmentImageUrl(null);
    setError(null);
  };

  const handleProceedToTag = () => {
    setError(null);
    setStep("tag");
  };

  const handleBackToGarment = () => {
    if (tagImageUrl) {
      URL.revokeObjectURL(tagImageUrl);
    }
    setTagBlob(null);
    setTagImageUrl(null);
    setError(null);
    setStep("garment");
  };

  const handleCaptureTag = async () => {
    setError(null);
    const blob = await captureFrameBlob();
    if (!blob) {
      setError("Unable to capture image from camera preview.");
      return;
    }

    if (tagImageUrl) {
      URL.revokeObjectURL(tagImageUrl);
    }
    const url = URL.createObjectURL(blob);
    setTagBlob(blob);
    setTagImageUrl(url);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", blob, "tag.jpg");

      const response = await fetch("http://localhost:3000/scan", {
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
      console.log("ScanResult:", result);
      setScanResult(result);
    } catch (fetchErr: unknown) {
      console.error("Scan request failed:", fetchErr);
      const message =
        fetchErr instanceof Error ? fetchErr.message : "Failed to scan care tag";
      setError(`Scan error: ${message}`);
      URL.revokeObjectURL(url);
      setTagBlob(null);
      setTagImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (garmentImageUrl) {
      URL.revokeObjectURL(garmentImageUrl);
    }
    if (tagImageUrl) {
      URL.revokeObjectURL(tagImageUrl);
    }
    setGarmentBlob(null);
    setGarmentImageUrl(null);
    setTagBlob(null);
    setTagImageUrl(null);
    setScanResult(null);
    setError(null);
    setStep("garment");
  };

  return (
    <div>
      <h1>Laundry Tag Scanner</h1>

      {scanResult ? (
        <div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {garmentImageUrl && (
              <div>
                <p style={{ margin: "0 0 0.25rem 0", fontWeight: "bold" }}>Garment</p>
                <img
                  src={garmentImageUrl}
                  alt="Captured garment"
                  style={{ width: "200px", display: "block", border: "1px solid #ccc" }}
                />
              </div>
            )}
            {tagImageUrl && (
              <div>
                <p style={{ margin: "0 0 0.25rem 0", fontWeight: "bold" }}>Care Tag</p>
                <img
                  src={tagImageUrl}
                  alt="Captured care tag"
                  style={{ width: "200px", display: "block", border: "1px solid #ccc" }}
                />
              </div>
            )}
          </div>

          <ResultsDisplay
            result={scanResult}
            onReset={handleReset}
            onUpdateResult={setScanResult}
          />
        </div>
      ) : (
        <div>
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                maxWidth: "100%",
                width: "480px",
                display: isFrozen ? "none" : "block",
              }}
            />

            {step === "garment" && garmentImageUrl && (
              <img
                src={garmentImageUrl}
                alt="Captured garment"
                style={{ maxWidth: "100%", width: "480px", display: "block" }}
              />
            )}

            {step === "tag" && tagImageUrl && (
              <img
                src={tagImageUrl}
                alt="Captured care tag"
                style={{ maxWidth: "100%", width: "480px", display: "block" }}
              />
            )}
          </div>

          {step === "garment" && (
            <div style={{ marginTop: "1rem" }}>
              <h2>Take a photo of the garment</h2>
              <p>Photograph the whole garment first.</p>

              {!garmentImageUrl ? (
                <button type="button" onClick={handleCaptureGarment}>
                  Capture Garment
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={handleProceedToTag}>
                    Next: Photograph care tag
                  </button>
                  <button type="button" onClick={handleRetakeGarment}>
                    Retake photo
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "tag" && (
            <div style={{ marginTop: "1rem" }}>
              <h2>Now photograph the care tag</h2>
              <p>Frame the laundry care symbols clearly.</p>

              {!tagImageUrl ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={handleCaptureTag} disabled={isLoading}>
                    {isLoading ? "Scanning..." : "Capture Care Tag"}
                  </button>
                  <button type="button" onClick={handleBackToGarment} disabled={isLoading}>
                    Back to garment photo
                  </button>
                </div>
              ) : (
                isLoading && <p>Scanning tag, please wait...</p>
              )}
            </div>
          )}

          {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
