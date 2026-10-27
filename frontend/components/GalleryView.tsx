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
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>
          Your Wardrobe
        </h2>
        <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
          Select a garment to view its care instructions.
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          Loading saved garments...
        </div>
      ) : scans.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            backgroundColor: "#fafafa",
            border: "1px dashed #ccc",
            borderRadius: "8px",
            color: "#666",
            marginTop: "1.5rem",
          }}
        >
          <p style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>
            No saved garments yet
          </p>
          <p style={{ fontSize: "0.9rem", margin: 0 }}>
            Tap <strong>Scan</strong> below to add your first garment care tag.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "0.75rem",
            paddingBottom: "5.5rem",
          }}
        >
          {scans.map((scan) => (
            <button
              key={scan.id}
              type="button"
              onClick={() => onSelectScan(scan)}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
                padding: 0,
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.1s ease, box-shadow 0.1s ease",
              }}
            >
              <img
                src={scan.garment_photo_url}
                alt="Saved garment"
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  display: "block",
                  backgroundColor: "#f0f0f0",
                }}
              />
              <div
                style={{
                  padding: "0.4rem 0.5rem",
                  fontSize: "0.75rem",
                  color: "#555",
                  backgroundColor: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  {scan.instructions.length} rule
                  {scan.instructions.length === 1 ? "" : "s"}
                </span>
                <span style={{ color: "#999" }}>
                  {new Date(scan.created_at).toLocaleDateString(undefined, {
                    month: "numeric",
                    day: "numeric",
                  })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Fixed bottom center Scan button */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        <button
          type="button"
          onClick={onStartScan}
          style={{
            padding: "0.75rem 2.25rem",
            fontSize: "1rem",
            fontWeight: "bold",
            backgroundColor: "#0066cc",
            color: "#ffffff",
            border: "none",
            borderRadius: "28px",
            boxShadow: "0 4px 12px rgba(0, 102, 204, 0.35)",
            cursor: "pointer",
          }}
        >
          Scan
        </button>
      </div>
    </div>
  );
}
