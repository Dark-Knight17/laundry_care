export interface DebugLogItem {
  id: number;
  time: string;
  type: string;
  details: string;
  userActivation?: {
    isActive: boolean;
    hasBeenActive: boolean;
  };
  stackHint?: string;
}

const listeners = new Set<() => void>();
const logs: DebugLogItem[] = [];
let nextId = 1;
let initialized = false;

export function isDebugEnabled(): boolean {
  if (typeof window === "undefined" || !window.location) return false;
  try {
    return new URLSearchParams(window.location.search).has("debug");
  } catch {
    return false;
  }
}

export function getDebugLogs(): DebugLogItem[] {
  return logs;
}

export function subscribeDebugLogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const fn of listeners) {
    fn();
  }
}

export function addDebugLog(entry: {
  type: string;
  details: string;
  userActivation?: { isActive: boolean; hasBeenActive: boolean };
  stackHint?: string;
}) {
  if (!isDebugEnabled()) return;
  const now = new Date();
  const time = `${now.toTimeString().split(" ")[0]}.${String(now.getMilliseconds()).padStart(3, "0")}`;
  logs.push({
    id: nextId++,
    time,
    type: entry.type,
    details: entry.details,
    userActivation: entry.userActivation,
    stackHint: entry.stackHint,
  });
  notify();
}

function getUserActivation(): { isActive: boolean; hasBeenActive: boolean } | undefined {
  if (typeof navigator !== "undefined" && "userActivation" in navigator) {
    const ua = (navigator as any).userActivation;
    return {
      isActive: Boolean(ua?.isActive),
      hasBeenActive: Boolean(ua?.hasBeenActive),
    };
  }
  return undefined;
}

function getStackHint(): string {
  try {
    const stack = new Error().stack || "";
    const lines = stack.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (
        line.startsWith("at ") &&
        !line.includes("debugHistory") &&
        !line.includes("getStackHint")
      ) {
        return line.replace(/^at\s+/, "");
      }
    }
  } catch {}
  return "";
}

export function initDebugHistory() {
  if (typeof window === "undefined" || !isDebugEnabled() || initialized) {
    return;
  }
  initialized = true;

  const origPushState = window.history.pushState.bind(window.history);
  window.history.pushState = function (state: any, title: string, url?: string | URL | null) {
    const ua = getUserActivation();
    const stack = getStackHint();
    addDebugLog({
      type: "pushState",
      details: `state=${JSON.stringify(state)}${url ? `, url=${url}` : ""}`,
      userActivation: ua,
      stackHint: stack,
    });
    return origPushState(state, title, url);
  };

  const origReplaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = function (state: any, title: string, url?: string | URL | null) {
    const ua = getUserActivation();
    const stack = getStackHint();
    addDebugLog({
      type: "replaceState",
      details: `state=${JSON.stringify(state)}${url ? `, url=${url}` : ""}`,
      userActivation: ua,
      stackHint: stack,
    });
    return origReplaceState(state, title, url);
  };

  const origBack = window.history.back.bind(window.history);
  window.history.back = function () {
    const stack = getStackHint();
    addDebugLog({
      type: "back",
      details: "",
      stackHint: stack,
    });
    return origBack();
  };

  const origForward = window.history.forward.bind(window.history);
  window.history.forward = function () {
    const stack = getStackHint();
    addDebugLog({
      type: "forward",
      details: "",
      stackHint: stack,
    });
    return origForward();
  };

  const origGo = window.history.go.bind(window.history);
  window.history.go = function (delta?: number) {
    const stack = getStackHint();
    addDebugLog({
      type: "go",
      details: `delta=${delta ?? 0}`,
      stackHint: stack,
    });
    return origGo(delta);
  };

  window.addEventListener("pagehide", (e) => {
    addDebugLog({
      type: "pagehide",
      details: `persisted=${e.persisted}`,
    });
  });

  window.addEventListener("visibilitychange", () => {
    addDebugLog({
      type: "visibilitychange",
      details: `visibilityState=${document.visibilityState}`,
    });
  });
}
