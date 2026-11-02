import React from "react";
import { CARE_SYMBOLS } from "../../shared/symbols.ts";
import { SymbolIcon } from "./SymbolIcon.tsx";

export function IconSheet() {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem 1.5rem",
        fontFamily: "var(--font-sans)",
        color: "var(--color-text)",
        backgroundColor: "var(--color-bg)",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "2rem",
            margin: "0 0 0.5rem 0",
          }}
        >
          Care Symbol Icons Review Sheet
        </h1>
        <p style={{ margin: 0, opacity: 0.75, fontSize: "0.95rem" }}>
          Visual review of all ISO 3758 care symbols at 44px and 96px.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {CARE_SYMBOLS.map((symbol) => (
          <div
            key={symbol.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              padding: "1rem",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
            }}
          >
            {/* 44px Icon tile */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--color-surface-raised)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                }}
              >
                <SymbolIcon symbolId={symbol.id} size={44} />
              </div>
              <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>44px</span>
            </div>

            {/* 96px Icon tile */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <div
                style={{
                  width: "112px",
                  height: "112px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--color-surface-raised)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "14px",
                }}
              >
                <SymbolIcon symbolId={symbol.id} size={96} />
              </div>
              <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>96px</span>
            </div>

            {/* Symbol metadata */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-accent)",
                  marginBottom: "0.25rem",
                }}
              >
                {symbol.id}
              </div>
              <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.35rem" }}>
                {symbol.label}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.75,
                  lineHeight: 1.4,
                  textTransform: "capitalize",
                }}
              >
                Category: {symbol.category.replace("_", " ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
