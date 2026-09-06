"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "./button";
import { cx } from "./class-names";

export const dialogCopy = {
  close: "Cerrar",
} as const;

export interface DialogShellProps {
  children?: ReactNode;
  closeLabel?: string;
  description?: string;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  preventClose?: boolean;
  showCloseButton?: boolean;
  title: string;
}

export function DialogShell({
  children,
  closeLabel = dialogCopy.close,
  description,
  footer,
  onOpenChange,
  open,
  preventClose = false,
  showCloseButton = true,
  title,
}: DialogShellProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  function restoreFocus() {
    const previousFocus = previousFocusRef.current;
    previousFocusRef.current = null;
    previousFocus?.focus();
  }

  useEffect(() => {
    if (open) {
      return;
    }

    function rememberOpener(event: Event) {
      const target = event.target;
      if (target instanceof HTMLElement && target !== document.body) {
        previousFocusRef.current = target;
      }
    }

    document.addEventListener("focusin", rememberOpener);
    document.addEventListener("pointerdown", rememberOpener);

    return () => {
      document.removeEventListener("focusin", rememberOpener);
      document.removeEventListener("pointerdown", rememberOpener);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      restoreFocus();
    }
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    if (preventClose && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);
  }

  function handleCloseAutoFocus(event: Event) {
    event.preventDefault();
    restoreFocus();
  }

  return (
    <Dialog.Root modal open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-dialog-overlay=""
          className="fixed inset-0 z-50 bg-black/70"
        />
        <Dialog.Content
          onCloseAutoFocus={handleCloseAutoFocus}
          className={cx(
            "border-border bg-surface-raised fixed z-50 flex max-h-[90vh] w-full max-w-full flex-col overflow-y-auto border p-6",
            "inset-x-0 bottom-0 rounded-t-[20px]",
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg",
            "focus-visible:outline-primary-bright focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <Dialog.Title className="text-heading-sm text-text font-medium">
            {title}
          </Dialog.Title>
          <Dialog.Description
            className={
              description ? "text-body text-text-muted mt-2" : "sr-only"
            }
          >
            {description ?? title}
          </Dialog.Description>
          {children ? (
            <div className="mt-4 w-full max-w-full">{children}</div>
          ) : null}
          {footer || showCloseButton ? (
            <div className="mt-6 flex w-full max-w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {showCloseButton ? (
                <Dialog.Close asChild>
                  <Button variant="secondary" disabled={preventClose}>
                    {closeLabel}
                  </Button>
                </Dialog.Close>
              ) : null}
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
