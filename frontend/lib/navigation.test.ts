import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  canInterceptScanBack,
  getScanNextStepOnBack,
  nextRouteOnBack,
  sanitizeRoute,
  type NavigationState,
} from "./navigation.ts";

describe("navigation route rules", () => {
  describe("sanitizeRoute", () => {
    test("returns auth screen when there is no session", () => {
      expect(sanitizeRoute(null, false)).toEqual({
        app: true,
        screen: "auth",
      });
      expect(
        sanitizeRoute({ app: true, screen: "gallery" }, false)
      ).toEqual({
        app: true,
        screen: "auth",
      });
    });

    test("returns gallery when session exists and state is empty or non-app", () => {
      expect(sanitizeRoute(null, true)).toEqual({
        app: true,
        screen: "gallery",
      });
      expect(sanitizeRoute(undefined, true)).toEqual({
        app: true,
        screen: "gallery",
      });
      expect(sanitizeRoute({ someOther: "state" }, true)).toEqual({
        app: true,
        screen: "gallery",
      });
    });

    test("falls back to gallery for restored stale in-memory states (scan, results, detail, overlay)", () => {
      expect(sanitizeRoute({ app: true, screen: "scan" }, true)).toEqual({
        app: true,
        screen: "gallery",
      });
      expect(
        sanitizeRoute({ app: true, screen: "results" }, true)
      ).toEqual({
        app: true,
        screen: "gallery",
      });
      expect(
        sanitizeRoute({ app: true, screen: "detail", id: "123" }, true)
      ).toEqual({
        app: true,
        screen: "gallery",
      });
      expect(
        sanitizeRoute(
          { app: true, screen: "gallery", overlay: "account" },
          true
        )
      ).toEqual({
        app: true,
        screen: "gallery",
      });
    });

    test("keeps gallery when valid gallery state is provided", () => {
      expect(sanitizeRoute({ app: true, screen: "gallery" }, true)).toEqual({
        app: true,
        screen: "gallery",
      });
    });

    test("replaces auth with gallery if session exists", () => {
      expect(sanitizeRoute({ app: true, screen: "auth" }, true)).toEqual({
        app: true,
        screen: "gallery",
      });
    });
  });

  describe("nextRouteOnBack", () => {
    test("detail returns to gallery", () => {
      const state: NavigationState = {
        app: true,
        screen: "detail",
        id: "abc",
      };
      expect(nextRouteOnBack(state)).toEqual({
        app: true,
        screen: "gallery",
      });
    });

    test("results returns to gallery", () => {
      const state: NavigationState = { app: true, screen: "results" };
      expect(nextRouteOnBack(state)).toEqual({
        app: true,
        screen: "gallery",
      });
    });

    test("scan returns to gallery when not intercepted", () => {
      const state: NavigationState = { app: true, screen: "scan" };
      expect(nextRouteOnBack(state)).toEqual({
        app: true,
        screen: "gallery",
      });
    });

    test("gallery returns null (exits app / leaves page)", () => {
      const state: NavigationState = { app: true, screen: "gallery" };
      expect(nextRouteOnBack(state)).toBeNull();
    });

    test("auth returns null (exits app / leaves page)", () => {
      const state: NavigationState = { app: true, screen: "auth" };
      expect(nextRouteOnBack(state)).toBeNull();
    });

    test("overlay returns base screen with overlay removed for account, picker, and delete", () => {
      const detailWithDelete: NavigationState = {
        app: true,
        screen: "detail",
        id: "123",
        overlay: "delete",
      };
      expect(nextRouteOnBack(detailWithDelete)).toEqual({
        app: true,
        screen: "detail",
        id: "123",
      });

      const detailWithPicker: NavigationState = {
        app: true,
        screen: "detail",
        id: "123",
        overlay: "picker",
      };
      expect(nextRouteOnBack(detailWithPicker)).toEqual({
        app: true,
        screen: "detail",
        id: "123",
      });

      const resultsWithPicker: NavigationState = {
        app: true,
        screen: "results",
        overlay: "picker",
      };
      expect(nextRouteOnBack(resultsWithPicker)).toEqual({
        app: true,
        screen: "results",
        id: undefined,
      });

      const galleryWithAccount: NavigationState = {
        app: true,
        screen: "gallery",
        overlay: "account",
      };
      expect(nextRouteOnBack(galleryWithAccount)).toEqual({
        app: true,
        screen: "gallery",
        id: undefined,
      });
    });
  });

  describe("scan back-press interception rules", () => {
    test("tag step intercepts back press", () => {
      expect(canInterceptScanBack("tag")).toBe(true);
      expect(getScanNextStepOnBack("tag")).toBe("garment");
    });

    test("garment step does not intercept back press (leaves to gallery)", () => {
      expect(canInterceptScanBack("garment")).toBe(false);
      expect(getScanNextStepOnBack("garment")).toBeNull();
    });
  });

  describe("end-to-end browser history integration", () => {
    let mockHistory: {
      stack: any[];
      index: number;
      readonly state: any;
      pushState: (data: any, unused: string) => void;
      replaceState: (data: any, unused: string) => void;
      back: () => void;
      go: (delta: number) => void;
    };
    let eventListeners: Map<string, Set<(e: any) => void>>;

    beforeEach(() => {
      eventListeners = new Map();
      mockHistory = {
        stack: [null],
        index: 0,
        get state() {
          return this.stack[this.index] ?? null;
        },
        pushState(data: any) {
          this.stack = this.stack.slice(0, this.index + 1);
          this.stack.push(data);
          this.index++;
        },
        replaceState(data: any) {
          if (this.index >= 0) {
            this.stack[this.index] = data;
          } else {
            this.stack.push(data);
            this.index = 0;
          }
        },
        back() {
          this.go(-1);
        },
        go(delta: number) {
          const target = this.index + delta;
          if (target >= 0 && target < this.stack.length) {
            this.index = target;
            const listeners = eventListeners.get("popstate");
            if (listeners) {
              const ev = { state: this.stack[this.index] };
              listeners.forEach((fn) => fn(ev));
            }
          }
        },
      };

      (globalThis as any).window = {
        history: mockHistory,
        addEventListener(event: string, fn: any) {
          if (!eventListeners.has(event)) {
            eventListeners.set(event, new Set());
          }
          eventListeners.get(event)!.add(fn);
        },
        removeEventListener(event: string, fn: any) {
          eventListeners.get(event)?.delete(fn);
        },
      };
    });

    afterEach(() => {
      delete (globalThis as any).window;
    });

    test("startup replaces entry with gallery when authenticated, auth when unauthenticated", async () => {
      const { initNavigation, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
      expect(mockHistory.state).toEqual({ app: true, screen: "gallery" });
    });

    test("detail screen back returns to gallery", async () => {
      const { initNavigation, goToDetail, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToDetail("garment-456");
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "garment-456" });

      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
    });

    test("scan screen back returns to gallery when on garment step", async () => {
      const { initNavigation, goToScan, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
    });

    test("scan tag step back moves to garment review and keeps photo, then next back returns to gallery", async () => {
      const { initNavigation, goToScan, registerScanBackInterceptor, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();

      let currentStep = "tag";
      registerScanBackInterceptor(() => {
        if (currentStep === "tag") {
          currentStep = "garment";
          return true;
        }
        return false;
      });

      // User presses back while on tag step
      mockHistory.back();
      // Should intercept, move to garment step, and stay on scan screen
      expect(currentStep).toBe("garment");
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      // User presses back while on garment step
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
    });

    test("results screen back goes straight to gallery", async () => {
      const { initNavigation, goToScan, goToResults, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();
      goToResults();
      expect(getRoute()).toEqual({ app: true, screen: "results" });

      // Back from results should go directly to gallery (not scan)
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
    });

    test("account card, manual picker, and delete dialog close on back without leaving screen", async () => {
      const { initNavigation, goToDetail, openOverlay, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToDetail("item-1");

      // Open manual picker overlay
      openOverlay("picker");
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "item-1", overlay: "picker" });

      // Back closes overlay
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "item-1" });

      // Open delete dialog overlay
      openOverlay("delete");
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "item-1", overlay: "delete" });

      // Back closes delete dialog
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "item-1" });
    });

    test("deleting garment pops both overlay and detail entries back to gallery", async () => {
      const { initNavigation, goToDetail, openOverlay, closeOverlayAndGoToGallery, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToDetail("to-delete");
      openOverlay("delete");

      expect(mockHistory.stack.length).toBe(3); // gallery, detail, delete
      closeOverlayAndGoToGallery();

      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
      expect(mockHistory.state).toEqual({ app: true, screen: "gallery" });
    });

    test("successful sign in replaces auth with gallery so back does not show auth", async () => {
      const { initNavigation, goToGallery, getRoute } = await import("./navigation.ts");
      initNavigation(false);
      expect(getRoute()).toEqual({ app: true, screen: "auth" });
      expect(mockHistory.stack.length).toBe(1);

      goToGallery(true); // replace auth with gallery
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
      expect(mockHistory.stack.length).toBe(1);
    });

    test("overlays do not nest entries when opening one after another", async () => {
      const { initNavigation, openOverlay, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      openOverlay("account");
      const depthAfterFirst = mockHistory.stack.length;

      openOverlay("picker");
      const depthAfterSecond = mockHistory.stack.length;

      expect(depthAfterSecond).toBe(depthAfterFirst);
      expect(getRoute().overlay).toBe("picker");
    });

    test("reload while on detail, scan, results, or overlay restores to gallery cleanly", async () => {
      const { initNavigation, getRoute } = await import("./navigation.ts");
      // Simulate page reload where browser restored state from previous session
      mockHistory.stack = [{ app: true, screen: "detail", id: "old-123", overlay: "delete" }];
      mockHistory.index = 0;

      initNavigation(true);
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
      expect(mockHistory.state).toEqual({ app: true, screen: "gallery" });
    });

    test("rapid back presses navigate smoothly and do not loop", async () => {
      const { initNavigation, goToScan, goToResults, openOverlay, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();
      goToResults();
      openOverlay("picker");

      // Now at [gallery, results (with overlay: picker)]
      expect(getRoute()).toEqual({ app: true, screen: "results", overlay: "picker" });

      // First rapid back: closes picker, stays on results
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "results" });

      // Second rapid back: leaves results to gallery
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
    });
  });
});
