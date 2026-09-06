import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "./class-names";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  children: ReactNode;
  className?: string;
  pending?: boolean;
  variant?: ButtonVariant;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "bg-primary text-text hover:bg-primary-bright",
  secondary:
    "border border-border bg-transparent text-text hover:bg-surface-hover",
  danger:
    "border border-danger bg-transparent text-text hover:bg-surface-hover",
};

export function Button({
  children,
  className,
  disabled = false,
  pending = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || pending;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={pending || undefined}
      className={cx(
        "inline-flex h-12 min-h-12 w-full max-w-full items-center justify-center rounded-full px-7 text-base font-semibold",
        "focus-visible:outline-primary-bright transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none sm:w-auto",
        variantClassNames[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
