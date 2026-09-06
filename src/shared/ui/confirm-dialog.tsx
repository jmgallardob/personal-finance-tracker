"use client";

import { Button } from "./button";
import { DialogShell } from "./dialog";
import { ErrorSummary } from "./error-summary";

export const confirmDialogCopy = {
  cancel: "Cancelar",
  confirm: "Confirmar",
} as const;

export interface ConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  description: string;
  error?: string;
  onCancel?: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending?: boolean;
  title: string;
}

export function ConfirmDialog({
  cancelLabel = confirmDialogCopy.cancel,
  confirmLabel = confirmDialogCopy.confirm,
  confirmVariant = "danger",
  description,
  error,
  onCancel,
  onConfirm,
  onOpenChange,
  open,
  pending = false,
  title,
}: ConfirmDialogProps) {
  function requestClose() {
    if (pending) {
      return;
    }

    onCancel?.();
    onOpenChange(false);
  }

  function handleConfirm() {
    if (pending) {
      return;
    }

    onConfirm();
  }

  return (
    <DialogShell
      description={description}
      footer={
        <>
          <Button disabled={pending} variant="secondary" onClick={requestClose}>
            {cancelLabel}
          </Button>
          <Button
            pending={pending}
            variant={confirmVariant}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
      open={open}
      preventClose={pending}
      showCloseButton={false}
      title={title}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          requestClose();
        }
      }}
    >
      {error ? <ErrorSummary errors={[{ message: error }]} /> : null}
    </DialogShell>
  );
}
