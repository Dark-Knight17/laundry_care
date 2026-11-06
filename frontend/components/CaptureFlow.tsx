import React, { useEffect, useRef, useState } from "react";
import type { ScanResult } from "../../shared/types.ts";
import { captureFrameBlob } from "../lib/camera.ts";
import {
  getScanStep,
  previousScanStep,
  registerScanBackHandler,
  type ScanStep,
} from "../lib/navigation.ts";
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
  onClose: () => void;
}

export function CaptureFlow({ onScanComplete, onClose }: CaptureFlowProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [step, setStep] = useState<CaptureStep>("garment");
  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null);
  const [tagBlob, setTagBlob] = useState<Blob | null>(null);
  const [tagImageUrl, setTagImageUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const completedRef = useRef(false);
  const garmentImageUrlRef = useRef<string | null>(null);
  const tagImageUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentScanStep: ScanStep = getScanStep({
    step,
    hasGarmentImage: garmentImageUrl !== null,
    hasTagImage: tagImageUrl !== null,
    isLoading,
  });

  const scanStepRef = useRef<ScanStep>(currentScanStep);
  scanStepRef.current = currentScanStep;

  useEffect(() => {
    garmentImageUrlRef.current = garmentImageUrl;
  }, [garmentImageUrl]);

  useEffect(() => {
    tagImageUrlRef.current = tagImageUrl;
  }, [tagImageUrl]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (!completedRef.current) {
        if (garmentImageUrlRef.current) {
          URL.revokeObjectURL(garmentImageUrlRef.current);
        }
        if (tagImageUrlRef.current) {
          URL.revokeObjectURL(tagImageUrlRef.current);
        }
      }
    };
  }, []);

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

  // Ensure all active stream tracks are stopped whenever stream changes or unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleRetakeGarment = () => {
    scanStepRef.current = "garment_live";
    if (garmentImageUrlRef.current) {
      URL.revokeObjectURL(garmentImageUrlRef.current);
      garmentImageUrlRef.current = null;
    }
    setGarmentBlob(null);
    setGarmentImageUrl(null);
    setError(null);
  };

  const handleProceedToTag = () => {
    scanStepRef.current = "tag_live";
    setError(null);
    setStep("tag");
  };

  const returnToGarmentReview = () => {
    scanStepRef.current = "garment_review";
    if (tagImageUrlRef.current) {
      URL.revokeObjectURL(tagImageUrlRef.current);
      tagImageUrlRef.current = null;
    }
    setTagBlob(null);
    setTagImageUrl(null);
    setError(null);
    setStep("garment");
  };

  const returnToTagLive = () => {
    scanStepRef.current = "tag_live";
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (tagImageUrlRef.current) {
      URL.revokeObjectURL(tagImageUrlRef.current);
      tagImageUrlRef.current = null;
    }
    setTagBlob(null);
    setTagImageUrl(null);
    setIsLoading(false);
    setError(null);
  };

  // Register back handling inside scan flow
  useEffect(() => {
    registerScanBackHandler({
      getStep: () => scanStepRef.current,
      onStay: (nextStep: ScanStep) => {
        scanStepRef.current = nextStep;
        switch (nextStep) {
          case "tag_live":
            returnToTagLive();
            break;
          case "garment_review":
            returnToGarmentReview();
            break;
          case "garment_live":
            handleRetakeGarment();
            break;
        }
      },
      onLeave: () => {
        scanStepRef.current = "garment_live";
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (garmentImageUrlRef.current) {
          URL.revokeObjectURL(garmentImageUrlRef.current);
          garmentImageUrlRef.current = null;
        }
        if (tagImageUrlRef.current) {
          URL.revokeObjectURL(tagImageUrlRef.current);
          tagImageUrlRef.current = null;
        }
      },
    });

    return () => {
      registerScanBackHandler(null);
    };
  }, [stream]);

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
    scanStepRef.current = "garment_review";
    setGarmentBlob(blob);
    setGarmentImageUrl(url);
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
    scanStepRef.current = "tag_scanning";
    setTagBlob(blob);
    setTagImageUrl(url);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await scanCareTag(blob, undefined, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      if (garmentBlob && garmentImageUrl) {
        completedRef.current = true;
        onScanComplete(result, garmentBlob, garmentImageUrl, blob, url);
      }
    } catch (fetchErr: unknown) {
      if (
        controller.signal.aborted ||
        (fetchErr instanceof Error && fetchErr.name === "AbortError")
      ) {
        return;
      }
      console.error("Scan request failed:", fetchErr);
      const message =
        fetchErr instanceof Error ? fetchErr.message : "Failed to scan care tag";
      setError(`Scan error: ${message}`);
      URL.revokeObjectURL(url);
      setTagBlob(null);
      setTagImageUrl(null);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="camera-viewport">
      {/* Edge-to-edge live camera stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-media-stream"
        style={{ display: isFrozen ? "none" : "block" }}
      />

      {/* Edge-to-edge frozen still frame on review / scan */}
      {step === "garment" && garmentImageUrl && (
        <img
          src={garmentImageUrl}
          alt="Captured garment"
          className="camera-media-frozen"
        />
      )}

      {step === "tag" && tagImageUrl && (
        <img
          src={tagImageUrl}
          alt="Captured care tag"
          className="camera-media-frozen"
        />
      )}

      {/* Top-left circular close button */}
      <button
        type="button"
        onClick={() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
          registerScanBackHandler(null);
          onClose();
        }}
        className="camera-close-btn"
        aria-label="Close and return to gallery"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-icon)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Camera permission / access error centered on black screen */}
      {error && !stream && (
        <div className="camera-error-container">
          <p className="camera-error-text">{error}</p>
        </div>
      )}

      {/* Non-fatal error toast while camera is active */}
      {error && stream && (
        <div className="camera-error-toast" role="alert">
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Live camera capture button */}
      {!isFrozen && (
        <button
          type="button"
          onClick={step === "garment" ? handleCaptureGarment : handleCaptureTag}
          disabled={isLoading}
          className="camera-capture-btn"
        >
          {step === "garment" ? "Capture full garment" : "Capture care tag"}
        </button>
      )}

      {/* Review state: Retake (ghost) & Next (tonal) side by side */}
      {step === "garment" && garmentImageUrl && (
        <div className="camera-review-row">
          <button
            type="button"
            onClick={handleRetakeGarment}
            className="camera-retake-btn"
          >
            Retake
          </button>
          <button
            type="button"
            onClick={handleProceedToTag}
            className="camera-next-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Tag step scanning indicator placed where buttons were */}
      {step === "tag" && tagImageUrl && isLoading && (
        <div className="camera-loading-pill">
          <svg
            className="spinner-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              strokeDasharray="32"
              strokeDashoffset="12"
            />
          </svg>
          <span>Scanning care tag...</span>
        </div>
      )}
    </div>
  );
}
