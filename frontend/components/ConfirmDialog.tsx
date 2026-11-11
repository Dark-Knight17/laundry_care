import React, { useRef } from "react";
import { Modal } from "./Modal.tsx";

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
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      role="alertdialog"
      ariaDescribedBy="confirm-dialog-message"
      backdropClassName="confirm-dialog-backdrop"
      contentClassName="confirm-dialog-content"
      initialFocusRef={cancelBtnRef}
      disabled={busy}
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
    </Modal>
  );
}
