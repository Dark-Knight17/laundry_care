import { useSyncExternalStore } from "react";
import { addDebugLog, isDebugEnabled } from "./debugHistory.ts";

export type Screen = "auth" | "gallery" | "scan" | "results" | "detail";
export type Overlay = "account" | "picker" | "delete";

export type ScanStep =
  | "garment_live"
  | "garment_review"
  | "tag_live"
  | "tag_review"
  | "tag_scanning";

export interface NavigationState {
  app: true;
  screen: Screen;
  id?: string;
  overlay?: Overlay;
  step?: ScanStep;
  depth?: number;
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
    return { app: true, screen: "gallery", depth: 0 };
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
    return { app: true, screen: "gallery", depth: 0 };
  }

  if (state.screen === "auth") {
    return { app: true, screen: "gallery", depth: 0 };
  }

  if (state.screen === "gallery") {
    return { app: true, screen: "gallery", depth: 0 };
  }

  return { app: true, screen: "gallery", depth: 0 };
}

export function nextRouteOnBack(
  route: NavigationState
): NavigationState | null {
  if (route.overlay) {
    return {
      app: true,
      screen: route.screen,
      id: route.id,
      depth: route.depth,
    };
  }

  switch (route.screen) {
    case "detail":
    case "results":
    case "scan":
      return { app: true, screen: "gallery", depth: 0 };
    case "gallery":
    case "auth":
      return null;
    default:
      return null;
  }
}

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

// --- Safeguard helper ---

export function safePushState(
  state: NavigationState,
  title = "",
  url?: string | URL | null
) {
  if (typeof window === "undefined") return;

  if (
    typeof navigator !== "undefined" &&
    "userActivation" in navigator &&
    navigator.userActivation &&
    !navigator.userActivation.isActive
  ) {
    const stack = new Error().stack || "";
    console.warn("pushState without user activation", stack);
  }

  window.history.pushState(state, title, url);
}

export function installPushStateGuard() {
  if (typeof window === "undefined") return;
  const history = window.history as any;
  if (!history || history.__pushStateGuarded) return;

  const original = history.pushState.bind(history);
  const guarded = function (
    state: any,
    title: string,
    url?: string | URL | null
  ) {
    if (
      typeof navigator !== "undefined" &&
      "userActivation" in navigator &&
      navigator.userActivation &&
      !navigator.userActivation.isActive
    ) {
      const stack = new Error().stack || "";
      console.warn("pushState without user activation", stack);
    }
    return original(state, title, url);
  };
  guarded.__pushStateGuarded = true;
  history.pushState = guarded;
}

// --- State Store & History API Integration ---

let currentRoute: NavigationState = { app: true, screen: "gallery", depth: 0 };
const listeners = new Set<(route: NavigationState) => void>();
let activeWindow: (Window & typeof globalThis) | null = null;

export interface ScanFlowListener {
  hasGarmentImage: () => boolean;
  hasTagImage: () => boolean;
  onSetStep: (step: ScanStep) => void;
  onLeave: () => void;
  onResetToGarmentLive?: () => void;
}

export interface ResultsStateListener {
  hasResultData: () => boolean;
  onLeave?: () => void;
}

export interface ScanBackHandler {
  getStep?: () => ScanStep;
  onStay?: (nextStep: ScanStep) => void;
  onLeave?: () => void;
}

let scanFlowListener: ScanFlowListener | null = null;
let resultsListener: ResultsStateListener | null = null;
let isScanningAnother = false;

export function registerScanFlowListener(listener: ScanFlowListener | null) {
  scanFlowListener = listener;
}

export function registerResultsStateListener(
  listener: ResultsStateListener | null
) {
  resultsListener = listener;
}

export function registerScanBackHandler(handler: ScanBackHandler | null) {
  if (!handler) {
    scanFlowListener = null;
    return;
  }
  scanFlowListener = {
    hasGarmentImage: () => true,
    hasTagImage: () => true,
    onSetStep: (step) => handler.onStay?.(step),
    onLeave: () => handler.onLeave?.(),
  };
}

function notify() {
  for (const listener of listeners) {
    listener(currentRoute);
  }
}

export function getRoute(): NavigationState {
  return currentRoute;
}

export function subscribe(
  listener: (route: NavigationState) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRoute(): NavigationState {
  return useSyncExternalStore(subscribe, getRoute, getRoute);
}

export function getCurrentScanStep(): ScanStep | null {
  if (currentRoute.screen === "scan") {
    return currentRoute.step ?? "garment_live";
  }
  return null;
}

function handlePopState(event: PopStateEvent) {
  // Invariant: popstate NEVER pushes. It only:
  // - Dispatches step state updates through shared step-transition functions
  // - Handles back-from-results by calling history.go(-state.depth)
  // - Handles steps requiring missing data by calling history.go(-state.depth)
  // - Handles back-to-gallery by cleaning up and rendering gallery
  // - Never calls history.back() or go() when simply moving between scan steps
  const raw = event.state;
  const isApp = raw && typeof raw === "object" && (raw as any).app === true;
  const state: NavigationState = isApp
    ? (raw as NavigationState)
    : { app: true, screen: "gallery", depth: 0 };

  if (isDebugEnabled()) {
    addDebugLog({
      type: "popstate",
      details: `state=${JSON.stringify(event.state)}, currentRoute=${JSON.stringify(currentRoute)}`,
    });
  }

  // 1. Check if this popstate was triggered by scanAnotherFromResults()
  if (isScanningAnother) {
    isScanningAnother = false;
    currentRoute = {
      app: true,
      screen: "scan",
      step: "garment_live",
      depth: 1,
    };
    scanFlowListener?.onResetToGarmentLive?.();
    notify();
    return;
  }

  // 2. Back-from-results: if currentRoute is results and popped entry is scan
  if (currentRoute.screen === "results" && state.screen === "scan") {
    const targetDepth = state.depth ?? 0;
    if (typeof window !== "undefined" && targetDepth > 0) {
      window.history.go(-targetDepth);
      return;
    }
  }

  // 3. Popped entry is gallery (or missing/non-app state)
  if (state.screen === "gallery") {
    scanFlowListener?.onLeave?.();
    resultsListener?.onLeave?.();
    currentRoute = { app: true, screen: "gallery", depth: 0 };
    notify();
    return;
  }

  // 4. Popped entry is results
  if (state.screen === "results") {
    if (resultsListener && !resultsListener.hasResultData()) {
      const depth = state.depth ?? 0;
      if (typeof window !== "undefined" && depth > 0) {
        window.history.go(-depth);
        return;
      }
      goToGallery(true);
      return;
    }
    currentRoute = state;
    notify();
    return;
  }

  // 5. Popped entry is scan
  if (state.screen === "scan") {
    const step = state.step ?? "garment_live";
    const requiresGarment =
      step === "garment_review" ||
      step === "tag_live" ||
      step === "tag_review" ||
      step === "tag_scanning";

    if (
      requiresGarment &&
      scanFlowListener &&
      !scanFlowListener.hasGarmentImage()
    ) {
      // Step requires data no longer in memory -> jump to gallery
      const depth = state.depth ?? 0;
      if (typeof window !== "undefined" && depth > 0) {
        window.history.go(-depth);
        return;
      }
      goToGallery(true);
      return;
    }

    // Step has required data or is garment_live: dispatch step update
    scanFlowListener?.onSetStep?.(step);
    currentRoute = state;
    notify();
    return;
  }

  // 6. Other screens: detail, auth, overlays
  currentRoute = state;
  notify();
}

export function initNavigation(hasSession: boolean) {
  if (typeof window === "undefined") return;

  installPushStateGuard();

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
  const state: NavigationState = { app: true, screen: "gallery", depth: 0 };
  if (replace) {
    window.history.replaceState(state, "");
  } else {
    safePushState(state, "");
  }
  currentRoute = state;
  notify();
}

export function goToDetail(id: string) {
  if (typeof window === "undefined") return;
  const state: NavigationState = {
    app: true,
    screen: "detail",
    id,
    depth: 1,
  };
  safePushState(state, "");
  currentRoute = state;
  notify();
}

export function goToScan() {
  if (typeof window === "undefined") return;
  const state: NavigationState = {
    app: true,
    screen: "scan",
    step: "garment_live",
    depth: 1,
  };
  safePushState(state, "");
  currentRoute = state;
  notify();
}

export function pushScanStep(step: ScanStep) {
  if (typeof window === "undefined") return;
  const nextDepth = (currentRoute.depth ?? 0) + 1;
  const state: NavigationState = {
    app: true,
    screen: "scan",
    step,
    depth: nextDepth,
  };
  safePushState(state, "");
  currentRoute = state;
  notify();
}

export function goToResults() {
  if (typeof window === "undefined") return;
  const depth = currentRoute.depth ?? 4;
  const state: NavigationState = {
    app: true,
    screen: "results",
    depth,
  };
  window.history.replaceState(state, "");
  currentRoute = state;
  notify();
}

export function exitScanToGallery() {
  if (typeof window === "undefined") return;
  const depth = currentRoute.depth ?? 0;
  if (depth > 0) {
    window.history.go(-depth);
  } else {
    goToGallery(true);
  }
}

export function scanAnotherFromResults() {
  if (typeof window === "undefined") return;
  const depth = currentRoute.depth ?? 1;
  isScanningAnother = true;
  const delta = -(depth - 1);
  if (delta !== 0) {
    window.history.go(delta);
  } else {
    isScanningAnother = false;
    currentRoute = {
      app: true,
      screen: "scan",
      step: "garment_live",
      depth: 1,
    };
    scanFlowListener?.onResetToGarmentLive?.();
    notify();
  }
}

export function goToAuth() {
  if (typeof window === "undefined") return;
  const state: NavigationState = { app: true, screen: "auth", depth: 0 };
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
    step: currentRoute.step,
    depth: currentRoute.depth,
    overlay,
  };
  if (currentRoute.overlay) {
    window.history.replaceState(state, "");
  } else {
    safePushState(state, "");
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
    currentRoute = { app: true, screen: "gallery", depth: 0 };
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
