import React, { useState } from "react";
import { supabase } from "./services/supabaseClient.ts";

export function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected sign in error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
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
      const msg = err instanceof Error ? err.message : "Unexpected sign up error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "380px", margin: "2rem auto", padding: "1rem" }}>
      <h2>Sign In / Sign Up</h2>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Enter your email and password to access the scanner.
      </p>

      <form onSubmit={handleSignIn}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="auth-email"
            style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold" }}
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
            style={{
              width: "100%",
              padding: "0.5rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="auth-password"
            style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold" }}
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "0.5rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button type="submit" disabled={isLoading} style={{ flex: 1, padding: "0.5rem" }}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={isLoading}
            style={{ flex: 1, padding: "0.5rem" }}
          >
            Sign up
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.5rem",
            backgroundColor: "#ffebee",
            color: "#c62828",
            border: "1px solid #ffcdd2",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.5rem",
            backgroundColor: "#e8f5e9",
            color: "#2e7d32",
            border: "1px solid #c8e6c9",
            fontSize: "0.9rem",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
