import type { ReactNode } from "react";

export const emptyStateCopy = {
  noTransactions: {
    title: "Aún no hay movimientos",
    description:
      "Añade tu primer gasto o ingreso para empezar a seguir tus finanzas.",
    actionLabel: "Añadir movimiento",
  },
  noResults: {
    title: "Sin resultados",
    description: "Prueba a cambiar la búsqueda o los filtros.",
  },
  insufficientHistory: {
    title: "Sin histórico suficiente",
    description:
      "Las medias mensuales aparecerán cuando exista al menos un mes cerrado.",
  },
} as const;

export interface EmptyStateProps {
  action?: ReactNode;
  description: string;
  title: string;
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <section
      aria-label={title}
      className="border-border bg-surface-raised flex w-full max-w-full flex-col items-start gap-3 rounded-lg border p-6"
    >
      <h2 className="text-heading-sm text-text font-medium">{title}</h2>
      <p className="text-body text-text-muted max-w-xl">{description}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  );
}
