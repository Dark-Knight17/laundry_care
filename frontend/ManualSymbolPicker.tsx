import React, { useState } from "react";
import { CARE_SYMBOLS } from "../shared/symbols.ts";
import type { SymbolCategory } from "../shared/types.ts";

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
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    onApply(selectedIds);
  };

  return (
    <div>
      <h3>Pick Symbols Manually</h3>
      <p>Select the symbols that match your garment care tag:</p>

      {CATEGORIES.map(({ key, title }) => {
        const symbols = CARE_SYMBOLS.filter((s) => s.category === key);
        return (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <h4>{title}</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {symbols.map((symbol) => {
                const isSelected = selectedIds.includes(symbol.id);
                return (
                  <label
                    key={symbol.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.25rem 0.5rem",
                      border: "1px solid #ccc",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#eee" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(symbol.id)}
                    />
                    {symbol.label}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <button type="button" onClick={handleApply}>
          Apply
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
