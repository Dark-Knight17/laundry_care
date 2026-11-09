import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.ts";
import { authErrorMessage } from "../lib/authErrors.ts";

interface SignInProps {
  onNavigateToSignUp: () => void;
}

export function SignIn({ onNavigateToSignUp }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please provide an email.");
      return;
    }
    if (!password) {
      setError("Please provide a password.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        setError(authErrorMessage(signInError, "signin"));
      }
    } catch (err: unknown) {
      setError(authErrorMessage(err, "signin"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "380px",
        margin: "0 auto 2rem auto",
        padding: "1.5rem",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
      }}
    >
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
          Welcome back
        </h2>
        <p
          style={{
            margin: 0,
            color: "var(--color-text)",
            opacity: 0.7,
            fontSize: "0.85rem",
          }}
        >
          Enter your email and password to access the scanner.
        </p>
      </div>

      <form onSubmit={handleSignIn}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="signin-email"
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
            id="signin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
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
            htmlFor="signin-password"
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
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            fontWeight: 700,
            fontSize: "0.95rem",
            borderRadius: "6px",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "opacity 0.15s ease, border-color 0.15s ease",
          }}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Switch link to sign-up */}
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <span
          style={{
            fontSize: "0.82rem",
            color: "var(--color-text)",
            opacity: 0.7,
          }}
        >
          Don't have an account?{" "}
        </span>
        <button
          type="button"
          onClick={onNavigateToSignUp}
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
          Sign up
        </button>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
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
    </div>
  );
}
