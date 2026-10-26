import React, { useState } from "react";
import { getSymbolById } from "../shared/symbols.ts";
import type { DetectedSymbol, ScanResult } from "../shared/types.ts";
import { ManualSymbolPicker } from "./ManualSymbolPicker.tsx";

interface ResultsDisplayProps {
  result: ScanResult;
  onReset: () => void;
  onUpdateResult?: (updated: ScanResult) => void;
}

const MONOSPACE_FONT = '"SFMono-Regular", "Consolas", "Menlo", monospace';

export function ResultsDisplay({
  result,
  onReset,
  onUpdateResult,
}: ResultsDisplayProps) {
  const [isPicking, setIsPicking] = useState<boolean>(false);

  const handleApplyManual = (selectedIds: string[]) => {
    const instructions: string[] = [];
    const detected: DetectedSymbol[] = [];

    for (const id of selectedIds) {
      const symbol = getSymbolById(id);
      if (symbol) {
        instructions.push(symbol.instruction);
        detected.push({ symbolId: id, confidence: "high" });
      }
    }

    const updated: ScanResult = {
      detected,
      instructions,
      lowConfidenceWarning: false,
    };

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
