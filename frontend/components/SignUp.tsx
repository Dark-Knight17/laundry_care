import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.ts";
import { authErrorMessage } from "../lib/authErrors.ts";

interface SignUpProps {
  onNavigateToSignIn: () => void;
}

export function SignUp({ onNavigateToSignIn }: SignUpProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckEmail, setIsCheckEmail] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    if (!trimmedEmail) {
      setError("Please provide an email.");
      return;
    }

    if (!password) {
      setError("Please provide a password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            full_name: `${trimmedFirst} ${trimmedLast}`,
          },
        },
      });

      if (signUpError) {
        setError(authErrorMessage(signUpError, "signup"));
      } else if (data?.session) {
        // Session present: handled by onAuthStateChange / navigation
      } else {
        // No session: replace form with "Check your email" panel
        setIsCheckEmail(true);
      }
    } catch (err: unknown) {
      setError(authErrorMessage(err, "signup"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckEmail) {
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
        <h2
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1.25rem",
            fontFamily: "var(--font-heading)",
            fontWeight: "normal",
            color: "var(--color-text)",
          }}
        >
          Check your email
        </h2>
        <p
          style={{
            margin: "0 0 1.25rem 0",
            color: "var(--color-text)",
            opacity: 0.85,
            fontSize: "0.9rem",
            lineHeight: 1.5,
          }}
        >
          If we can create an account for {email}, we've sent a link to confirm
          it. Open it on this device to finish.
        </p>
        <div>
          <button
            type="button"
            onClick={onNavigateToSignIn}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-accent)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

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
          Create your account
        </h2>
        <p
          style={{
            margin: 0,
            color: "var(--color-text)",
            opacity: 0.7,
            fontSize: "0.85rem",
          }}
        >
          It only takes a minute.
        </p>
      </div>

      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="signup-first-name"
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
            id="signup-first-name"
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

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="signup-last-name"
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
            id="signup-last-name"
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

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="signup-email"
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
            id="signup-email"
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
            htmlFor="signup-password"
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
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.78rem",
              color: "var(--color-text)",
              opacity: 0.65,
            }}
          >
            At least 8 characters
          </div>
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
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>

      {/* Switch link to sign-in */}
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <span
          style={{
            fontSize: "0.82rem",
            color: "var(--color-text)",
            opacity: 0.7,
          }}
        >
          Already have an account?{" "}
        </span>
        <button
          type="button"
          onClick={onNavigateToSignIn}
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
          Sign in
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
