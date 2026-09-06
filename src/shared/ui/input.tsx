"use client";

import type { ComponentProps } from "react";

import { cx } from "./class-names";
import { useOptionalFieldContext } from "./field";

export interface InputProps extends Omit<ComponentProps<"input">, "className"> {
  className?: string;
  invalid?: boolean;
  tabular?: boolean;
}

export function Input({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  className,
  disabled,
  id,
  invalid,
  tabular = false,
  ...props
}: InputProps) {
  const field = useOptionalFieldContext();
  const resolvedId = id ?? field?.controlId;
  const resolvedInvalid = invalid ?? field?.invalid ?? false;
  const resolvedDescribedBy =
    [ariaDescribedBy, field?.describedBy].filter(Boolean).join(" ") ||
    undefined;
  const resolvedRequired = ariaRequired ?? (field?.required || undefined);

  return (
    <input
      {...props}
      id={resolvedId}
      disabled={disabled}
      aria-invalid={ariaInvalid ?? (resolvedInvalid || undefined)}
      aria-describedby={resolvedDescribedBy}
      aria-required={resolvedRequired}
      className={cx(
        "border-border bg-surface-raised text-text block h-14 min-h-14 w-full max-w-full rounded-md border px-4 text-base",
        "placeholder:text-text-muted",
        "focus-visible:outline-primary-bright focus-visible:outline-2 focus-visible:outline-offset-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        resolvedInvalid && "border-danger",
        tabular && "tabular-nums",
        className,
      )}
    />
  );
}
