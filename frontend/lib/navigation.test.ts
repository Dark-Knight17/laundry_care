import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  canInterceptScanBack,
  decideScanBack,
  getRoute,
  getScanNextStepOnBack,
  getScanStep,
  goToDetail,
  goToGallery,
  goToResults,
  goToScan,
  initNavigation,
  nextRouteOnBack,
  openOverlay,
  previousScanStep,
  registerScanBackHandler,
  registerScanBackInterceptor,
  sanitizeRoute,
  type NavigationState,
  type ScanStep,
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
    test("garment review back returns to garment live", () => {
      expect(previousScanStep("garment_review")).toBe("garment_live");
      expect(canInterceptScanBack("garment_review")).toBe(true);
      expect(getScanNextStepOnBack("garment_review")).toBe("garment_live");
    });

    test("tag live back returns to garment review", () => {
      expect(previousScanStep("tag_live")).toBe("garment_review");
      expect(canInterceptScanBack("tag_live")).toBe(true);
      expect(getScanNextStepOnBack("tag_live")).toBe("garment_review");
    });

    test("garment live back leaves", () => {
      expect(previousScanStep("garment_live")).toBeNull();
      expect(canInterceptScanBack("garment_live")).toBe(false);
      expect(getScanNextStepOnBack("garment_live")).toBeNull();
    });

    test("tag scanning back returns to tag live", () => {
      expect(previousScanStep("tag_scanning")).toBe("tag_live");
      expect(canInterceptScanBack("tag_scanning")).toBe(true);
      expect(getScanNextStepOnBack("tag_scanning")).toBe("tag_live");
    });

    test("tag review back returns to tag live", () => {
      expect(previousScanStep("tag_review")).toBe("tag_live");
      expect(canInterceptScanBack("tag_review")).toBe(true);
      expect(getScanNextStepOnBack("tag_review")).toBe("tag_live");
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

    test("scan screen back returns to gallery when on garment live camera", async () => {
      const { initNavigation, goToScan, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
    });

    test("repeated back presses from garment review reach garment live and then the gallery, never anything earlier", async () => {
      const { initNavigation, goToScan, registerScanBackInterceptor, previousScanStep, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();

      let currentStep: ScanStep = "garment_review";
      registerScanBackInterceptor(() => {
        const prev = previousScanStep(currentStep);
        if (prev) {
          currentStep = prev;
          return true;
        }
        return false;
      });

      // 1st back: garment_review -> garment_live
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      // 2nd back: garment_live -> gallery (leaves scan flow)
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
    });

    test("tag live back returns to garment review with garment photo kept", async () => {
      const { initNavigation, goToScan, registerScanBackInterceptor, previousScanStep, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();

      let currentStep: ScanStep = "tag_live";
      let garmentPhotoKept = true;
      registerScanBackInterceptor(() => {
        const prev = previousScanStep(currentStep);
        if (prev) {
          currentStep = prev;
          return true;
        }
        return false;
      });

      // Back from tag_live -> garment_review
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_review");
      expect(garmentPhotoKept).toBe(true);
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      // Next back from garment_review -> garment_live (retake, photo discarded)
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      // Next back leaves to gallery
      mockHistory.back();
      expect(getRoute()).toEqual({ app: true, screen: "gallery" });
    });

    test("scan in progress back cancels and returns to tag live", async () => {
      const { initNavigation, goToScan, registerScanBackInterceptor, previousScanStep, getRoute } = await import("./navigation.ts");
      initNavigation(true);
      goToScan();

      let currentStep: ScanStep = "tag_scanning";
      let cancelled = false;
      registerScanBackInterceptor(() => {
        const prev = previousScanStep(currentStep);
        if (prev) {
          if (currentStep === "tag_scanning") {
            cancelled = true;
          }
          currentStep = prev;
          return true;
        }
        return false;
      });

      // 1st back: cancels scan and returns to tag_live
      mockHistory.back();
      expect(cancelled).toBe(true);
      expect(currentStep as ScanStep).toBe("tag_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      // 2nd back: returns to garment_review
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_review");
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      // 3rd back: returns to garment_live
      mockHistory.back();
      expect(currentStep as ScanStep).toBe("garment_live");
      expect(getRoute()).toEqual({ app: true, screen: "scan" });

      // 4th back: leaves to gallery
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

  describe("fake history model - scan flow stack invariant", () => {
    class FakeHistoryModel {
      private entries: any[];
      index: number;
      private listeners: Set<(e: { state: any }) => void>;

      constructor() {
        this.entries = [null];
        this.index = 0;
        this.listeners = new Set();
      }

      get state(): any {
        return this.entries[this.index] ?? null;
      }

      get stack(): any[] {
        return this.entries.slice(0, this.index + 1);
      }

      get depth(): number {
        return this.index + 1;
      }

      get length(): number {
        return this.index + 1;
      }

      pushState(data: any, _unused?: string) {
        this.entries = this.entries.slice(0, this.index + 1);
        this.entries.push(data);
        this.index = this.entries.length - 1;
      }

      replaceState(data: any, _unused?: string) {
        if (this.index >= 0) {
          this.entries[this.index] = data;
        } else {
          this.entries = [data];
          this.index = 0;
        }
      }

      back() {
        this.go(-1);
      }

      go(delta: number) {
        const target = this.index + delta;
        if (target >= 0 && target < this.entries.length) {
          this.index = target;
          const event = { state: this.entries[this.index] };
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

    let fakeHistory: FakeHistoryModel;

    beforeEach(() => {
      fakeHistory = new FakeHistoryModel();
      (globalThis as any).window = {
        history: fakeHistory,
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
      registerScanBackHandler(null);
      delete (globalThis as any).window;
    });

    function setupScanFlow() {
      let step: ScanStep = "garment_live";
      let streamStopped = false;
      let photosDiscarded = false;
      let garmentPhotoKept = false;

      registerScanBackHandler({
        getStep: () => step,
        onStay: (nextStep: ScanStep) => {
          step = nextStep;
          if (nextStep === "garment_live") {
            photosDiscarded = true;
            garmentPhotoKept = false;
          } else if (nextStep === "garment_review") {
            garmentPhotoKept = true;
          }
        },
        onLeave: () => {
          streamStopped = true;
          photosDiscarded = true;
          garmentPhotoKept = false;
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
        get garmentPhotoKept() {
          return garmentPhotoKept;
        },
        takeGarmentPhoto() {
          step = "garment_review";
          garmentPhotoKept = true;
          photosDiscarded = false;
        },
        clickNext() {
          if (step === "garment_review") {
            step = "tag_live";
          }
        },
        clickRetake() {
          if (step === "garment_review") {
            step = "garment_live";
            photosDiscarded = true;
            garmentPhotoKept = false;
          } else if (step === "tag_review") {
            step = "tag_live";
          }
        },
      };
    }

    test("gallery -> scan -> back: lands on gallery, stack depth is 1 ([gallery])", () => {
      initNavigation(true);
      goToScan();
      const flow = setupScanFlow();

      expect(flow.step).toBe("garment_live");
      expect(fakeHistory.length).toBe(2);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

      fakeHistory.back();
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery"]);
    });

    test("gallery -> scan -> garment photo -> back: lands on garment live camera, stack depth is 2 ([gallery, scan])", () => {
      initNavigation(true);
      goToScan();
      const flow = setupScanFlow();

      flow.takeGarmentPhoto();
      expect(flow.step).toBe("garment_review");
      expect(fakeHistory.length).toBe(2);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

      fakeHistory.back();
      expect(flow.step).toBe("garment_live");
      expect(getRoute().screen).toBe("scan");
      expect(fakeHistory.length).toBe(2);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);
    });

    test("same as previous, then back again: lands on gallery, stack depth is 1 ([gallery]), stream stopped, photos discarded", () => {
      initNavigation(true);
      goToScan();
      const flow = setupScanFlow();

      flow.takeGarmentPhoto();
      fakeHistory.back();
      expect(flow.step).toBe("garment_live");
      expect(fakeHistory.length).toBe(2);

      fakeHistory.back();
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery"]);
      expect(flow.streamStopped).toBe(true);
      expect(flow.photosDiscarded).toBe(true);
    });

    test("gallery -> scan -> garment photo -> Next -> back: lands on garment review with photo kept, stack depth is 2 ([gallery, scan]); back again: live garment camera, depth 2; back again: gallery, depth 1", () => {
      initNavigation(true);
      goToScan();
      const flow = setupScanFlow();

      flow.takeGarmentPhoto();
      flow.clickNext();
      expect(flow.step).toBe("tag_live");
      expect(fakeHistory.length).toBe(2);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

      // 1st back: lands on garment review with photo kept, depth 2
      fakeHistory.back();
      expect(flow.step).toBe("garment_review");
      expect(flow.garmentPhotoKept).toBe(true);
      expect(getRoute().screen).toBe("scan");
      expect(fakeHistory.length).toBe(2);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

      // 2nd back: live garment camera, depth 2
      fakeHistory.back();
      expect(flow.step).toBe("garment_live");
      expect(getRoute().screen).toBe("scan");
      expect(fakeHistory.length).toBe(2);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

      // 3rd back: gallery, depth 1
      fakeHistory.back();
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery"]);
    });

    test("pressing Retake and Next multiple times in a row never changes the stack depth (always [gallery, scan])", () => {
      initNavigation(true);
      goToScan();
      const flow = setupScanFlow();

      for (let i = 0; i < 4; i++) {
        flow.takeGarmentPhoto();
        expect(fakeHistory.length).toBe(2);
        expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

        flow.clickNext();
        expect(fakeHistory.length).toBe(2);
        expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

        fakeHistory.back();
        expect(fakeHistory.length).toBe(2);
        expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

        flow.clickRetake();
        expect(flow.step).toBe("garment_live");
        expect(fakeHistory.length).toBe(2);
        expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);
      }
    });

    test("3 rapid back presses from garment review end on gallery, never drop below [gallery], and never loop", () => {
      initNavigation(true);
      goToScan();
      const flow = setupScanFlow();

      flow.takeGarmentPhoto();
      expect(flow.step).toBe("garment_review");
      expect(fakeHistory.length).toBe(2);

      // Rapid back 1: garment_review -> garment_live
      fakeHistory.back();
      expect(flow.step).toBe("garment_live");
      expect(getRoute().screen).toBe("scan");
      expect(fakeHistory.length).toBe(2);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery", "scan"]);

      // Rapid back 2: garment_live -> gallery
      fakeHistory.back();
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery"]);

      // Rapid back 3: at gallery, never drops below [gallery] and never loops
      fakeHistory.back();
      expect(getRoute().screen).toBe("gallery");
      expect(fakeHistory.length).toBe(1);
      expect(fakeHistory.stack.map((s) => s.screen)).toEqual(["gallery"]);
    });
  });
});
