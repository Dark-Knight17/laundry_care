import React from "react";
import type { ScanResult } from "../shared/types.ts";

interface ResultsDisplayProps {
  result: ScanResult;
  onReset: () => void;
}

export function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
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
          }}
        >
          <strong>Notice:</strong> Some detections were uncertain. Please double check
          the garment tag manually.
        </div>
      )}

      {result.instructions.length > 0 ? (
        <ul>
          {result.instructions.map((instruction, index) => (
            <li key={index} style={{ marginBottom: "0.5rem" }}>
              {instruction}
            </li>
          ))}
        </ul>
      ) : (
        <p>No care instructions detected.</p>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <button type="button" onClick={onReset}>
          Scan another
        </button>
      </div>
    </div>
  );
}
