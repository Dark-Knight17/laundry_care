import { describe, expect, test } from "bun:test";
import { authErrorMessage } from "./authErrors.ts";

describe("authErrorMessage", () => {
  describe("sign-in mode", () => {
    test("invalid_credentials returns incorrect email or password message", () => {
      expect(
        authErrorMessage({ code: "invalid_credentials" }, "signin")
      ).toBe("Incorrect email or password.");
    });

    test("email_not_confirmed returns check inbox message", () => {
      expect(
        authErrorMessage({ code: "email_not_confirmed" }, "signin")
      ).toBe(
        "Please confirm your email first. Check your inbox for the link."
      );
    });

    test("unknown error code returns generic incorrect credentials message", () => {
      expect(
        authErrorMessage({ code: "some_unrecognized_code" }, "signin")
      ).toBe("Incorrect email or password.");
    });

    test("missing error code returns generic incorrect credentials message", () => {
      expect(
        authErrorMessage({ message: "Invalid login attempt" }, "signin")
      ).toBe("Incorrect email or password.");
      expect(authErrorMessage({}, "signin")).toBe(
        "Incorrect email or password."
      );
      expect(authErrorMessage(null, "signin")).toBe(
        "Incorrect email or password."
      );
    });
  });

  describe("sign-up mode", () => {
    test("weak_password returns choose stronger password message", () => {
      expect(
        authErrorMessage({ code: "weak_password" }, "signup")
      ).toBe("Choose a stronger password.");
    });

    test("existing user error code or text returns neutral message", () => {
      expect(
        authErrorMessage({ code: "user_already_exists" }, "signup")
      ).toBe(
        "We couldn't create your account with those details. If you already have one, try signing in."
      );
      expect(
        authErrorMessage({ message: "User already registered" }, "signup")
      ).toBe(
        "We couldn't create your account with those details. If you already have one, try signing in."
      );
    });

    test("unknown code returns neutral message", () => {
      expect(
        authErrorMessage({ code: "unknown_signup_error" }, "signup")
      ).toBe(
        "We couldn't create your account with those details. If you already have one, try signing in."
      );
    });

    test("missing code returns neutral message", () => {
      expect(
        authErrorMessage({ message: "Something failed" }, "signup")
      ).toBe(
        "We couldn't create your account with those details. If you already have one, try signing in."
      );
      expect(authErrorMessage({}, "signup")).toBe(
        "We couldn't create your account with those details. If you already have one, try signing in."
      );
      expect(authErrorMessage(null, "signup")).toBe(
        "We couldn't create your account with those details. If you already have one, try signing in."
      );
    });
  });

  describe("rate limit errors (either mode)", () => {
    test("HTTP 429 status code returns rate limit message", () => {
      expect(
        authErrorMessage({ status: 429, message: "Too many requests" }, "signin")
      ).toBe("Too many attempts. Please wait a moment and try again.");
      expect(
        authErrorMessage({ status: 429, message: "Too many requests" }, "signup")
      ).toBe("Too many attempts. Please wait a moment and try again.");
    });

    test("over_request_rate_limit code returns rate limit message", () => {
      expect(
        authErrorMessage({ code: "over_request_rate_limit" }, "signin")
      ).toBe("Too many attempts. Please wait a moment and try again.");
      expect(
        authErrorMessage({ code: "over_request_rate_limit" }, "signup")
      ).toBe("Too many attempts. Please wait a moment and try again.");
    });

    test("over_email_send_rate_limit code returns rate limit message", () => {
      expect(
        authErrorMessage({ code: "over_email_send_rate_limit" }, "signin")
      ).toBe("Too many attempts. Please wait a moment and try again.");
      expect(
        authErrorMessage({ code: "over_email_send_rate_limit" }, "signup")
      ).toBe("Too many attempts. Please wait a moment and try again.");
    });
  });

  describe("network failures (either mode)", () => {
    test("fetch error returns connection message", () => {
      expect(
        authErrorMessage({ message: "Failed to fetch" }, "signin")
      ).toBe("Couldn't reach the server. Check your connection and try again.");
      expect(
        authErrorMessage({ message: "Failed to fetch" }, "signup")
      ).toBe("Couldn't reach the server. Check your connection and try again.");
    });

    test("network error message returns connection message", () => {
      expect(
        authErrorMessage(new Error("NetworkError when attempting to fetch resource"), "signin")
      ).toBe("Couldn't reach the server. Check your connection and try again.");
      expect(
        authErrorMessage(new Error("NetworkError when attempting to fetch resource"), "signup")
      ).toBe("Couldn't reach the server. Check your connection and try again.");
    });

    test("AuthRetryableFetchError returns connection message", () => {
      expect(
        authErrorMessage({ name: "AuthRetryableFetchError", message: "timeout" }, "signin")
      ).toBe("Couldn't reach the server. Check your connection and try again.");
      expect(
        authErrorMessage({ name: "AuthRetryableFetchError", message: "timeout" }, "signup")
      ).toBe("Couldn't reach the server. Check your connection and try again.");
    });
  });
});
