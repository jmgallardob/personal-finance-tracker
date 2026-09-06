import Link from "next/link";

export const notFoundCopy = {
  action: "Volver al inicio",
  description: "Esa dirección no existe en Mis finanzas.",
  title: "Página no encontrada",
} as const;

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="border-border bg-surface-raised w-full max-w-xl rounded-lg border p-6"
    >
      <h1
        id="not-found-title"
        className="text-heading-sm text-text font-medium"
      >
        {notFoundCopy.title}
      </h1>
      <p className="text-body text-text-muted mt-3">
        {notFoundCopy.description}
      </p>
      <Link
        className="border-border text-text hover:bg-surface-hover mt-6 inline-flex min-h-11 items-center justify-center rounded-full border px-7 text-base font-semibold"
        href="/"
      >
        {notFoundCopy.action}
      </Link>
    </section>
  );
}
