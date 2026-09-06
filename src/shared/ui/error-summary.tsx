export interface FormError {
  fieldId?: string;
  message: string;
}

export interface ErrorSummaryProps {
  errors: readonly FormError[];
  title?: string;
}

export const errorSummaryCopy = {
  title: "Hay errores en el formulario",
} as const;

export function ErrorSummary({
  errors,
  title = errorSummaryCopy.title,
}: ErrorSummaryProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <section
      role="alert"
      aria-label={title}
      tabIndex={-1}
      className="border-danger bg-surface-deep w-full max-w-full rounded-md border p-4"
    >
      <h2 className="text-body text-text font-semibold">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={`${error.fieldId ?? "message"}:${error.message}`}>
            {error.fieldId ? (
              <a
                href={`#${error.fieldId}`}
                className="text-body-sm text-danger inline-flex min-h-11 items-center underline underline-offset-2"
              >
                {error.message}
              </a>
            ) : (
              <span className="text-body-sm text-danger">{error.message}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
