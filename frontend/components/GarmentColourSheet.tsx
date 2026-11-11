import React, { useEffect, useRef, useState } from "react";
import { COLOURS } from "../../shared/colours.ts";
import type { ColourId, ColourInput, DetectedColour, GarmentPattern } from "../../shared/types.ts";
import { Modal } from "./Modal.tsx";

export const MULTICOLOUR_GRADIENT =
  "conic-gradient(#D62828, #F77F00, #FFD60A, #2DC653, #1F4FD8, #7B2CBF, #D62828)";

export const PATTERNS: { id: GarmentPattern; label: string }[] = [
  { id: "solid", label: "Plain" },
  { id: "patterned", label: "Patterned" },
  { id: "graphic_print", label: "Print or logo" },
];

export interface GarmentColourSheetProps {
  open: boolean;
  initialColour?: DetectedColour | null;
  onApply: (colour: ColourInput) => void;
  onClose: () => void;
}

export function GarmentColourSheet({
  open,
  initialColour,
  onApply,
  onClose,
}: GarmentColourSheetProps) {
  const [selectedColourId, setSelectedColourId] = useState<ColourId | null>(
    () => initialColour?.colourId ?? null
  );
  const [selectedPattern, setSelectedPattern] = useState<GarmentPattern>(
    () => initialColour?.pattern ?? "solid"
  );

  const selectedRadioRef = useRef<HTMLInputElement>(null);
  const firstRadioRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedColourId(initialColour?.colourId ?? null);
      setSelectedPattern(initialColour?.pattern ?? "solid");
    }
  }, [open, initialColour]);

  const handleApply = () => {
    if (!selectedColourId) return;
    onApply({
      colourId: selectedColourId,
      pattern: selectedPattern,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      role="dialog"
      ariaLabelledBy="garment-colour-sheet-title"
      backdropClassName="bottom-sheet-backdrop"
      contentClassName="bottom-sheet-content"
      initialFocusRef={selectedColourId ? selectedRadioRef : firstRadioRef}
    >
      <h2 id="garment-colour-sheet-title" className="bottom-sheet-title">
        Garment colour
      </h2>

      {/* Grid of 16 colours */}
      <div
        role="radiogroup"
        aria-label="Garment colour"
        className="colour-grid"
      >
        {COLOURS.map((col, index) => {
          const isSelected = selectedColourId === col.id;
          const isMulticolour = col.id === "multicolour";

          return (
            <label
              key={col.id}
              className={`colour-tile ${isSelected ? "selected" : ""}`}
            >
              <input
                ref={
                  isSelected
                    ? selectedRadioRef
                    : index === 0
                    ? firstRadioRef
                    : undefined
                }
                type="radio"
                name="garment-colour"
                value={col.id}
                checked={isSelected}
                onChange={() => setSelectedColourId(col.id)}
                className="colour-radio-input"
              />
              <span
                className="colour-swatch"
                style={
                  isMulticolour
                    ? { background: MULTICOLOUR_GRADIENT }
                    : { backgroundColor: col.hex ?? "#ffffff" }
                }
              />
              <span className="colour-tile-label">{col.label}</span>
            </label>
          );
        })}
      </div>

      {/* Pattern group */}
      <div className="pattern-section">
        <div className="pattern-label" id="garment-pattern-group-label">
          Pattern
        </div>
        <div
          role="radiogroup"
          aria-labelledby="garment-pattern-group-label"
          className="pattern-pills"
        >
          {PATTERNS.map((p) => {
            const isSelected = selectedPattern === p.id;
            return (
              <label
                key={p.id}
                className={`pattern-pill ${isSelected ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="garment-pattern"
                  value={p.id}
                  checked={isSelected}
                  onChange={() => setSelectedPattern(p.id)}
                  className="colour-radio-input"
                />
                <span>{p.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="bottom-sheet-actions">
        <button
          type="button"
          onClick={onClose}
          className="bottom-sheet-btn bottom-sheet-btn-cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={!selectedColourId}
          className="bottom-sheet-btn bottom-sheet-btn-apply"
        >
          Apply
        </button>
      </div>
    </Modal>
  );
}
