import React, { useEffect, useRef, useState } from "react";
import type { ScanResult } from "../shared/types.ts";

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((playErr) => {
            console.error("Video play error:", playErr);
          });
        }
      } catch (err: unknown) {
        console.error("Camera access error:", err);
        const message = err instanceof Error ? err.message : "Unable to access camera";
        setError(`Camera access error: ${message}`);
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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

  return (
    <div>
      <h1>Laundry Tag Scanner</h1>

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
  );
}
