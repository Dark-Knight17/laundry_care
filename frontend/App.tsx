import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ScanResult } from "../shared/types.ts";
import { Auth } from "./components/Auth.tsx";
import { CaptureFlow } from "./components/CaptureFlow.tsx";
import { GalleryView } from "./components/GalleryView.tsx";
import { ResultsDisplay } from "./components/ResultsDisplay.tsx";
import { fetchSavedScans, type SavedScan } from "./services/api.ts";
import { supabase } from "./services/supabaseClient.ts";

type AppMode = "gallery" | "capture" | "results" | "saved_detail";

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [mode, setMode] = useState<AppMode>("gallery");
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [isScansLoading, setIsScansLoading] = useState<boolean>(false);
  const [selectedSavedScan, setSelectedSavedScan] = useState<SavedScan | null>(
    null
  );

  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null);
  const [tagBlob, setTagBlob] = useState<Blob | null>(null);
  const [tagImageUrl, setTagImageUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const loadScans = async (token?: string) => {
    setIsScansLoading(true);
    try {
      const scans = await fetchSavedScans(token);
      setSavedScans(scans);
    } catch (err) {
      console.error("Failed to load saved scans:", err);
    } finally {
      setIsScansLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setIsAuthLoading(false);
      if (existingSession) {
        loadScans(existingSession.access_token);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        loadScans(currentSession.access_token);
      } else {
        setSavedScans([]);
        setMode("gallery");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleScanComplete = (
    result: ScanResult,
    capturedGarmentBlob: Blob,
    capturedGarmentUrl: string,
    capturedTagBlob: Blob,
    capturedTagUrl: string
  ) => {
    setGarmentBlob(capturedGarmentBlob);
    setGarmentImageUrl(capturedGarmentUrl);
    setTagBlob(capturedTagBlob);
    setTagImageUrl(capturedTagUrl);
    setScanResult(result);
    setMode("results");
  };

  const handleResetScan = () => {
    if (garmentImageUrl) {
      URL.revokeObjectURL(garmentImageUrl);
    }
    if (tagImageUrl) {
      URL.revokeObjectURL(tagImageUrl);
    }
    setGarmentBlob(null);
    setGarmentImageUrl(null);
    setTagBlob(null);
    setTagImageUrl(null);
    setScanResult(null);
  };

  const handleStartCapture = () => {
    handleResetScan();
    setSelectedSavedScan(null);
    setMode("capture");
  };

  const handleSaveSuccess = (savedRecord: SavedScan) => {
    handleResetScan();
    setSavedScans((prev) => [
      savedRecord,
      ...prev.filter((s) => s.id !== savedRecord.id),
    ]);
    setMode("gallery");
  };

  const handleSignOut = async () => {
    handleResetScan();
    setSelectedSavedScan(null);
    setMode("gallery");
    await supabase.auth.signOut();
  };

  if (isAuthLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          maxWidth: "440px",
          margin: "0 auto",
          padding: "3rem 1.5rem",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontFamily: "var(--font-heading)",
            fontSize: "2.1rem",
            fontWeight: "normal",
            color: "var(--color-accent)",
            margin: "0 0 1.5rem 0",
            letterSpacing: "-0.01em",
          }}
        >
          Laundry Tag Scanner
        </h1>
        <Auth />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1rem 0.85rem 1rem",
          borderBottom: "1px solid rgba(42, 36, 32, 0.08)",
          backgroundColor: "var(--color-bg)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-heading)",
            fontSize: "1.55rem",
            fontWeight: "normal",
            color: "var(--color-accent)",
            letterSpacing: "-0.01em",
          }}
        >
          Laundry Tag Scanner
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {session.user.email && (
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text)",
                opacity: 0.65,
                fontFamily: "var(--font-sans)",
              }}
            >
              {session.user.email}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              padding: "0.3rem 0.65rem",
              fontSize: "0.8rem",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              background: "transparent",
              color: "var(--color-text)",
              border: "1px solid rgba(42, 36, 32, 0.2)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {mode === "gallery" && (
        <main style={{ flex: 1 }}>
          <GalleryView
            scans={savedScans}
            isLoading={isScansLoading}
            onSelectScan={(scan) => {
              setSelectedSavedScan(scan);
              setMode("saved_detail");
            }}
            onStartScan={handleStartCapture}
          />
        </main>
      )}

      {mode === "capture" && (
        <main style={{ flex: 1, padding: "1rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <button
              type="button"
              onClick={() => {
                handleResetScan();
                setMode("gallery");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-accent)",
                padding: 0,
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              ← Back to Gallery
            </button>
          </div>
          <CaptureFlow onScanComplete={handleScanComplete} />
        </main>
      )}

      {mode === "results" && scanResult && (
        <main style={{ flex: 1, padding: "1rem" }}>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            {garmentImageUrl && (
              <div>
                <p style={{ margin: "0 0 0.25rem 0", fontWeight: "bold" }}>
                  Garment
                </p>
                <img
                  src={garmentImageUrl}
                  alt="Captured garment"
                  style={{
                    width: "200px",
                    display: "block",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
            )}
            {tagImageUrl && (
              <div>
                <p style={{ margin: "0 0 0.25rem 0", fontWeight: "bold" }}>
                  Care Tag
                </p>
                <img
                  src={tagImageUrl}
                  alt="Captured care tag"
                  style={{
                    width: "200px",
                    display: "block",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
            )}
          </div>

          <ResultsDisplay
            result={scanResult}
            garmentBlob={garmentBlob}
            onReset={handleStartCapture}
            onUpdateResult={setScanResult}
            onSaveSuccess={handleSaveSuccess}
          />
        </main>
      )}

      {mode === "saved_detail" && selectedSavedScan && (
        <main style={{ flex: 1, padding: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={() => {
                setSelectedSavedScan(null);
                setMode("gallery");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-accent)",
                padding: 0,
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
                marginBottom: "0.5rem",
              }}
            >
              ← Back to Gallery
            </button>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <img
              src={selectedSavedScan.garment_photo_url}
              alt="Saved garment"
              style={{
                width: "200px",
                maxHeight: "260px",
                objectFit: "cover",
                display: "block",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>

          <ResultsDisplay
            result={{
              detected: selectedSavedScan.detected_symbols || [],
              instructions: selectedSavedScan.instructions || [],
              lowConfidenceWarning: false,
            }}
            onReset={() => {
              setSelectedSavedScan(null);
              setMode("gallery");
            }}
            resetLabel="Back to gallery"
          />
        </main>
      )}
    </div>
  );
}
