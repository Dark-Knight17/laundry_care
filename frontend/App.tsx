import React, { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ScanResult } from "../shared/types.ts";
import { Auth } from "./components/Auth.tsx";
import { Avatar } from "./components/Avatar.tsx";
import { AccountCard } from "./components/AccountCard.tsx";
import { CaptureFlow } from "./components/CaptureFlow.tsx";
import { GalleryView } from "./components/GalleryView.tsx";
import { ResultsDisplay } from "./components/ResultsDisplay.tsx";
import { IconSheet } from "./components/IconSheet.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";
import { DebugOverlay } from "./components/DebugOverlay.tsx";
import { LogoMark } from "./components/LogoMark.tsx";
import { getUserProfile } from "./lib/userProfile.ts";
import { deleteScan, fetchSavedScans, updateScan, type SavedScan } from "./services/api.ts";
import { scanSaveService } from "./services/scanSaveService.ts";
import { supabase } from "./services/supabaseClient.ts";
import {
  closeOverlay,
  closeOverlayAndGoToGallery,
  exitScanToGallery,
  goBack,
  goToAuth,
  goToDetail,
  goToGallery,
  goToResults,
  goToScan,
  initNavigation,
  openOverlay,
  registerResultsStateListener,
  scanAnotherFromResults,
  useRoute,
} from "./lib/navigation.ts";

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const route = useRoute();
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [isScansLoading, setIsScansLoading] = useState<boolean>(false);
  const [selectedSavedScan, setSelectedSavedScan] = useState<SavedScan | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isTopBarVisible, setIsTopBarVisible] = useState<boolean>(true);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null);
  const [tagBlob, setTagBlob] = useState<Blob | null>(null);
  const [tagImageUrl, setTagImageUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const scanResultRef = useRef<ScanResult | null>(null);
  const [activeScanSessionId, setActiveScanSessionId] = useState<string | null>(null);

  useEffect(() => {
    registerResultsStateListener({
      hasResultData: () => scanResultRef.current !== null,
      onLeave: () => {
        handleResetScan();
      },
    });
    return () => {
      registerResultsStateListener(null);
    };
  }, []);

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
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setIsAuthLoading(false);
      initNavigation(Boolean(existingSession));
      if (existingSession) {
        loadScans(existingSession.access_token);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        loadScans(currentSession.access_token);
        if (event === "SIGNED_IN") {
          goToGallery(true);
        }
      } else {
        setSavedScans([]);
        goToAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = scanSaveService.subscribeGlobalSaved((savedRecord) => {
      setSavedScans((prev) => [
        savedRecord,
        ...prev.filter((s) => s.id !== savedRecord.id),
      ]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (route.screen !== "gallery") {
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

        // The bar must always be visible while window.scrollY is less than or equal to the bar's own height
        const barEl = document.querySelector(".top-bar-fixed") as HTMLElement | null;
        const topBarThreshold = barEl && barEl.offsetHeight > 0 ? barEl.offsetHeight : 60;

        if (currentY <= topBarThreshold) {
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
          if (route.overlay === "account") {
            closeOverlay();
          }
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
  }, [route.screen]);

  // Clean up object URLs when moving away from results and scan
  useEffect(() => {
    if (route.screen !== "results" && route.screen !== "scan") {
      if (garmentImageUrl || tagImageUrl) {
        handleResetScan();
      }
    }
  }, [route.screen]);

  const handleScanComplete = (
    result: ScanResult,
    capturedGarmentBlob: Blob,
    capturedGarmentUrl: string,
    capturedTagBlob: Blob,
    capturedTagUrl: string
  ) => {
    const sessionId = crypto.randomUUID();
    setActiveScanSessionId(sessionId);
    setGarmentBlob(capturedGarmentBlob);
    setGarmentImageUrl(capturedGarmentUrl);
    setTagBlob(capturedTagBlob);
    setTagImageUrl(capturedTagUrl);
    setScanResult(result);
    scanResultRef.current = result;
    goToResults();

    // As soon as POST /scan succeeds, start saving in the background
    scanSaveService.startAutoSave(sessionId, capturedGarmentBlob, result);
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
    scanResultRef.current = null;
    setActiveScanSessionId(null);
  };

  const handleStartCapture = () => {
    handleResetScan();
    setSelectedSavedScan(null);
    goToScan();
  };

  const handleSaveSuccess = (savedRecord: SavedScan) => {
    handleResetScan();
    setSavedScans((prev) => [
      savedRecord,
      ...prev.filter((s) => s.id !== savedRecord.id),
    ]);
    goToGallery(true);
  };

  const handleDeleteGarment = async () => {
    const target = activeDetailScan || selectedSavedScan;
    if (!target) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteScan(target.id);
      setSelectedSavedScan(null);
      closeOverlayAndGoToGallery();
      await loadScans();
    } catch (err: any) {
      console.error("Delete scan failed:", err);
      setDeleteError(err.message || "Failed to delete garment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    handleResetScan();
    setSelectedSavedScan(null);
    await supabase.auth.signOut();
  };

  const userProfile = getUserProfile(session?.user);
  const isBarHidden =
    route.screen === "gallery" && !isTopBarVisible && route.overlay !== "account";

  const activeDetailScan =
    selectedSavedScan ||
    (route.screen === "detail" && route.id
      ? savedScans.find((s) => s.id === route.id) || null
      : null);

  const isIconSheet =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("icons");

  if (isIconSheet) {
    return <IconSheet />;
  }

  if (isAuthLoading) {
    return (
      <>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Checking authentication...</p>
        </div>
        <DebugOverlay />
      </>
    );
  }

  if (!session) {
    return (
      <>
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <LogoMark size={56} />
          </div>
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
        <DebugOverlay />
      </>
    );
  }

  return (
    <>
      {route.screen === "scan" ? (
        <CaptureFlow
          onScanComplete={handleScanComplete}
          onClose={() => {
            handleResetScan();
            exitScanToGallery();
          }}
        />
      ) : (
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
              route.screen === "gallery"
                ? "calc(var(--top-bar-height) + env(safe-area-inset-top, 0px) + var(--spacing-screen-edge))"
                : "calc(env(safe-area-inset-top, 0px) + var(--spacing-screen-edge))",
          }}
        >
          {/* Fixed top bar with Google Photos layout and user avatar (gallery screen only) */}
          {route.screen === "gallery" && (
            <header className={`top-bar-fixed${isBarHidden ? " top-bar-hidden" : ""}`}>
              <div className="top-bar-inner">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <LogoMark size={28} style={{ flexShrink: 0 }} />
                  <h1 className="top-bar-wordmark">Laundry Tag Scanner</h1>
                </div>
                <button
                  ref={avatarButtonRef}
                  type="button"
                  onClick={() => {
                    setIsTopBarVisible(true);
                    if (route.overlay === "account") {
                      closeOverlay();
                    } else {
                      openOverlay("account");
                    }
                  }}
                  className="account-avatar-btn"
                  aria-label={
                    userProfile.fullName
                      ? `${userProfile.fullName} - Account details`
                      : `${userProfile.email} - Account details`
                  }
                  aria-haspopup="dialog"
                  aria-expanded={route.overlay === "account"}
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
                  isOpen={route.overlay === "account"}
                  onClose={closeOverlay}
                  onSignOut={handleSignOut}
                  triggerRef={avatarButtonRef}
                />
              </div>
            </header>
          )}

          {route.screen === "gallery" && (
            <main style={{ flex: 1 }}>
              <GalleryView
                scans={savedScans}
                isLoading={isScansLoading}
                onSelectScan={(scan) => {
                  setSelectedSavedScan(scan);
                  setDeleteError(null);
                  goToDetail(scan.id);
                }}
                onStartScan={handleStartCapture}
              />
            </main>
          )}

          {route.screen === "results" && scanResult && (
            <main style={{ flex: 1, paddingBottom: "2rem" }}>
              <ResultsDisplay
                result={scanResult}
                scanSessionId={activeScanSessionId || undefined}
                onDone={() => {
                  handleResetScan();
                  exitScanToGallery();
                  loadScans();
                }}
                onScanAnother={() => {
                  handleResetScan();
                  scanAnotherFromResults();
                }}
                onUpdateResult={(updated) => {
                  scanResultRef.current = updated;
                  setScanResult(updated);
                }}
              />
            </main>
          )}

          {route.screen === "detail" && activeDetailScan && (
            <main
              style={{
                flex: 1,
                paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSavedScan(null);
                    setDeleteError(null);
                    goBack();
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

              <div
                style={{
                  marginBottom: "1.5rem",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  src={activeDetailScan.garment_photo_url}
                  alt="Saved garment"
                  style={{
                    width: "200px",
                    maxHeight: "260px",
                    objectFit: "cover",
                    display: "block",
                    marginInline: "auto",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                  }}
                />
              </div>

              <ResultsDisplay
                result={{
                  detected: activeDetailScan.detected_symbols || [],
                  instructions: activeDetailScan.instructions || [],
                  lowConfidenceWarning: false,
                }}
                onUpdateResult={async (updated) => {
                  const symbolIds = updated.detected.map((d) => d.symbolId);
                  try {
                    const refreshed = await updateScan(activeDetailScan.id, symbolIds);
                    setSelectedSavedScan(refreshed);
                    setSavedScans((prev) =>
                      prev.map((s) => (s.id === refreshed.id ? refreshed : s))
                    );
                  } catch (err) {
                    console.error("Failed to update saved garment:", err);
                  }
                }}
              />

              {/* Delete Action Section */}
              <div style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    openOverlay("delete");
                  }}
                  className="detail-delete-btn"
                >
                  Delete
                </button>
              </div>

              <ConfirmDialog
                open={route.overlay === "delete"}
                message="Delete this garment? This can't be undone."
                cancelLabel="Cancel"
                confirmLabel={isDeleting ? "Deleting…" : "Delete"}
                destructive
                busy={isDeleting}
                errorMessage={deleteError}
                onConfirm={handleDeleteGarment}
                onCancel={() => {
                  setDeleteError(null);
                  closeOverlay();
                }}
              />
            </main>
          )}
        </div>
      )}

      {route.screen === "gallery" && (
        <button
          type="button"
          onClick={handleStartCapture}
          className="scan-btn"
          aria-label="Scan garment tag"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Scan</span>
        </button>
      )}

      <DebugOverlay />
    </>
  );
}
