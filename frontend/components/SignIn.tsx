import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.ts";
import { authErrorMessage } from "../lib/authErrors.ts";
import { AuthLayout } from "./AuthLayout.tsx";

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
    <AuthLayout heading="Sign in to Polymer" error={error}>
      <form onSubmit={handleSignIn}>
        <div className="auth-field">
          <label htmlFor="signin-email" className="auth-label">
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
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signin-password" className="auth-label">
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="auth-input"
          />
        </div>

        <button type="submit" disabled={isLoading} className="auth-btn">
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="auth-switch">
        <span>Don't have an account?</span>
        <button
          type="button"
          onClick={onNavigateToSignUp}
          className="auth-switch-btn"
        >
          Sign up
        </button>
      </div>
    </AuthLayout>
  );
}
