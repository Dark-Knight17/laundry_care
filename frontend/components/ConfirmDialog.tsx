import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  busy?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  busy = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Focus management: initial focus on Cancel and restoration on close
  useEffect(() => {
    if (!open) return;

    triggerElementRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 20);

    return () => {
      clearTimeout(timer);
      triggerElementRef.current?.focus();
    };
  }, [open]);

  // Page scroll locking
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Keyboard navigation: Escape key & focus trapping
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!busy) {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = [
          cancelBtnRef.current,
          confirmBtnRef.current,
        ].filter(Boolean) as HTMLElement[];

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0]!;
        const lastElement = focusableElements[focusableElements.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !busy) {
      onCancel();
    }
  };

  const handleBackdropTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
    }
  };

  return createPortal(
    <div
      className="confirm-dialog-backdrop"
      onClick={handleBackdropClick}
      onTouchMove={handleBackdropTouch}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-describedby="confirm-dialog-message"
        tabIndex={-1}
        className="confirm-dialog-content"
      >
        {title && (
          <h3
            style={{
              margin: "0 0 12px 0",
              fontFamily: "var(--font-heading)",
              fontSize: "1.25rem",
              fontWeight: "normal",
              color: "var(--color-text)",
            }}
          >
            {title}
          </h3>
        )}

        <p id="confirm-dialog-message" className="confirm-dialog-message">
          {message}
        </p>

        {errorMessage && (
          <p className="confirm-dialog-error" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="confirm-dialog-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="confirm-dialog-btn confirm-dialog-btn-cancel"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`confirm-dialog-btn ${
              destructive
                ? "confirm-dialog-btn-destructive"
                : "confirm-dialog-btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
