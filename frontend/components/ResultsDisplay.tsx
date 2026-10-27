import React, { useState } from "react";
import { MONOSPACE_FONT } from "../config.ts";
import { resolveSymbolsToScanResult } from "../lib/resolution.ts";
import { saveScan, type SavedScan } from "../services/api.ts";
import type { ScanResult } from "../../shared/types.ts";
import { ManualSymbolPicker } from "./ManualSymbolPicker.tsx";

interface ResultsDisplayProps {
  result: ScanResult;
  garmentBlob?: Blob | null;
  onReset: () => void;
  resetLabel?: string;
  onUpdateResult?: (updated: ScanResult) => void;
  onSaveSuccess?: (savedRecord: SavedScan) => void;
}

export function ResultsDisplay({
  result,
  garmentBlob,
  onReset,
  resetLabel,
  onUpdateResult,
  onSaveSuccess,
}: ResultsDisplayProps) {
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleApplyManual = (selectedIds: string[]) => {
    const updated = resolveSymbolsToScanResult(selectedIds);
    if (onUpdateResult) {
      onUpdateResult(updated);
    }
    setIsPicking(false);
  };

  const handleSave = async () => {
    if (!garmentBlob) {
      setSaveStatus("error");
      setSaveError("Garment photo is not available to save.");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");
    setSaveError(null);

    try {
      const saved = await saveScan(garmentBlob, result);
      setSaveStatus("success");
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess(saved);
        }, 600);
      }
    } catch (err: unknown) {
      console.error("Save scan failed:", err);
      setSaveStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to save scan";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isPicking) {
    return (
      <ManualSymbolPicker
        initialSelectedIds={result.detected.map((d) => d.symbolId)}
        onApply={handleApplyManual}
        onCancel={() => setIsPicking(false)}
      />
    );
  }

  return (
    <div>
      <h2>Care Instructions</h2>

      {result.lowConfidenceWarning && (
        <div
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeeba",
            color: "#856404",
            fontFamily: MONOSPACE_FONT,
          }}
        >
          <strong>Notice:</strong> Some detections were uncertain. Please double check
          the garment tag manually.
        </div>
      )}

      {result.instructions.length > 0 ? (
        <ul style={{ fontFamily: MONOSPACE_FONT }}>
          {result.instructions.map((instruction, index) => (
            <li key={index} style={{ marginBottom: "0.5rem" }}>
              {instruction}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontFamily: MONOSPACE_FONT }}>No care instructions detected.</p>
      )}

      {onUpdateResult && (
        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <button type="button" onClick={() => setIsPicking(true)}>
            Symbol looks wrong? Pick manually
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        {garmentBlob && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || saveStatus === "success"}
            style={{ padding: "0.5rem 1rem", fontWeight: "bold" }}
          >
            {isSaving ? "Saving..." : saveStatus === "success" ? "Saved" : "Save"}
          </button>
        )}
        <button type="button" onClick={onReset} style={{ padding: "0.5rem 1rem" }}>
          {resetLabel || "Scan another"}
        </button>
      </div>

      {saveStatus === "success" && (
        <p style={{ color: "#2e7d32", marginTop: "0.5rem" }}>
          Scan saved successfully! Returning to gallery...
        </p>
      )}

      {saveStatus === "error" && (
        <p style={{ color: "#c62828", marginTop: "0.5rem" }}>
          {saveError || "Failed to save scan."}
        </p>
      )}
    </div>
  );
}
