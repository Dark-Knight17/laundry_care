import React, { useState } from "react";
import { CARE_SYMBOLS } from "../../shared/symbols.ts";
import type { SymbolCategory } from "../../shared/types.ts";

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
          <div key={key} style={{ marginBottom: "1rem" }}>
            <h4>{title}</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.35rem 0.65rem",
                  border: `1px solid ${
                    currentSelection === null
                      ? "var(--color-accent)"
                      : "rgba(212, 212, 212, 0.2)"
                  }`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor:
                    currentSelection === null
                      ? "var(--color-surface)"
                      : "transparent",
                  color:
                    currentSelection === null
                      ? "var(--color-accent)"
                      : "var(--color-text)",
                }}
              >
                <input
                  type="radio"
                  name={`category-${key}`}
                  value=""
                  checked={currentSelection === null}
                  onChange={() => handleSelect(key, null)}
                />
                None
              </label>

              {symbols.map((symbol) => {
                const isSelected = currentSelection === symbol.id;
                return (
                  <label
                    key={symbol.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.35rem 0.65rem",
                      border: `1px solid ${
                        isSelected
                          ? "var(--color-accent)"
                          : "rgba(212, 212, 212, 0.2)"
                      }`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: isSelected
                        ? "var(--color-surface)"
                        : "transparent",
                      color: isSelected
                        ? "var(--color-accent)"
                        : "var(--color-text)",
                    }}
                  >
                    <input
                      type="radio"
                      name={`category-${key}`}
                      value={symbol.id}
                      checked={isSelected}
                      onChange={() => handleSelect(key, symbol.id)}
                    />
                    {symbol.label}
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
            backgroundColor: "var(--color-accent)",
            color: "var(--color-bg)",
            fontWeight: 600,
            border: "none",
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
            border: "1px solid rgba(212, 212, 212, 0.2)",
            borderRadius: "6px",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
