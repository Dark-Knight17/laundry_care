import { useSyncExternalStore } from "react";

export type Screen = "auth" | "gallery" | "scan" | "results" | "detail";
export type Overlay = "account" | "picker" | "delete";

export interface NavigationState {
  app: true;
  screen: Screen;
  id?: string;
  overlay?: Overlay;
}

// --- Pure Route-Transition Rules (No DOM access, fully testable) ---

export function sanitizeRoute(
  rawState: unknown,
  hasSession: boolean
): NavigationState {
  if (!hasSession) {
    return { app: true, screen: "auth" };
  }

  if (
    !rawState ||
    typeof rawState !== "object" ||
    (rawState as { app?: boolean }).app !== true
  ) {
    return { app: true, screen: "gallery" };
  }

  const state = rawState as Partial<NavigationState>;

  // Any entry restored from a previous page load that points at scan, results,
  // detail, or an overlay is invalid (its data lived in memory). Fall back to gallery.
  if (
    state.screen === "scan" ||
    state.screen === "results" ||
    state.screen === "detail" ||
    Boolean(state.overlay)
  ) {
    return { app: true, screen: "gallery" };
  }

  if (state.screen === "auth") {
    return { app: true, screen: "gallery" };
  }

  if (state.screen === "gallery") {
    return { app: true, screen: "gallery" };
  }

  return { app: true, screen: "gallery" };
}

export function nextRouteOnBack(
  route: NavigationState
): NavigationState | null {
  if (route.overlay) {
    return { app: true, screen: route.screen, id: route.id };
  }

  switch (route.screen) {
    case "detail":
    case "results":
    case "scan":
      return { app: true, screen: "gallery" };
    case "gallery":
    case "auth":
      return null;
    default:
      return null;
  }
}

export function canInterceptScanBack(step: "garment" | "tag"): boolean {
  return step === "tag";
}

export function getScanNextStepOnBack(
  step: "garment" | "tag"
): "garment" | null {
  return step === "tag" ? "garment" : null;
}

// --- State Store & History API Integration ---

let currentRoute: NavigationState = { app: true, screen: "gallery" };
const listeners = new Set<(route: NavigationState) => void>();
let initialized = false;

type ScanBackInterceptor = () => boolean;
let scanBackInterceptor: ScanBackInterceptor | null = null;

export function registerScanBackInterceptor(fn: ScanBackInterceptor | null) {
  scanBackInterceptor = fn;
}

function notify() {
  for (const listener of listeners) {
    listener(currentRoute);
  }
}

export function getRoute(): NavigationState {
  return currentRoute;
}

export function subscribe(listener: (route: NavigationState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRoute(): NavigationState {
  return useSyncExternalStore(subscribe, getRoute, getRoute);
}

function handlePopState(event: PopStateEvent) {
  // If we are currently in the scan flow without an overlay and in a step that intercepts back
  if (
    currentRoute.screen === "scan" &&
    !currentRoute.overlay &&
    scanBackInterceptor
  ) {
    const intercepted = scanBackInterceptor();
    if (intercepted) {
      // User moved from tag step to garment review state with photo kept.
      // Re-push scan entry so the next back press is still guarded.
      window.history.pushState({ app: true, screen: "scan" }, "");
      currentRoute = { app: true, screen: "scan" };
      notify();
      return;
    }
  }

  const raw = event.state;
  if (!raw || raw.app !== true) {
    // Ignore popstate events whose state does not have app: true (treat them as the gallery)
    currentRoute = { app: true, screen: "gallery" };
  } else {
    currentRoute = {
      app: true,
      screen: raw.screen,
      id: raw.id,
      overlay: raw.overlay,
    };
  }
  notify();
}

export function initNavigation(hasSession: boolean) {
  if (typeof window === "undefined") return;

  const initial = sanitizeRoute(window.history.state, hasSession);
  window.history.replaceState(initial, "");
  currentRoute = initial;
  notify();

  if (!initialized) {
    initialized = true;
    window.addEventListener("popstate", handlePopState);
  }
}

export function goToGallery(replace = false) {
  if (typeof window === "undefined") return;
  const state: NavigationState = { app: true, screen: "gallery" };
  if (replace) {
    window.history.replaceState(state, "");
  } else {
    window.history.pushState(state, "");
  }
  currentRoute = state;
  notify();
}

export function goToDetail(id: string) {
  if (typeof window === "undefined") return;
  const state: NavigationState = { app: true, screen: "detail", id };
  window.history.pushState(state, "");
  currentRoute = state;
  notify();
}

export function goToScan(replace = false) {
  if (typeof window === "undefined") return;
  const state: NavigationState = { app: true, screen: "scan" };
  if (replace) {
    window.history.replaceState(state, "");
  } else {
    window.history.pushState(state, "");
  }
  currentRoute = state;
  notify();
}

export function goToResults() {
  if (typeof window === "undefined") return;
  const state: NavigationState = { app: true, screen: "results" };
  window.history.replaceState(state, "");
  currentRoute = state;
  notify();
}

export function goToAuth() {
  if (typeof window === "undefined") return;
  const state: NavigationState = { app: true, screen: "auth" };
  window.history.replaceState(state, "");
  currentRoute = state;
  notify();
}

export function openOverlay(overlay: Overlay) {
  if (typeof window === "undefined") return;
  const state: NavigationState = {
    app: true,
    screen: currentRoute.screen,
    id: currentRoute.id,
    overlay,
  };
  window.history.pushState(state, "");
  currentRoute = state;
  notify();
}

export function closeOverlay() {
  if (typeof window === "undefined") return;
  if (currentRoute.overlay) {
    window.history.back();
  }
}

export function closeOverlayAndGoToGallery() {
  if (typeof window === "undefined") return;
  if (currentRoute.overlay && currentRoute.screen === "detail") {
    window.history.go(-2);
  } else if (currentRoute.overlay) {
    window.history.back();
  } else {
    goToGallery(true);
  }
}

export function goBack() {
  if (typeof window === "undefined") return;
  window.history.back();
}
