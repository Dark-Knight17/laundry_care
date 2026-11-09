import React from "react";
import { LogoMark } from "./LogoMark.tsx";

interface AuthLayoutProps {
  heading: string;
  error?: string | null;
  children: React.ReactNode;
}

export function AuthLayout({ heading, error, children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-column">
        <div className="auth-logo-wrap">
          <LogoMark size={56} />
        </div>
        <h1 className="auth-heading">{heading}</h1>
        {error && (
          <div role="alert" aria-live="polite" className="auth-error-box">
            {error}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
