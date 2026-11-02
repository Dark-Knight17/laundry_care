import React, { useState } from "react";
import { CARE_SYMBOLS } from "../../shared/symbols.ts";
import type { SymbolCategory } from "../../shared/types.ts";
import { SymbolIcon } from "./SymbolIcon.tsx";

interface ManualSymbolPickerProps {
  initialSelectedIds: string[];
  onApply: (selectedIds: string[]) => void;
  onCancel: () => void;
}

const CATEGORIES: { key: SymbolCategory; title: string }[] = [
  { key: "wash", title: "Wash" },
  { key: "bleach", title: "Bleach" },
  { key: "dry", title: "Dry" },
  { key: "iron", title: "Iron" },
  { key: "professional_care", title: "Professional Care" },
];

export function ManualSymbolPicker({
  initialSelectedIds,
  onApply,
  onCancel,
}: ManualSymbolPickerProps) {
  const [selections, setSelections] = useState<
    Record<SymbolCategory, string | null>
  >(() => {
    const initial: Record<SymbolCategory, string | null> = {
      wash: null,
      bleach: null,
      dry: null,
      iron: null,
      professional_care: null,
    };
    for (const id of initialSelectedIds) {
      const symbol = CARE_SYMBOLS.find((s) => s.id === id);
      if (symbol && !initial[symbol.category]) {
        initial[symbol.category] = symbol.id;
      }
    }
    return initial;
  });

  const handleSelect = (category: SymbolCategory, symbolId: string | null) => {
    setSelections((prev) => ({
      ...prev,
      [category]: symbolId,
    }));
  };

  const handleApply = () => {
    const selectedIds = Object.values(selections).filter(
      (id): id is string => id !== null
    );
    onApply(selectedIds);
  };

  return (
    <div>
      <h3>Pick Symbols Manually</h3>
      <p>Select one symbol per category (or None):</p>

      {CATEGORIES.map(({ key, title }) => {
        const symbols = CARE_SYMBOLS.filter((s) => s.category === key);
        const currentSelection = selections[key];

        return (
          <div key={key} style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "var(--color-text)" }}>
              {title}
            </h4>
            <div className="picker-grid">
              <label
                className={`picker-tile${currentSelection === null ? " picker-tile-selected" : ""}`}
              >
                <input
                  type="radio"
                  name={`category-${key}`}
                  value=""
                  checked={currentSelection === null}
                  onChange={() => handleSelect(key, null)}
                  className="picker-radio-hidden"
                />
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.75rem",
                    fontWeight: 300,
                    color: "var(--color-text)",
                    opacity: 0.6,
                  }}
                  aria-hidden="true"
                >
                  —
                </div>
                <span
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    lineHeight: 1.3,
                    fontWeight: currentSelection === null ? 600 : 400,
                  }}
                >
                  None
                </span>
              </label>

              {symbols.map((symbol) => {
                const isSelected = currentSelection === symbol.id;
                return (
                  <label
                    key={symbol.id}
                    className={`picker-tile${isSelected ? " picker-tile-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`category-${key}`}
                      value={symbol.id}
                      checked={isSelected}
                      onChange={() => handleSelect(key, symbol.id)}
                      className="picker-radio-hidden"
                    />
                    <SymbolIcon symbolId={symbol.id} size={44} />
                    <span
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.8rem",
                        lineHeight: 1.3,
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {symbol.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={handleApply}
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            fontWeight: 600,
            borderRadius: "6px",
          }}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
