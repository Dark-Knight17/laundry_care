import { describe, expect, test } from "bun:test";
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

    test("overlay returns base screen with overlay removed", () => {
      const detailWithOverlay: NavigationState = {
        app: true,
        screen: "detail",
        id: "123",
        overlay: "delete",
      };
      expect(nextRouteOnBack(detailWithOverlay)).toEqual({
        app: true,
        screen: "detail",
        id: "123",
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
});
