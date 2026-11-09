import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.ts";
import { authErrorMessage } from "../lib/authErrors.ts";
import { AuthLayout } from "./AuthLayout.tsx";

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
      <AuthLayout heading="Check your email">
        <p className="auth-message">
          If we can create an account for {email}, we've sent a link to confirm
          it. Open it on this device to finish.
        </p>
        <div className="auth-switch">
          <button
            type="button"
            onClick={onNavigateToSignIn}
            className="auth-switch-btn"
          >
            Back to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heading="Create your account" error={error}>
      <form onSubmit={handleSignUp}>
        <div className="auth-field">
          <label htmlFor="signup-first-name" className="auth-label">
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
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-last-name" className="auth-label">
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
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-email" className="auth-label">
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
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-password" className="auth-label">
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
            className="auth-input"
          />
          <div className="auth-hint">At least 8 characters</div>
        </div>

        <button type="submit" disabled={isLoading} className="auth-btn">
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="auth-switch">
        <span>Already have an account?</span>
        <button
          type="button"
          onClick={onNavigateToSignIn}
          className="auth-switch-btn"
        >
          Sign in
        </button>
      </div>
    </AuthLayout>
  );
}
