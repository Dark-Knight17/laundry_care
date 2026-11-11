import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  backdropClassName?: string;
  contentClassName?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
  children: React.ReactNode;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
  );
}

export function Modal({
  open,
  onClose,
  role = "dialog",
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  backdropClassName,
  contentClassName,
  initialFocusRef,
  disabled = false,
  children,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Focus management: save opener focus and focus initial element inside
  useEffect(() => {
    if (!open) return;

    triggerElementRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        const focusable = getFocusableElements(containerRef.current);
        const first = focusable[0];
        if (first) {
          first.focus();
        } else {
          containerRef.current.focus();
        }
      }
    }, 20);

    return () => {
      clearTimeout(timer);
      triggerElementRef.current?.focus();
    };
  }, [open, initialFocusRef]);

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
        if (!disabled) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
      }

      if (e.key === "Tab") {
        if (!containerRef.current) return;
        const focusable = getFocusableElements(containerRef.current);
        if (focusable.length === 0) return;

        const firstElement = focusable[0]!;
        const lastElement = focusable[focusable.length - 1]!;

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
  }, [open, disabled, onClose]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !disabled) {
      onClose();
    }
  };

  const handleBackdropTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
    }
  };

  const content = (
    <div
      className={backdropClassName}
      onClick={handleBackdropClick}
      onTouchMove={handleBackdropTouch}
    >
      <div
        ref={containerRef}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={contentClassName}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined" || !document.body) {
    return content;
  }

  return createPortal(content, document.body);
}
