import React, { useState } from "react";
import { CARE_SYMBOLS } from "../../shared/symbols.ts";
import type { CareSymbol } from "../../shared/types.ts";

interface ManualSymbolPickerProps {
  initialSelectedIds: string[];
  onApply: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export function ManualSymbolPicker({
  initialSelectedIds,
  onApply,
  onCancel,
}: ManualSymbolPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const toggleSymbol = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = ["wash", "bleach", "dry", "iron", "dryclean"] as const;

  const categoryLabels: Record<string, string> = {
    wash: "Washing",
    bleach: "Bleaching",
    dry: "Drying",
    iron: "Ironing",
    dryclean: "Professional Care",
  };

  return (
    <div>
      <h2>Select Symbols Manually</h2>
      <p>Select all symbols shown on your garment care tag:</p>

      {categories.map((category) => {
        const categorySymbols = CARE_SYMBOLS.filter(
          (sym: CareSymbol) => sym.category === category
        );

        return (
          <div key={category} style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ textTransform: "capitalize", marginBottom: "0.5rem" }}>
              {categoryLabels[category] || category}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.5rem",
              }}
            >
              {categorySymbols.map((sym: CareSymbol) => {
                const isChecked = selectedIds.includes(sym.id);
                return (
                  <label
                    key={sym.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      padding: "0.5rem",
                      border: isChecked ? "2px solid #0066cc" : "1px solid #ccc",
                      borderRadius: "4px",
                      backgroundColor: isChecked ? "#e6f2ff" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSymbol(sym.id)}
                      style={{ marginRight: "0.5rem", marginTop: "0.25rem" }}
                    />
                    <div>
                      <strong>{sym.label}</strong>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        {sym.instruction}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button
          type="button"
          onClick={() => onApply(selectedIds)}
          style={{ padding: "0.5rem 1rem" }}
        >
          Apply Selection
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "0.5rem 1rem" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
