export const loadingStateCopy = {
  default: "Cargando…",
} as const;

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = loadingStateCopy.default,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="bg-surface-raised text-text-muted flex w-full max-w-full items-center gap-3 rounded-md p-4"
    >
      <span
        className="border-border border-t-primary inline-block size-5 rounded-full border-2 motion-safe:animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-body">{label}</p>
    </div>
  );
}
