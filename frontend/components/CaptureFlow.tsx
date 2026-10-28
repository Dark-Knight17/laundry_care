import React, { useEffect, useRef, useState } from "react";
import type { ScanResult } from "../../shared/types.ts";
import { captureFrameBlob } from "../lib/camera.ts";
import { scanCareTag } from "../services/api.ts";

export type CaptureStep = "garment" | "tag";

interface CaptureFlowProps {
  onScanComplete: (
    result: ScanResult,
    garmentBlob: Blob,
    garmentImageUrl: string,
    tagBlob: Blob,
    tagImageUrl: string
  ) => void;
}

export function CaptureFlow({ onScanComplete }: CaptureFlowProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [step, setStep] = useState<CaptureStep>("garment");
  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null);
  const [tagBlob, setTagBlob] = useState<Blob | null>(null);
  const [tagImageUrl, setTagImageUrl] = useState<string | null>(null);

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
        const message =
          err instanceof Error ? err.message : "Unable to access camera";
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
    (step === "tag" && tagImageUrl !== null);

  useEffect(() => {
    if (!isFrozen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((playErr) => {
        console.error("Video play error:", playErr);
      });
    }
  }, [isFrozen, stream]);

  const handleCaptureGarment = async () => {
    setError(null);
    const blob = await captureFrameBlob(videoRef.current);
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
    const blob = await captureFrameBlob(videoRef.current);
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
      const result = await scanCareTag(blob);
      console.log("ScanResult:", result);
      if (garmentBlob && garmentImageUrl) {
        onScanComplete(result, garmentBlob, garmentImageUrl, blob, url);
      }
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

  return (
    <div>
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "var(--color-surface)",
          border: "1px solid rgba(212, 212, 212, 0.15)",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            display: isFrozen ? "none" : "block",
            borderRadius: "16px",
            objectFit: "cover",
          }}
        />

        {step === "garment" && garmentImageUrl && (
          <img
            src={garmentImageUrl}
            alt="Captured garment"
            style={{
              width: "100%",
              display: "block",
              borderRadius: "16px",
              objectFit: "cover",
            }}
          />
        )}

        {step === "tag" && tagImageUrl && (
          <img
            src={tagImageUrl}
            alt="Captured care tag"
            style={{
              width: "100%",
              display: "block",
              borderRadius: "16px",
              objectFit: "cover",
            }}
          />
        )}
      </div>

      {step === "garment" && (
        <div style={{ marginTop: "1rem" }}>
          <h2>Take a photo of the garment</h2>
          <p>Photograph the whole garment first.</p>

          {!garmentImageUrl ? (
            <button
              type="button"
              onClick={handleCaptureGarment}
              style={{
                padding: "0.6rem 1.25rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-bg)",
                fontWeight: 600,
                border: "none",
                borderRadius: "6px",
              }}
            >
              Capture Garment
            </button>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={handleProceedToTag}
                style={{
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-bg)",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                Next: Photograph care tag
              </button>
              <button
                type="button"
                onClick={handleRetakeGarment}
                style={{
                  padding: "0.6rem 1rem",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                  border: "1px solid rgba(212, 212, 212, 0.2)",
                  borderRadius: "6px",
                }}
              >
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
              <button
                type="button"
                onClick={handleCaptureTag}
                disabled={isLoading}
                style={{
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-bg)",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                {isLoading ? "Scanning..." : "Capture Care Tag"}
              </button>
              <button
                type="button"
                onClick={handleBackToGarment}
                disabled={isLoading}
                style={{
                  padding: "0.6rem 1rem",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                  border: "1px solid rgba(212, 212, 212, 0.2)",
                  borderRadius: "6px",
                }}
              >
                Back to garment photo
              </button>
            </div>
          ) : (
            isLoading && <p>Scanning tag, please wait...</p>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: "var(--color-caution)", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
