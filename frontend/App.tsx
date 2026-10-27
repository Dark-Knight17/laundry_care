import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ScanResult } from "../shared/types.ts";
import { Auth } from "./components/Auth.tsx";
import { CaptureFlow } from "./components/CaptureFlow.tsx";
import { ResultsDisplay } from "./components/ResultsDisplay.tsx";
import { supabase } from "./services/supabaseClient.ts";

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null);
  const [tagBlob, setTagBlob] = useState<Blob | null>(null);
  const [tagImageUrl, setTagImageUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
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
  };

  const handleReset = () => {
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

  const handleSignOut = async () => {
    handleReset();
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
      <div>
        <h1 style={{ textAlign: "center" }}>Laundry Tag Scanner</h1>
        <Auth />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          maxWidth: "480px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Laundry Tag Scanner</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {session.user.email && (
            <span style={{ fontSize: "0.85rem", color: "#666" }}>
              {session.user.email}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
          >
            Sign out
          </button>
        </div>
      </div>

      {scanResult ? (
        <div>
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
            onReset={handleReset}
            onUpdateResult={setScanResult}
          />
        </div>
      ) : (
        <CaptureFlow onScanComplete={handleScanComplete} />
      )}
    </div>
  );
}
