import React from "react";
import type { SavedScan } from "../services/api.ts";

interface GalleryViewProps {
  scans: SavedScan[];
  isLoading: boolean;
  onSelectScan: (scan: SavedScan) => void;
  onStartScan: () => void;
}

export function GalleryView({
  scans,
  isLoading,
  onSelectScan,
  onStartScan,
}: GalleryViewProps) {
  return (
    <div>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "5rem 1.5rem",
            color: "var(--color-text)",
            opacity: 0.7,
            fontFamily: "var(--font-sans)",
            fontSize: "0.95rem",
          }}
        >
          Loading saved garments...
        </div>
      ) : scans.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "4.5rem 1.5rem 6rem 1.5rem",
            minHeight: "55vh",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "rgba(224, 184, 100, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
              color: "var(--color-accent-secondary)",
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <h2
            style={{
              margin: "0 0 0.5rem 0",
              fontFamily: "var(--font-heading)",
              fontSize: "1.45rem",
              fontWeight: "normal",
              color: "var(--color-text)",
            }}
          >
            No saved garments yet
          </h2>
          <p
            style={{
              margin: 0,
              maxWidth: "280px",
              fontSize: "0.92rem",
              lineHeight: 1.5,
              color: "var(--color-text)",
              opacity: 0.75,
              fontFamily: "var(--font-sans)",
            }}
          >
            Tap <strong>Scan</strong> below to add your first garment care tag and instructions.
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {scans.map((scan) => (
            <button
              key={scan.id}
              type="button"
              onClick={() => onSelectScan(scan)}
              className="gallery-tile"
              aria-label={`Garment scan from ${new Date(scan.created_at).toLocaleDateString()}`}
            >
              <img
                src={scan.garment_photo_url}
                alt="Saved garment thumbnail"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fixed bottom-center pill Scan button with safe-area support */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          onClick={onStartScan}
          className="scan-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Scan</span>
        </button>
      </div>
    </div>
  );
}
