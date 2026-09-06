"use client";

import { Button } from "../shared/ui/button";

export const errorPageCopy = {
  action: "Reintentar",
  description:
    "Ha ocurrido un problema al mostrar el contenido. Puedes reintentarlo.",
  title: "No se ha podido cargar esta página",
} as const;

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <section
      aria-labelledby="error-title"
      className="border-border bg-surface-raised w-full max-w-xl rounded-lg border p-6"
    >
      <h1 id="error-title" className="text-heading-sm text-text font-medium">
        {errorPageCopy.title}
      </h1>
      <p className="text-body text-text-muted mt-3">
        {errorPageCopy.description}
      </p>
      <div className="mt-6">
        <Button onClick={reset}>{errorPageCopy.action}</Button>
      </div>
    </section>
  );
}
