import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getDebugLogs,
  isDebugEnabled,
  subscribeDebugLogs,
} from "../lib/debugHistory.ts";
import { getCurrentScanStep, useRoute } from "../lib/navigation.ts";

export function DebugOverlay() {
  if (!isDebugEnabled()) {
    return null;
  }

  const logs = useSyncExternalStore(subscribeDebugLogs, getDebugLogs, () => []);
  const route = useRoute();
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scanStep = getCurrentScanStep();

  // Auto-scroll to newest entry at bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs.length]);

  const historyLength = typeof window !== "undefined" ? window.history.length : 0;
  const historyState =
    typeof window !== "undefined" ? JSON.stringify(window.history.state) : "null";

  const handleCopy = async () => {
    const header =
      `--- DEBUG LOG (${new Date().toISOString()}) ---\n` +
      `history.length: ${historyLength}\n` +
      `history.state: ${historyState}\n` +
      `route: ${JSON.stringify(route)}\n` +
      `scanStep: ${scanStep || "null"}\n\n`;

    const body = logs
      .map((entry) => {
        let line = `[${entry.time}] ${entry.type} ${entry.details}`;
        if (entry.userActivation) {
          line += ` | userActivation={active:${entry.userActivation.isActive}, beenActive:${entry.userActivation.hasBeenActive}}`;
        }
        if (entry.stackHint) {
          line += `\n    at ${entry.stackHint}`;
        }
        return line;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(header + body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy debug log:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "40vh",
        backgroundColor: "rgba(10, 15, 20, 0.92)",
        color: "#e2e8f0",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "11px",
        lineHeight: "1.35",
        zIndex: 99999,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
      }}
    >
      {/* Top Status Bar with live metrics and Copy button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 8px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            marginRight: "8px",
          }}
        >
          <span style={{ color: "#38bdf8", fontWeight: "bold" }}>[DEBUG]</span>{" "}
          <span>len: {historyLength}</span> | <span>state: {historyState}</span> |{" "}
          <span>route: {JSON.stringify(route.screen)}</span> |{" "}
          <span>step: {scanStep || "n/a"}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            pointerEvents: "auto",
            background: copied ? "#22c55e" : "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "3px 8px",
            fontSize: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {copied ? "Copied!" : "Copy log"}
        </button>
      </div>

      {/* Log Entries Container */}
      <div
        ref={scrollContainerRef}
        style={{
          overflowY: "auto",
          padding: "6px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
            No history events recorded yet
          </div>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} style={{ wordBreak: "break-all" }}>
              <span style={{ color: "#94a3b8" }}>{entry.time}</span>{" "}
              <span
                style={{
                  color:
                    entry.type === "pushState"
                      ? "#4ade80"
                      : entry.type === "replaceState"
                      ? "#fbbf24"
                      : entry.type === "popstate"
                      ? "#f472b6"
                      : entry.type === "back"
                      ? "#a78bfa"
                      : "#38bdf8",
                  fontWeight: "bold",
                }}
              >
                {entry.type}
              </span>{" "}
              <span>{entry.details}</span>
              {entry.userActivation && (
                <span
                  style={{
                    color: entry.userActivation.isActive ? "#4ade80" : "#f87171",
                    marginLeft: "6px",
                  }}
                >
                  [ua: {entry.userActivation.isActive ? "active" : "inactive"}]
                </span>
              )}
              {entry.stackHint && (
                <div style={{ color: "#64748b", fontSize: "10px", marginLeft: "12px" }}>
                  ↳ {entry.stackHint}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
