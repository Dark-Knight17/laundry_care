import React, { useEffect, useState } from "react";
import { MONOSPACE_FONT } from "../config.ts";
import { resolveSymbolsToScanResult } from "../lib/resolution.ts";
import { scanSaveService, type ActiveSaveState } from "../services/scanSaveService.ts";
import type { ScanResult } from "../../shared/types.ts";
import { ManualSymbolPicker } from "./ManualSymbolPicker.tsx";

interface ResultsDisplayProps {
  result: ScanResult;
  scanSessionId?: string;
  onDone?: () => void;
  onScanAnother?: () => void;
  onUpdateResult?: (updated: ScanResult) => void;
}

export function ResultsDisplay({
  result,
  scanSessionId,
  onDone,
  onScanAnother,
  onUpdateResult,
}: ResultsDisplayProps) {
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [saveState, setSaveState] = useState<ActiveSaveState | null>(() =>
    scanSessionId ? scanSaveService.getState(scanSessionId) || null : null
  );

  useEffect(() => {
    if (!scanSessionId) return;
    const unsubscribe = scanSaveService.subscribe(scanSessionId, (state) => {
      setSaveState(state);
    });
    return unsubscribe;
  }, [scanSessionId]);

  const handleApplyManual = async (selectedIds: string[]) => {
    const updated = resolveSymbolsToScanResult(selectedIds);
    if (onUpdateResult) {
      onUpdateResult(updated);
    }
    setIsPicking(false);

    if (scanSessionId) {
      await scanSaveService.applyManualCorrections(scanSessionId, updated);
    }
  };

  const handleRetry = () => {
    if (scanSessionId) {
      scanSaveService.retrySave(scanSessionId);
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
    <div style={{ paddingBottom: "calc(112px + env(safe-area-inset-bottom, 0px))" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", margin: "0 0 1rem 0" }}>
        Care Instructions
      </h2>

      {result.lowConfidenceWarning && (
        <div
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "rgba(224, 184, 100, 0.15)",
            border: "1px solid var(--color-accent-secondary)",
            color: "var(--color-accent-secondary)",
            borderRadius: "6px",
            fontFamily: MONOSPACE_FONT,
          }}
        >
          <strong>Notice:</strong> Some detections were uncertain. Please double check
          the garment tag manually.
        </div>
      )}

      {result.instructions.length > 0 ? (
        <ul style={{ fontFamily: MONOSPACE_FONT, paddingLeft: "1.25rem", margin: "0 0 1.5rem 0" }}>
          {result.instructions.map((instruction, index) => (
            <li key={index} style={{ marginBottom: "0.75rem", lineHeight: 1.5 }}>
              {instruction}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontFamily: MONOSPACE_FONT, margin: "0 0 1.5rem 0" }}>
          No care instructions detected.
        </p>
      )}

      {onUpdateResult && (
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => setIsPicking(true)}
            style={{
              padding: "0.4rem 0.8rem",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-accent)",
              border: "1px solid rgba(124, 143, 224, 0.3)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Symbol looks wrong? Pick manually
          </button>
        </div>
      )}

      {/* Quiet status line for background auto-save */}
      {saveState && (
        <div className="results-status-line">
          {saveState.status === "saving" && <span>Saving…</span>}
          {saveState.status === "saved" && <span>Saved to gallery</span>}
          {saveState.status === "error" && (
            <>
              <span style={{ color: "var(--color-caution)" }}>Couldn't save</span>
              <button
                type="button"
                onClick={handleRetry}
                className="results-retry-btn"
              >
                Retry
              </button>
            </>
          )}
        </div>
      )}

      {/* Two fixed bottom pills: Done (ghost) & Scan another (tonal) */}
      {(onDone || onScanAnother) && (
        <div className="results-bottom-bar">
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="camera-retake-btn"
            >
              Done
            </button>
          )}
          {onScanAnother && (
            <button
              type="button"
              onClick={onScanAnother}
              className="camera-next-btn"
            >
              Scan another
            </button>
          )}
        </div>
      )}
    </div>
  );
}
