import React, { useEffect, useRef, useState } from "react";
import type { ScanResult } from "../shared/types.ts";
import { ResultsDisplay } from "./ResultsDisplay.tsx";

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
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

  useEffect(() => {
    if (!scanResult && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((playErr) => {
        console.error("Video play error:", playErr);
      });
    }
  }, [scanResult, stream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) {
      setError("Video preview is not available.");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera video feed is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setError("Unable to capture image from video preview.");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setError("Failed to create image blob from camera frame.");
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const formData = new FormData();
          formData.append("image", blob, "capture.jpg");

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
              // Ignore json parsing error
            }
            throw new Error(errorMsg);
          }

          const result: ScanResult = await response.json();
          console.log("ScanResult:", result);
          setScanResult(result);
        } catch (fetchErr: unknown) {
          console.error("Scan request failed:", fetchErr);
          const message =
            fetchErr instanceof Error ? fetchErr.message : "Failed to scan laundry tag";
          setError(`Scan error: ${message}`);
        } finally {
          setIsLoading(false);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleReset = () => {
    setScanResult(null);
    setError(null);
  };

  return (
    <div>
      <h1>Laundry Tag Scanner</h1>

      {scanResult ? (
        <ResultsDisplay
          result={scanResult}
          onReset={handleReset}
          onUpdateResult={setScanResult}
        />
      ) : (
        <div>
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ maxWidth: "100%", width: "480px", display: "block" }}
            />
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button type="button" onClick={handleCapture} disabled={isLoading}>
              {isLoading ? "Scanning..." : "Capture"}
            </button>
          </div>

          {isLoading && <p>Scanning tag, please wait...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
