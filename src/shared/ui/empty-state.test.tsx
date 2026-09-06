import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";
import { EmptyState, emptyStateCopy } from "./empty-state";

describe("EmptyState", () => {
  it("explains how to add the first transaction", () => {
    render(
      <EmptyState
        title={emptyStateCopy.noTransactions.title}
        description={emptyStateCopy.noTransactions.description}
        action={<Button>{emptyStateCopy.noTransactions.actionLabel}</Button>}
      />,
    );

    expect(
      screen.getByRole("region", {
        name: "Aún no hay movimientos",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Aún no hay movimientos" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Añade tu primer gasto o ingreso para empezar a seguir tus finanzas.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Añadir movimiento" }),
    ).toBeEnabled();
  });

  it("keeps no-results and insufficient-history copy actionable without a control", () => {
    const { rerender } = render(
      <EmptyState
        title={emptyStateCopy.noResults.title}
        description={emptyStateCopy.noResults.description}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Sin resultados" }),
    ).toBeVisible();
    expect(
      screen.getByText("Prueba a cambiar la búsqueda o los filtros."),
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <EmptyState
        title={emptyStateCopy.insufficientHistory.title}
        description={emptyStateCopy.insufficientHistory.description}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Sin histórico suficiente" }),
    ).toBeVisible();
  });

  it("does not activate a disabled empty-state action", () => {
    const handleClick = vi.fn();

    render(
      <EmptyState
        title={emptyStateCopy.noTransactions.title}
        description={emptyStateCopy.noTransactions.description}
        action={
          <Button disabled onClick={handleClick}>
            {emptyStateCopy.noTransactions.actionLabel}
          </Button>
        }
      />,
    );

    const action = screen.getByRole("button", { name: "Añadir movimiento" });
    action.click();

    expect(action).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
