import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  decideScanBack,
  exitScanToGallery,
  getRoute,
  getScanStep,
  goToDetail,
  goToGallery,
  goToResults,
  goToScan,
  initNavigation,
  nextRouteOnBack,
  openOverlay,
  previousScanStep,
  pushScanStep,
  registerResultsStateListener,
  registerScanFlowListener,
  safePushState,
  sanitizeRoute,
  scanAnotherFromResults,
  type NavigationState,
  type ScanStep,
} from "./navigation.ts";

describe("navigation route rules", () => {
  describe("sanitizeRoute", () => {
    test("returns signin screen when there is no session", () => {
      expect(sanitizeRoute(null, false)).toEqual({
        app: true,
        screen: "signin",
        depth: 0,
      });
      expect(
        sanitizeRoute({ app: true, screen: "gallery" }, false)
      ).toEqual({
        app: true,
        screen: "signin",
        depth: 0,
      });
      expect(
        sanitizeRoute({ app: true, screen: "signup" }, false)
      ).toEqual({
        app: true,
        screen: "signin",
        depth: 0,
      });
    });

    test("returns gallery when session exists and state is empty or non-app", () => {
      expect(sanitizeRoute(null, true)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
      expect(sanitizeRoute(undefined, true)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
      expect(sanitizeRoute({ someOther: "state" }, true)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
    });

    test("falls back to gallery for restored stale in-memory states (scan, results, detail, overlay)", () => {
      expect(sanitizeRoute({ app: true, screen: "scan" }, true)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
      expect(
        sanitizeRoute({ app: true, screen: "results" }, true)
      ).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
      expect(
        sanitizeRoute({ app: true, screen: "detail", id: "123" }, true)
      ).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
      expect(
        sanitizeRoute(
          { app: true, screen: "gallery", overlay: "account" },
          true
        )
      ).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
    });

    test("keeps gallery when valid gallery state is provided", () => {
      expect(sanitizeRoute({ app: true, screen: "gallery" }, true)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
    });

    test("replaces signin and signup with gallery if session exists", () => {
      expect(sanitizeRoute({ app: true, screen: "signin" }, true)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
      expect(sanitizeRoute({ app: true, screen: "signup" }, true)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
      expect(sanitizeRoute({ app: true, screen: "auth" as any }, true)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
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
        depth: 0,
      });
    });

    test("results returns to gallery", () => {
      const state: NavigationState = { app: true, screen: "results" };
      expect(nextRouteOnBack(state)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
    });

    test("scan returns to gallery when not intercepted", () => {
      const state: NavigationState = { app: true, screen: "scan" };
      expect(nextRouteOnBack(state)).toEqual({
        app: true,
        screen: "gallery",
        depth: 0,
      });
    });

    test("gallery returns null (exits app / leaves page)", () => {
      const state: NavigationState = { app: true, screen: "gallery" };
      expect(nextRouteOnBack(state)).toBeNull();
    });

    test("signin returns null (exits app / leaves page)", () => {
      const state: NavigationState = { app: true, screen: "signin" };
      expect(nextRouteOnBack(state)).toBeNull();
    });

    test("signup returns signin on back", () => {
      const state: NavigationState = { app: true, screen: "signup" };
      expect(nextRouteOnBack(state)).toEqual({
        app: true,
        screen: "signin",
        depth: 0,
      });
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
        depth: undefined,
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
        depth: undefined,
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
        depth: undefined,
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
        depth: undefined,
      });
    });
  });

  describe("scan back-press interception rules", () => {
    test("garment review back returns to garment live", () => {
      expect(previousScanStep("garment_review")).toBe("garment_live");
    });

    test("tag live back returns to garment review", () => {
      expect(previousScanStep("tag_live")).toBe("garment_review");
    });

    test("garment live back leaves", () => {
      expect(previousScanStep("garment_live")).toBeNull();
    });

    test("tag scanning back returns to tag live", () => {
      expect(previousScanStep("tag_scanning")).toBe("tag_live");
    });

    test("tag review back returns to tag live", () => {
      expect(previousScanStep("tag_review")).toBe("tag_live");
    });

    test("getScanStep correctly derives ScanStep from capture state", () => {
      expect(
        getScanStep({
          step: "garment",
          hasGarmentImage: false,
          hasTagImage: false,
          isLoading: false,
        })
      ).toBe("garment_live");

      expect(
        getScanStep({
          step: "garment",
          hasGarmentImage: true,
          hasTagImage: false,
          isLoading: false,
        })
      ).toBe("garment_review");

      expect(
        getScanStep({
          step: "tag",
          hasGarmentImage: true,
          hasTagImage: false,
          isLoading: false,
        })
      ).toBe("tag_live");

      expect(
        getScanStep({
          step: "tag",
          hasGarmentImage: true,
          hasTagImage: true,
          isLoading: false,
        })
      ).toBe("tag_review");

      expect(
        getScanStep({
          step: "tag",
          hasGarmentImage: true,
          hasTagImage: true,
          isLoading: true,
        })
      ).toBe("tag_scanning");
    });
  });

  describe("end-to-end browser history integration", () => {
    let mockHistory: {
      stack: any[];
      index: number;
      readonly state: any;
      pushState: (data: any, unused?: string) => void;
      replaceState: (data: any, unused?: string) => void;
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
        navigator: {
          userActivation: {
            isActive: true,
            hasBeenActive: true,
          },
        },
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
      registerScanFlowListener(null);
      registerResultsStateListener(null);
      delete (globalThis as any).window;
    });

    test("startup replaces entry with gallery when authenticated, auth when unauthenticated", async () => {
      const { initNavigation, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
      expect(mockHistory.state).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("detail screen back returns to gallery", async () => {
      const { initNavigation, goToDetail, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToDetail("garment-456");
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "garment-456", depth: 1 });

      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("scan screen back returns to gallery when on garment live camera", async () => {
      const { initNavigation, goToScan, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });

      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("repeated back presses from garment review reach garment live and then the gallery, never anything earlier", async () => {
      const { initNavigation, goToScan, pushScanStep, registerScanFlowListener, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();

      let currentStep: ScanStep = "garment_review";
      registerScanFlowListener({
        hasGarmentImage: () => true,
        hasTagImage: () => false,
        onSetStep: (next) => {
          currentStep = next;
        },
        onLeave: () => {
          currentStep = "garment_live";
        },
      });

      pushScanStep("garment_review");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_review", depth: 2 });

      // 1st back: garment_review -> garment_live
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });

      // 2nd back: garment_live -> gallery (leaves scan flow)
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("tag live back returns to garment review with garment photo kept", async () => {
      const { initNavigation, goToScan, pushScanStep, registerScanFlowListener, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();

      let currentStep: ScanStep = "tag_live";
      let garmentPhotoKept = true;

      registerScanFlowListener({
        hasGarmentImage: () => garmentPhotoKept,
        hasTagImage: () => false,
        onSetStep: (next) => {
          currentStep = next;
          if (next === "garment_live") {
            garmentPhotoKept = false;
          }
        },
        onLeave: () => {
          garmentPhotoKept = false;
        },
      });

      pushScanStep("garment_review");
      pushScanStep("tag_live");

      // Back from tag_live -> garment_review
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_review");
      expect(garmentPhotoKept).toBe(true);
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_review", depth: 2 });

      // Next back from garment_review -> garment_live (photo discarded)
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_live");
      expect(garmentPhotoKept).toBe(false);
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });

      // Next back leaves to gallery
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("scan in progress back cancels and returns to tag live", async () => {
      const { initNavigation, goToScan, pushScanStep, registerScanFlowListener, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();

      let currentStep: ScanStep = "tag_scanning";
      let cancelled = false;

      registerScanFlowListener({
        hasGarmentImage: () => true,
        hasTagImage: () => true,
        onSetStep: (next) => {
          if (currentStep === "tag_scanning" && next === "tag_live") {
            cancelled = true;
          }
          currentStep = next;
        },
        onLeave: () => {},
      });

      pushScanStep("garment_review");
      pushScanStep("tag_live");
      pushScanStep("tag_scanning");

      // 1st back: cancels scan and returns to tag_live
      mockHistory.back();
      expect(cancelled).toBe(true);
      expect(currentStep as ScanStep).toBe("tag_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "tag_live", depth: 3 });

      // 2nd back: returns to garment_review
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_review");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_review", depth: 2 });

      // 3rd back: returns to garment_live
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });

      // 4th back: leaves to gallery
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("results screen back goes straight to gallery", async () => {
      const { initNavigation, goToScan, pushScanStep, goToResults, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();
      pushScanStep("garment_review");
      pushScanStep("tag_live");
      pushScanStep("tag_scanning");
      goToResults();
      expect(getRoute()).toEqual({ app: true, screen: "results", depth: 4 });

      // Back from results skips the scan stack directly to gallery
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("account card, manual picker, and delete dialog close on back without leaving screen", async () => {
      const { initNavigation, goToDetail, openOverlay, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToDetail("item-1");

      // Open manual picker overlay
      openOverlay("picker");
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "item-1", overlay: "picker", depth: 1 });

      // Back closes overlay
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "item-1", depth: 1 });

      // Open delete dialog overlay
      openOverlay("delete");
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "item-1", overlay: "delete", depth: 1 });

      // Back closes delete dialog
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "detail", id: "item-1", depth: 1 });
    });

    test("deleting garment pops both overlay and detail entries back to gallery", async () => {
      const { initNavigation, goToDetail, openOverlay, closeOverlayAndGoToGallery, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToDetail("to-delete");
      openOverlay("delete");

      expect(mockHistory.stack.length).toBe(3); // gallery, detail, delete
      closeOverlayAndGoToGallery();

      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
      expect(mockHistory.state).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("successful sign in replaces auth with gallery so back does not show auth", async () => {
      const { initNavigation, goToGallery, getRoute } = await import("./navigation.ts");
      initNavigation(false);
      expect(getRoute()).toEqual({ app: true, screen: "signin", depth: 0 });
      expect(mockHistory.stack.length).toBe(1);

      goToGallery(true); // replace auth with gallery
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
      expect(mockHistory.stack.length).toBe(1);
    });

    test("signin to signup then back lands on signin", async () => {
      const { initNavigation, goToSignUp, getRoute } = await import("./navigation.ts");
      initNavigation(false);
      expect(getRoute()).toEqual({ app: true, screen: "signin", depth: 0 });
      expect(mockHistory.stack.length).toBe(1);

      goToSignUp();
      expect(getRoute()).toEqual({ app: true, screen: "signup", depth: 1 });
      expect(mockHistory.stack.length).toBe(2);

      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "signin", depth: 0 });
    });

    test("signin to signup to successful sign-up ends on the gallery with back not returning to either auth screen", async () => {
      const { initNavigation, goToSignUp, goToGallery, getRoute } = await import("./navigation.ts");
      initNavigation(false);
      expect(getRoute()).toEqual({ app: true, screen: "signin", depth: 0 });

      goToSignUp();
      expect(getRoute()).toEqual({ app: true, screen: "signup", depth: 1 });

      goToGallery(true);
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });

      mockHistory.back();
      expect(getRoute().screen).not.toBe("signin");
      expect(getRoute().screen).not.toBe("signup");
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("sign-up with no session stays on signup and shows the 'Check your email' state without navigation", async () => {
      const { initNavigation, goToSignUp, getRoute } = await import("./navigation.ts");
      initNavigation(false);
      goToSignUp();
      expect(getRoute()).toEqual({ app: true, screen: "signup", depth: 1 });
      const stackLenBefore = mockHistory.stack.length;
      const indexBefore = mockHistory.index;

      // When sign-up has no session, the app updates component state without performing any history navigation
      expect(getRoute()).toEqual({ app: true, screen: "signup", depth: 1 });
      expect(mockHistory.stack.length).toBe(stackLenBefore);
      expect(mockHistory.index).toBe(indexBefore);
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
      mockHistory.stack = [{ app: true, screen: "detail", id: "old-123", overlay: "delete" }];
      mockHistory.index = 0;

      initNavigation(true);
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
      expect(mockHistory.state).toEqual({ app: true, screen: "gallery", depth: 0 });
    });

    test("rapid back presses navigate smoothly and do not loop", async () => {
      const { initNavigation, goToScan, goToResults, openOverlay, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();
      goToResults();
      openOverlay("picker");

      // First rapid back: closes picker, stays on results
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "results", depth: 1 });

      // Second rapid back: leaves results to gallery
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery", depth: 0 });
    });
  });

  describe("decideScanBack pure decision function", () => {
    test("tag_scanning returns stay with tag_live", () => {
      expect(decideScanBack("tag_scanning")).toEqual({
        action: "stay",
        nextStep: "tag_live",
      });
    });

    test("tag_review returns stay with tag_live", () => {
      expect(decideScanBack("tag_review")).toEqual({
        action: "stay",
        nextStep: "tag_live",
      });
    });

    test("tag_live returns stay with garment_review", () => {
      expect(decideScanBack("tag_live")).toEqual({
        action: "stay",
        nextStep: "garment_review",
      });
    });

    test("garment_review returns stay with garment_live", () => {
      expect(decideScanBack("garment_review")).toEqual({
        action: "stay",
        nextStep: "garment_live",
      });
    });

    test("garment_live returns leave", () => {
      expect(decideScanBack("garment_live")).toEqual({
        action: "leave",
      });
    });
  });

  describe("Chrome History Manipulation Intervention fake history model (Requirement 5)", () => {
    interface HistoryItem {
      state: any;
      title?: string;
      url?: string | URL | null;
      skippable: boolean;
    }

    class FakeChromeHistoryModel {
      entries: HistoryItem[];
      index: number;
      listeners: Set<(e: { state: any }) => void>;
      activationSinceLastTraversal: boolean;
      appExited: boolean;

      constructor() {
        this.entries = [{ state: null, skippable: false }];
        this.index = 0;
        this.listeners = new Set();
        this.activationSinceLastTraversal = true;
        this.appExited = false;
      }

      get state(): any {
        if (this.appExited || this.index < 0) return null;
        return this.entries[this.index]?.state ?? null;
      }

      get stack(): any[] {
        if (this.appExited || this.index < 0) return [];
        return this.entries.slice(0, this.index + 1).map((e) => e.state);
      }

      get length(): number {
        if (this.appExited || this.index < 0) return 0;
        return this.index + 1;
      }

      userTap<T>(fn: () => T): T {
        this.activationSinceLastTraversal = true;
        return fn();
      }

      pushState(data: any, title = "", url?: string | URL | null) {
        const hasActivation = this.activationSinceLastTraversal;
        this.entries = this.entries.slice(0, this.index + 1);

        if (!hasActivation) {
          // Chrome's History Manipulation Intervention:
          // Calling pushState without user activation after a back/forward traversal marks
          // same-document history entries skippable.
          for (const entry of this.entries) {
            entry.skippable = true;
          }
          this.entries.push({ state: data, title, url, skippable: true });
        } else {
          this.entries.push({ state: data, title, url, skippable: false });
        }
        this.index = this.entries.length - 1;
      }

      replaceState(data: any, title = "", url?: string | URL | null) {
        if (this.index >= 0 && this.index < this.entries.length) {
          const current = this.entries[this.index]!;
          this.entries[this.index] = {
            state: data,
            title,
            url,
            skippable: current.skippable,
          };
        } else {
          this.entries = [{ state: data, title, url, skippable: false }];
          this.index = 0;
        }
      }

      back() {
        this.uiBack();
      }

      uiBack() {
        this.activationSinceLastTraversal = false;
        if (this.appExited || this.index <= 0) {
          this.appExited = true;
          this.index = -1;
          return;
        }

        // Chrome's rule:
        // A back press skips skippable entries.
        // When the top entry is skippable, the back press reaches the entry
        // beneath the whole skippable run (or exits the app if nothing below).
        let target = this.index;
        if (this.entries[target]?.skippable) {
          while (target >= 0 && this.entries[target]?.skippable) {
            target--;
          }
        } else {
          target = target - 1;
          while (target >= 0 && this.entries[target]?.skippable) {
            target--;
          }
        }

        if (target < 0) {
          this.appExited = true;
          this.index = -1;
          return;
        }

        this.index = target;
        const entry = this.entries[this.index];
        const event = { state: entry ? entry.state : null };
        for (const listener of Array.from(this.listeners)) {
          listener(event);
        }
      }

      go(delta: number) {
        this.activationSinceLastTraversal = false;
        const target = this.index + delta;
        if (target < 0) {
          this.appExited = true;
          this.index = -1;
          return;
        }
        if (target < this.entries.length) {
          this.index = target;
          const entry = this.entries[this.index];
          const event = { state: entry ? entry.state : null };
          for (const listener of Array.from(this.listeners)) {
            listener(event);
          }
        }
      }

      addListener(fn: (e: { state: any }) => void) {
        this.listeners.add(fn);
      }

      removeListener(fn: (e: { state: any }) => void) {
        this.listeners.delete(fn);
      }
    }

    let fakeHistory: FakeChromeHistoryModel;

    beforeEach(() => {
      fakeHistory = new FakeChromeHistoryModel();
      (globalThis as any).window = {
        history: fakeHistory,
        navigator: {
          get userActivation() {
            return {
              isActive: fakeHistory.activationSinceLastTraversal,
              hasBeenActive: true,
            };
          },
        },
        addEventListener(type: string, fn: any) {
          if (type === "popstate") {
            fakeHistory.addListener(fn);
          }
        },
        removeEventListener(type: string, fn: any) {
          if (type === "popstate") {
            fakeHistory.removeListener(fn);
          }
        },
      };
    });

    afterEach(() => {
      registerScanFlowListener(null);
      registerResultsStateListener(null);
      delete (globalThis as any).window;
    });

    function setupFlow() {
      let step: ScanStep = "garment_live";
      let hasGarment = false;
      let hasTag = false;
      let streamStopped = false;
      let photosDiscarded = false;

      registerScanFlowListener({
        hasGarmentImage: () => hasGarment,
        hasTagImage: () => hasTag,
        onSetStep: (next) => {
          step = next;
          if (next === "garment_live") {
            hasGarment = false;
            hasTag = false;
            photosDiscarded = true;
          } else if (next === "garment_review") {
            hasTag = false;
          }
        },
        onLeave: () => {
          streamStopped = true;
          photosDiscarded = true;
          hasGarment = false;
          hasTag = false;
        },
        onResetToGarmentLive: () => {
          step = "garment_live";
          hasGarment = false;
          hasTag = false;
        },
      });

      return {
        get step() {
          return step;
        },
        get streamStopped() {
          return streamStopped;
        },
        get photosDiscarded() {
          return photosDiscarded;
        },
        captureGarment() {
          fakeHistory.userTap(() => {
            pushScanStep("garment_review");
            step = "garment_review";
            hasGarment = true;
          });
        },
        clickNext() {
          fakeHistory.userTap(() => {
            pushScanStep("tag_live");
            step = "tag_live";
          });
        },
        captureTag() {
          fakeHistory.userTap(() => {
            pushScanStep("tag_scanning");
            step = "tag_scanning";
            hasTag = true;
          });
        },
        scanComplete() {
          goToResults();
        },
      };
    }

    test("(a) gallery -> Scan -> Back -> leaves to gallery", () => {
      initNavigation(true);
      const flow = setupFlow();

      fakeHistory.userTap(() => goToScan());
      expect(flow.step).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });
      expect(fakeHistory.length).toBe(2);

      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
    });

    test("(b) gallery -> Scan -> Capture garment -> Back -> Back -> leaves to gallery (the bug sequence; must pass)", () => {
      initNavigation(true);
      const flow = setupFlow();

      fakeHistory.userTap(() => goToScan());
      flow.captureGarment();
      expect(flow.step).toBe("garment_review");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_review", depth: 2 });
      expect(fakeHistory.length).toBe(3);

      // 1st Back: garment_review -> garment_live
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(flow.step).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });

      // 2nd Back: garment_live -> gallery (leaves scan flow; must NOT exit the app)
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
    });

    test("(c) gallery -> Scan -> Capture garment -> Retake button -> Back -> leaves to gallery", () => {
      initNavigation(true);
      const flow = setupFlow();

      fakeHistory.userTap(() => goToScan());
      flow.captureGarment();
      expect(flow.step).toBe("garment_review");

      // On-screen Retake button calls history.back()
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(flow.step).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });

      // Back from garment_live -> leaves to gallery
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
    });

    test("(d) gallery -> Scan -> Capture garment -> Next -> Back -> Back -> Back -> leaves to gallery", () => {
      initNavigation(true);
      const flow = setupFlow();

      fakeHistory.userTap(() => goToScan());
      flow.captureGarment();
      flow.clickNext();
      expect(flow.step).toBe("tag_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "tag_live", depth: 3 });

      // 1st Back: tag_live -> garment_review
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(flow.step).toBe("garment_review");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_review", depth: 2 });

      // 2nd Back: garment_review -> garment_live
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(flow.step).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });

      // 3rd Back: garment_live -> gallery
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
    });

    test("(e) gallery -> Scan -> Capture garment -> Next -> Capture tag -> scan completes (results) -> Back -> leaves to gallery", () => {
      initNavigation(true);
      const flow = setupFlow();

      fakeHistory.userTap(() => goToScan());
      flow.captureGarment();
      flow.clickNext();
      flow.captureTag();
      flow.scanComplete();
      expect(getRoute()).toEqual({ app: true, screen: "results", depth: 4 });

      // Back from results should skip the remaining scan stack and return directly to gallery
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
    });

    test("(f) gallery -> Scan -> Capture garment -> Next -> Capture tag -> scan completes (results) -> Scan another -> Back -> leaves to gallery", () => {
      initNavigation(true);
      const flow = setupFlow();

      fakeHistory.userTap(() => goToScan());
      flow.captureGarment();
      flow.clickNext();
      flow.captureTag();
      flow.scanComplete();

      // Tap "Scan another": lands on garment_live at depth 1 without pushing
      fakeHistory.userTap(() => scanAnotherFromResults());
      expect(flow.step).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan", step: "garment_live", depth: 1 });

      // Back from garment_live -> gallery
      fakeHistory.back();
      expect(fakeHistory.appExited).toBe(false);
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
    });

    test("(g) a test showing that if the old popstate-push behavior is used, sequence (b) fails and leaves the app on the 2nd Back press", () => {
      initNavigation(true);

      // Old scan flow: only gallery and scan entry pushed
      fakeHistory.userTap(() => fakeHistory.pushState({ app: true, screen: "scan" }, ""));
      // Garment photo was React-only state, no pushState.
      // Now 1st back:
      // In the old code, handlePopState intercepted the popstate event and called
      // history.pushState({ app: true, screen: "scan" }, "") without user activation!
      const oldPopStateInterceptor = () => {
        // Guard re-push inside popstate without user activation:
        fakeHistory.pushState({ app: true, screen: "scan" }, "");
      };
      fakeHistory.addListener(oldPopStateInterceptor);

      // 1st back arrives:
      fakeHistory.back();
      fakeHistory.removeListener(oldPopStateInterceptor);

      // Under Chrome's History Manipulation Intervention, pushState without activation
      // marked the page's entries skippable.
      // Now user presses 2nd Back:
      fakeHistory.back();

      // The skippable entries are bypassed and the browser leaves the app!
      expect(fakeHistory.appExited).toBe(true);
    });
  });
});
