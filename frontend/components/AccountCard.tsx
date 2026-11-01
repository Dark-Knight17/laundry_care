import React, { useEffect, useRef } from "react";
import type { UserProfile } from "../lib/userProfile.ts";
import { Avatar } from "./Avatar.tsx";

interface AccountCardProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function AccountCard({
  profile,
  isOpen,
  onClose,
  onSignOut,
  triggerRef,
}: AccountCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const signOutBtnRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Move focus into the card
      const timer = setTimeout(() => {
        cardRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Move focus back to avatar trigger when closed
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

  // Click outside and Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        triggerRef.current?.focus();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (
        cardRef.current &&
        !cardRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleSignOutClick = () => {
    onClose();
    onSignOut();
  };

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="false"
      aria-label="Account details"
      tabIndex={-1}
      style={{
        position: "absolute",
        top: "calc(var(--top-bar-height) + env(safe-area-inset-top, 0px) + 6px)",
        right: "var(--spacing-screen-edge)",
        width: "280px",
        maxWidth: "calc(100vw - 32px)",
        backgroundColor: "var(--color-surface-raised)",
        border: "1px solid var(--color-border)",
        borderRadius: "16px",
        boxShadow: "0 14px 36px rgba(0, 0, 0, 0.75), 0 2px 8px rgba(0, 0, 0, 0.5)",
        padding: "1.25rem 1rem 0.75rem 1rem",
        zIndex: 200,
        boxSizing: "border-box",
        outline: "none",
        animation: "fadeInScale 0.15s ease-out",
      }}
    >
      {/* Profile info section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0.25rem 0.5rem 0.75rem 0.5rem",
        }}
      >
        <Avatar
          imageUrl={profile.avatarUrl}
          firstName={profile.firstName}
          lastName={profile.lastName}
          email={profile.email}
          size={56}
        />

        {profile.fullName && (
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--color-text)",
              marginTop: "0.75rem",
              lineHeight: 1.3,
              wordBreak: "break-word",
            }}
          >
            {profile.fullName}
          </div>
        )}

        <div
          style={{
            fontSize: "0.82rem",
            color: "var(--color-text)",
            opacity: 0.7,
            marginTop: profile.fullName ? "0.25rem" : "0.65rem",
            wordBreak: "break-all",
            lineHeight: 1.3,
          }}
        >
          {profile.email}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          backgroundColor: "var(--color-border)",
          margin: "0.5rem -1rem 0.5rem -1rem",
        }}
      />

      {/* Actions */}
      <div>
        <button
          ref={signOutBtnRef}
          type="button"
          onClick={handleSignOutClick}
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: "0.75rem",
            padding: "0.65rem 0.75rem",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "8px",
            color: "var(--color-text)",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "var(--font-sans)",
            fontSize: "0.9rem",
            fontWeight: 500,
            transition: "background-color 0.12s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-surface)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-icon)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
