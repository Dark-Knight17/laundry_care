import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.ts";

export function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unexpected sign in error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst) {
      setError("First name is required.");
      return;
    }
    if (trimmedFirst.length > 50) {
      setError("First name cannot exceed 50 characters.");
      return;
    }

    if (!trimmedLast) {
      setError("Last name is required.");
      return;
    }
    if (trimmedLast.length > 50) {
      setError("Last name cannot exceed 50 characters.");
      return;
    }

    if (!trimmedEmail || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            full_name: `${trimmedFirst} ${trimmedLast}`,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        setMessage("Account created and signed in!");
      } else {
        setMessage(
          "Account created! If email confirmation is enabled, please check your email."
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unexpected sign up error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setError(null);
    setMessage(null);
  };

  return (
    <div
      style={{
        maxWidth: "380px",
        margin: "1rem auto 2rem auto",
        padding: "1.5rem",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
      }}
    >
      {/* Mode toggle */}
      <div
        style={{
          display: "flex",
          backgroundColor: "var(--color-bg)",
          borderRadius: "8px",
          padding: "3px",
          marginBottom: "1.25rem",
          border: "1px solid var(--color-border)",
        }}
      >
        <button
          type="button"
          onClick={() => switchMode("signin")}
          style={{
            flex: 1,
            padding: "0.55rem 0.75rem",
            backgroundColor:
              mode === "signin"
                ? "var(--color-surface-raised)"
                : "transparent",
            color: "var(--color-text)",
            opacity: mode === "signin" ? 1 : 0.6,
            border:
              mode === "signin"
                ? "1px solid var(--color-border)"
                : "1px solid transparent",
            borderRadius: "6px",
            fontWeight: mode === "signin" ? 600 : 500,
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          style={{
            flex: 1,
            padding: "0.55rem 0.75rem",
            backgroundColor:
              mode === "signup"
                ? "var(--color-surface-raised)"
                : "transparent",
            color: "var(--color-text)",
            opacity: mode === "signup" ? 1 : 0.6,
            border:
              mode === "signup"
                ? "1px solid var(--color-border)"
                : "1px solid transparent",
            borderRadius: "6px",
            fontWeight: mode === "signup" ? 600 : 500,
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Sign Up
        </button>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <h2
          style={{
            margin: "0 0 0.25rem 0",
            fontSize: "1.25rem",
            fontFamily: "var(--font-heading)",
            fontWeight: "normal",
            color: "var(--color-text)",
          }}
        >
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p
          style={{
            margin: 0,
            color: "var(--color-text)",
            opacity: 0.7,
            fontSize: "0.85rem",
          }}
        >
          {mode === "signin"
            ? "Enter your email and password to access the scanner."
            : "Enter your name, email, and password to register."}
        </p>
      </div>

      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
        {/* Name fields - Sign up mode only */}
        {mode === "signup" && (
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="auth-first-name"
                style={{
                  display: "block",
                  marginBottom: "0.3rem",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  color: "var(--color-text)",
                }}
              >
                First name
              </label>
              <input
                id="auth-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={50}
                autoComplete="given-name"
                placeholder="Jane"
                style={{
                  width: "100%",
                  padding: "0.55rem",
                  boxSizing: "border-box",
                  backgroundColor: "var(--color-surface-raised)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                htmlFor="auth-last-name"
                style={{
                  display: "block",
                  marginBottom: "0.3rem",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  color: "var(--color-text)",
                }}
              >
                Last name
              </label>
              <input
                id="auth-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={50}
                autoComplete="family-name"
                placeholder="Doe"
                style={{
                  width: "100%",
                  padding: "0.55rem",
                  boxSizing: "border-box",
                  backgroundColor: "var(--color-surface-raised)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="auth-email"
            style={{
              display: "block",
              marginBottom: "0.3rem",
              fontWeight: 600,
              fontSize: "0.82rem",
              color: "var(--color-text)",
            }}
          >
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "0.55rem",
              boxSizing: "border-box",
              backgroundColor: "var(--color-surface-raised)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="auth-password"
            style={{
              display: "block",
              marginBottom: "0.3rem",
              fontWeight: 600,
              fontSize: "0.82rem",
              color: "var(--color-text)",
            }}
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            style={{
              width: "100%",
              padding: "0.55rem",
              boxSizing: "border-box",
              backgroundColor: "var(--color-surface-raised)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.65rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-bg)",
            fontWeight: 700,
            fontSize: "0.95rem",
            border: "none",
            borderRadius: "6px",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "opacity 0.15s ease",
          }}
        >
          {isLoading
            ? mode === "signin"
              ? "Signing in..."
              : "Creating account..."
            : mode === "signin"
            ? "Sign in"
            : "Sign up"}
        </button>
      </form>

      {/* Switch link */}
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <span
          style={{
            fontSize: "0.82rem",
            color: "var(--color-text)",
            opacity: 0.7,
          }}
        >
          {mode === "signin"
            ? "Don't have an account? "
            : "Already have an account? "}
        </span>
        <button
          type="button"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-accent)",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.6rem 0.75rem",
            backgroundColor: "rgba(177, 74, 62, 0.15)",
            color: "var(--color-caution)",
            border: "1px solid var(--color-caution)",
            borderRadius: "6px",
            fontSize: "0.85rem",
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.6rem 0.75rem",
            backgroundColor: "rgba(159, 185, 143, 0.15)",
            color: "var(--color-positive)",
            border: "1px solid var(--color-positive)",
            borderRadius: "6px",
            fontSize: "0.85rem",
            lineHeight: 1.4,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
