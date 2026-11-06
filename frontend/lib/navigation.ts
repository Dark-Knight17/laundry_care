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

export type ScanStep =
  | "garment_live"
  | "garment_review"
  | "tag_live"
  | "tag_review"
  | "tag_scanning";

export function previousScanStep(step: ScanStep): ScanStep | null {
  switch (step) {
    case "tag_scanning":
      return "tag_live";
    case "tag_review":
      return "tag_live";
    case "tag_live":
      return "garment_review";
    case "garment_review":
      return "garment_live";
    case "garment_live":
      return null;
    default:
      return null;
  }
}

export type ScanBackDecision =
  | { action: "stay"; nextStep: ScanStep }
  | { action: "leave" };

export function decideScanBack(step: ScanStep): ScanBackDecision {
  const prev = previousScanStep(step);
  if (prev) {
    return { action: "stay", nextStep: prev };
  }
  return { action: "leave" };
}

export function getScanStep(options: {
  step: "garment" | "tag";
  hasGarmentImage: boolean;
  hasTagImage: boolean;
  isLoading: boolean;
}): ScanStep {
  if (options.step === "garment") {
    return options.hasGarmentImage ? "garment_review" : "garment_live";
  }
  if (options.isLoading) {
    return "tag_scanning";
  }
  return options.hasTagImage ? "tag_review" : "tag_live";
}

// --- State Store & History API Integration ---

let currentRoute: NavigationState = { app: true, screen: "gallery" };
const listeners = new Set<(route: NavigationState) => void>();
let activeWindow: (Window & typeof globalThis) | null = null;

export interface ScanBackHandler {
  getStep: () => ScanStep;
  onStay: (nextStep: ScanStep) => void;
  onLeave: () => void;
}

let scanBackHandler: ScanBackHandler | null = null;
let legacyScanBackInterceptor: (() => boolean) | null = null;

export function registerScanBackHandler(handler: ScanBackHandler | null) {
  scanBackHandler = handler;
  legacyScanBackInterceptor = null;
}

export type ScanBackInterceptor = () => boolean;

export function registerScanBackInterceptor(fn: ScanBackInterceptor | null) {
  legacyScanBackInterceptor = fn;
  scanBackHandler = null;
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
  // Invariant: while the user is in the scan flow, the entry on top of
  // the stack is the scan guard, and the entry beneath it is the gallery.
  if (currentRoute.screen === "scan" && !currentRoute.overlay) {
    if (scanBackHandler) {
      const currentStep = scanBackHandler.getStep();
      const decision = decideScanBack(currentStep);

      if (decision.action === "stay") {
        scanBackHandler.onStay(decision.nextStep);
        // ALWAYS restore the guard by pushing the scan entry again
        if (typeof window !== "undefined") {
          window.history.pushState({ app: true, screen: "scan" }, "");
        }
        currentRoute = { app: true, screen: "scan" };
        notify();
        return;
      } else {
        // On "leave" it does not push, it switches to the gallery, stops the stream and
        // discards photos, and it never calls history.back() again (the popstate already moved the browser).
        scanBackHandler.onLeave();
        currentRoute = { app: true, screen: "gallery" };
        notify();
        return;
      }
    }

    if (legacyScanBackInterceptor) {
      const intercepted = legacyScanBackInterceptor();
      if (intercepted) {
        if (typeof window !== "undefined") {
          window.history.pushState({ app: true, screen: "scan" }, "");
        }
        currentRoute = { app: true, screen: "scan" };
        notify();
        return;
      } else {
        currentRoute = { app: true, screen: "gallery" };
        notify();
        return;
      }
    }

    currentRoute = { app: true, screen: "gallery" };
    notify();
    return;
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

  if (activeWindow !== window) {
    activeWindow = window;
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
  if (currentRoute.overlay) {
    window.history.replaceState(state, "");
  } else {
    window.history.pushState(state, "");
  }
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
    currentRoute = { app: true, screen: "gallery" };
    notify();
  } else if (currentRoute.screen === "detail") {
    window.history.back();
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
