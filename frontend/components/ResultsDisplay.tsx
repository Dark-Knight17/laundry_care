import React, { useEffect, useState } from "react";
import { MONOSPACE_FONT } from "../config.ts";
import { resolveSymbolsToScanResult } from "../lib/resolution.ts";
import { closeOverlay, openOverlay, useRoute } from "../lib/navigation.ts";
import { scanSaveService, type ActiveSaveState } from "../services/scanSaveService.ts";
import type {
  ScanResult,
  CareSymbol,
  ColourInput,
  DetectedColour,
  GarmentPattern,
} from "../../shared/types.ts";
import { getSymbolById } from "../../shared/symbols.ts";
import { buildColourCare, resolveInstructions } from "../../shared/colourCare.ts";
import { getColourById } from "../../shared/colours.ts";
import { colourViewState, confirmedColour } from "../lib/colourView.ts";
import { updateScan } from "../services/api.ts";
import {
  GarmentColourSheet,
  MULTICOLOUR_GRADIENT,
} from "./GarmentColourSheet.tsx";
import { ManualSymbolPicker } from "./ManualSymbolPicker.tsx";
import { SymbolIcon } from "./SymbolIcon.tsx";

function formatPattern(pattern: GarmentPattern): string {
  switch (pattern) {
    case "solid":
      return "Plain";
    case "patterned":
      return "Patterned";
    case "graphic_print":
      return "Print or logo";
  }
}

interface ResultsDisplayProps {
  result: ScanResult;
  scanSessionId?: string;
  savedScanId?: string;
  onDone?: () => void;
  onScanAnother?: () => void;
  onUpdateResult?: (updated: ScanResult) => void;
}

export function ResultsDisplay({
  result,
  scanSessionId,
  savedScanId,
  onDone,
  onScanAnother,
  onUpdateResult,
}: ResultsDisplayProps) {
  const route = useRoute();
  const isPicking = route.overlay === "picker";
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
    closeOverlay();
    const updated = resolveSymbolsToScanResult(selectedIds);
    const updatedWithColour: ScanResult = {
      ...updated,
      colour: result.colour,
    };
    if (onUpdateResult) {
      onUpdateResult(updatedWithColour);
    }

    if (savedScanId) {
      try {
        const refreshed = await updateScan(savedScanId, { symbolIds: selectedIds });
        onUpdateResult?.({
          ...updatedWithColour,
          detected: refreshed.detected_symbols,
          instructions: refreshed.instructions,
          colour: refreshed.colour,
        });
      } catch (err) {
        console.error("Failed to update saved scan symbols:", err);
      }
    } else if (scanSessionId) {
      await scanSaveService.applyManualCorrections(scanSessionId, updatedWithColour);
    }
  };

  const handleConfirmOrChangeColour = async (colourInput: ColourInput) => {
    const confirmed: DetectedColour = {
      ...colourInput,
      confidence: "high",
    };
    const updatedWithColour: ScanResult = {
      ...result,
      colour: confirmed,
    };
    if (onUpdateResult) {
      onUpdateResult(updatedWithColour);
    }

    if (savedScanId) {
      try {
        const refreshed = await updateScan(savedScanId, { colour: colourInput });
        onUpdateResult?.({
          ...updatedWithColour,
          detected: refreshed.detected_symbols,
          instructions: refreshed.instructions,
          colour: refreshed.colour,
        });
      } catch (err) {
        console.error("Failed to update saved scan colour:", err);
      }
    } else if (scanSessionId) {
      await scanSaveService.applyColourCorrection(scanSessionId, confirmed);
    }
  };

  const handleRetry = () => {
    if (scanSessionId) {
      scanSaveService.retrySave(scanSessionId);
    }
  };

  const confidenceMap = new Map<string, "high" | "medium" | "low" | undefined>();
  for (const item of (result.detected || [])) {
    const symbolId = typeof item === "string" ? item : item?.symbolId;
    const confidence = typeof item === "string" ? undefined : item?.confidence;
    if (symbolId) {
      confidenceMap.set(symbolId, confidence);
    }
  }

  const symbolIds = (result.detected || []).map((d) =>
    typeof d === "string" ? d : d.symbolId
  );

  const colourState = colourViewState({
    colour: result.colour,
    symbolIds,
  });

  const resolved = resolveInstructions({
    symbolIds,
    colour: confirmedColour(result.colour),
  });

  interface DisplayRow {
    symbol: CareSymbol;
    instructionText: string;
    confidence?: "high" | "medium" | "low";
  }

  const rows: DisplayRow[] = [];
  for (const res of resolved) {
    const symbol = getSymbolById(res.symbolId);
    if (!symbol) {
      console.warn(`ResultsDisplay: symbolId not found "${res.symbolId}"`);
      continue;
    }
    rows.push({
      symbol,
      instructionText: res.text,
      confidence: confidenceMap.get(res.symbolId),
    });
  }

  if (isPicking) {
    return (
      <ManualSymbolPicker
        initialSelectedIds={result.detected.map((d) => d.symbolId)}
        onApply={handleApplyManual}
        onCancel={closeOverlay}
      />
    );
  }

  const hasBottomBar = Boolean(onDone || onScanAnother);

  return (
    <div
      style={{
        paddingBottom: hasBottomBar
          ? "calc(112px + env(safe-area-inset-bottom, 0px))"
          : 0,
      }}
    >
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

      {rows.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "0 0 1.5rem 0" }}>
          {rows.map(({ symbol, instructionText, confidence }) => {
            const isLow = confidence === "low";
            return (
              <div
                key={symbol.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                {/* 56px square tile */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    minWidth: "56px",
                    minHeight: "56px",
                    flexShrink: 0,
                    backgroundColor: "var(--color-surface)",
                    border: `1px solid ${isLow ? "var(--color-caution)" : "var(--color-border)"}`,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SymbolIcon symbolId={symbol.id} size={40} />
                </div>

                {/* Instruction text */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div
                    style={{
                      fontFamily: MONOSPACE_FONT,
                      lineHeight: 1.5,
                      color: "var(--color-text)",
                    }}
                  >
                    {instructionText}
                  </div>
                  {isLow && (
                    <div
                      style={{
                        fontFamily: MONOSPACE_FONT,
                        fontSize: "0.85rem",
                        color: "var(--color-caution)",
                        marginTop: "0.25rem",
                      }}
                    >
                      Check this one against your tag
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontFamily: MONOSPACE_FONT, margin: "0 0 1.5rem 0" }}>
          No care instructions detected.
        </p>
      )}

      {onUpdateResult && (
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => openOverlay("picker")}
            style={{
              padding: "0.4rem 0.8rem",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-accent)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Symbol looks wrong? Pick manually
          </button>
        </div>
      )}

      {/* Colour care section */}
      {colourState === "missing" && (
        <div className="colour-care-section">
          <div className="colour-care-missing">
            <p className="colour-care-missing-text">
              Add this garment's colour for colour care tips.
            </p>
            <button
              type="button"
              onClick={() => openOverlay("colour")}
              className="colour-care-pill-btn colour-care-pill-btn-ghost"
            >
              Choose colour
            </button>
          </div>
        </div>
      )}

      {colourState === "confirm" && result.colour && (
        <div className="colour-care-section">
          <div className="colour-care-confirm">
            <p className="colour-care-confirm-question">
              {`Is this garment ${(
                getColourById(result.colour.colourId)?.label ??
                result.colour.colourId
              ).toLowerCase()}?`}
            </p>
            <div className="colour-care-confirm-actions">
              <button
                type="button"
                onClick={() =>
                  handleConfirmOrChangeColour({
                    colourId: result.colour!.colourId,
                    pattern: result.colour!.pattern,
                  })
                }
                className="colour-care-pill-btn colour-care-pill-btn-tonal"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => openOverlay("colour")}
                className="colour-care-pill-btn colour-care-pill-btn-ghost"
              >
                No, choose another
              </button>
            </div>
          </div>
        </div>
      )}

      {colourState === "ready" && (() => {
        const confirmed = confirmedColour(result.colour);
        if (!confirmed) return null;
        const colourInfo = getColourById(confirmed.colourId);
        const care = buildColourCare({ colour: confirmed, symbolIds });
        if (!care) return null;

        const isMulticolour = confirmed.colourId === "multicolour";

        return (
          <div className="colour-care-section">
            <div className="colour-care-ready-header">
              <div className="colour-care-ready-summary">
                <span
                  className="colour-care-dot"
                  style={
                    isMulticolour
                      ? { background: MULTICOLOUR_GRADIENT }
                      : { backgroundColor: colourInfo?.hex ?? "#ffffff" }
                  }
                />
                <span className="colour-care-ready-title">
                  {`${colourInfo?.label ?? confirmed.colourId} · ${formatPattern(confirmed.pattern)}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openOverlay("colour")}
                className="colour-care-change-btn"
              >
                Change
              </button>
            </div>

            <div className="colour-care-item">
              <div className="colour-care-label">Inside out</div>
              <div className="colour-care-text">{care.insideOut.text}</div>
            </div>

            <div className="colour-care-item">
              <div className="colour-care-label">Wash with</div>
              <div className="colour-care-text">{care.washWith.text}</div>
              {care.washWith.examples.length > 0 && (
                <div className="colour-care-chips">
                  {care.washWith.examples.map((example) => (
                    <span key={example.name} className="colour-care-chip">
                      {example.hex && (
                        <span
                          className="colour-care-chip-dot"
                          style={{ backgroundColor: example.hex }}
                        />
                      )}
                      <span>{example.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {care.drying !== null && (
              <div className="colour-care-item">
                <div className="colour-care-label">Drying</div>
                <div className="colour-care-text">{care.drying.text}</div>
              </div>
            )}
          </div>
        );
      })()}

      <GarmentColourSheet
        open={route.overlay === "colour"}
        initialColour={result.colour}
        onApply={handleConfirmOrChangeColour}
        onClose={closeOverlay}
      />

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
