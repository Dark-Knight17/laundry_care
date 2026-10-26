import React, { useState } from "react";
import { MONOSPACE_FONT } from "../config.ts";
import { resolveSymbolsToScanResult } from "../lib/resolution.ts";
import type { ScanResult } from "../../shared/types.ts";
import { ManualSymbolPicker } from "./ManualSymbolPicker.tsx";

interface ResultsDisplayProps {
  result: ScanResult;
  onReset: () => void;
  onUpdateResult?: (updated: ScanResult) => void;
}

export function ResultsDisplay({
  result,
  onReset,
  onUpdateResult,
}: ResultsDisplayProps) {
  const [isPicking, setIsPicking] = useState<boolean>(false);

  const handleApplyManual = (selectedIds: string[]) => {
    const updated = resolveSymbolsToScanResult(selectedIds);
    if (onUpdateResult) {
      onUpdateResult(updated);
    }
    setIsPicking(false);
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

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <button type="button" onClick={() => setIsPicking(true)}>
          Symbol looks wrong? Pick manually
        </button>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <button type="button" onClick={onReset}>
          Scan another
        </button>
      </div>
    </div>
  );
}
