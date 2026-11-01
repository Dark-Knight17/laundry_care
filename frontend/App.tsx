import React, { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ScanResult } from "../shared/types.ts";
import { Auth } from "./components/Auth.tsx";
import { Avatar } from "./components/Avatar.tsx";
import { AccountCard } from "./components/AccountCard.tsx";
import { CaptureFlow } from "./components/CaptureFlow.tsx";
import { GalleryView } from "./components/GalleryView.tsx";
import { ResultsDisplay } from "./components/ResultsDisplay.tsx";
import { getUserProfile } from "./lib/userProfile.ts";
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

  const [isAccountCardOpen, setIsAccountCardOpen] = useState<boolean>(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState<boolean>(true);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (mode !== "gallery") {
      setIsTopBarVisible(true);
      return;
    }

    let lastY = Math.max(0, window.scrollY);
    let lastScrollY = lastY;
    let rafId: number | null = null;
    const SCROLL_THRESHOLD = 8;

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const currentY = Math.max(0, window.scrollY);

        // At the top of the page (scroll position near 0), the bar is always visible
        if (currentY <= 10) {
          setIsTopBarVisible(true);
          lastY = currentY;
          lastScrollY = currentY;
          return;
        }

        const frameDelta = currentY - lastScrollY;
        if (frameDelta > 0 && lastY > lastScrollY) {
          // Changed direction from scrolling up to scrolling down
          lastY = lastScrollY;
        } else if (frameDelta < 0 && lastY < lastScrollY) {
          // Changed direction from scrolling down to scrolling up
          lastY = lastScrollY;
        }
        lastScrollY = currentY;

        const diff = currentY - lastY;
        if (diff >= SCROLL_THRESHOLD) {
          setIsTopBarVisible(false);
          setIsAccountCardOpen(false);
          lastY = currentY;
        } else if (diff <= -SCROLL_THRESHOLD) {
          setIsTopBarVisible(true);
          lastY = currentY;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [mode]);

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
    setIsAccountCardOpen(false);
    handleResetScan();
    setSelectedSavedScan(null);
    setMode("gallery");
    await supabase.auth.signOut();
  };

  const userProfile = getUserProfile(session?.user);
  const isBarHidden =
    mode === "gallery" && !isTopBarVisible && !isAccountCardOpen;

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
          padding: "3rem var(--spacing-screen-edge)",
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
            color: "var(--color-text)",
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
        paddingLeft: "var(--spacing-screen-edge)",
        paddingRight: "var(--spacing-screen-edge)",
        paddingTop:
          "calc(var(--top-bar-height) + env(safe-area-inset-top, 0px) + var(--spacing-screen-edge))",
      }}
    >
      {/* Fixed top bar with Google Photos layout and user avatar */}
      <header className={`top-bar-fixed${isBarHidden ? " top-bar-hidden" : ""}`}>
        <div className="top-bar-inner">
          <h1 className="top-bar-wordmark">Laundry Tag Scanner</h1>
          <button
            ref={avatarButtonRef}
            type="button"
            onClick={() => {
              setIsTopBarVisible(true);
              setIsAccountCardOpen((prev) => !prev);
            }}
            className="account-avatar-btn"
            aria-label={
              userProfile.fullName
                ? `${userProfile.fullName} - Account details`
                : `${userProfile.email} - Account details`
            }
            aria-haspopup="dialog"
            aria-expanded={isAccountCardOpen}
            title={userProfile.fullName || userProfile.email}
          >
            <Avatar
              imageUrl={userProfile.avatarUrl}
              firstName={userProfile.firstName}
              lastName={userProfile.lastName}
              email={userProfile.email}
              size={32}
            />
          </button>

          {/* Account card anchored under avatar button */}
          <AccountCard
            profile={userProfile}
            isOpen={isAccountCardOpen}
            onClose={() => setIsAccountCardOpen(false)}
            onSignOut={handleSignOut}
            triggerRef={avatarButtonRef}
          />
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
        <main style={{ flex: 1, paddingBottom: "2rem" }}>
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
        <main style={{ flex: 1, paddingBottom: "2rem" }}>
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
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
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
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
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
        <main style={{ flex: 1, paddingBottom: "2rem" }}>
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
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
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
