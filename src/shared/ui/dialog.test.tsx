import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";
import { DialogShell } from "./dialog";

function DialogHarness({
  description,
  pending = false,
  onOpenChange,
}: {
  description?: string;
  pending?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Añadir movimiento
      </Button>
      <DialogShell
        description={description}
        open={open}
        preventClose={pending}
        title="Nuevo movimiento"
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          onOpenChange?.(nextOpen);
        }}
      >
        <p>Completa los datos del movimiento.</p>
      </DialogShell>
    </>
  );
}

describe("DialogShell", () => {
  it("opens one labelled dialog as a bottom sheet that becomes centered on desktop", async () => {
    const user = userEvent.setup();
    render(
      <DialogHarness description="Introduce el importe y la categoría." />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Añadir movimiento" }));

    const dialog = screen.getByRole("dialog", { name: "Nuevo movimiento" });

    expect(dialog).toHaveAccessibleDescription(
      "Introduce el importe y la categoría.",
    );
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(dialog.className).toContain("bottom-0");
    expect(dialog.className).toContain("sm:left-1/2");
    expect(dialog.className).toContain("max-w-full");
    expect(document.querySelector("[data-dialog-overlay]")).toBeInTheDocument();
  });

  it("restores focus to the opener after Escape closes the dialog", async () => {
    const user = userEvent.setup();
    render(
      <DialogHarness description="Introduce el importe y la categoría." />,
    );

    const opener = screen.getByRole("button", { name: "Añadir movimiento" });
    await user.click(opener);
    expect(screen.getByRole("dialog")).toBeVisible();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("keeps the dialog open and locked while close is prevented", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <DialogShell
        open
        preventClose
        title="Nuevo movimiento"
        description="Introduce el importe y la categoría."
        onOpenChange={handleOpenChange}
      />,
    );

    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("dialog", { name: "Nuevo movimiento" }),
    ).toBeVisible();
    expect(handleOpenChange).not.toHaveBeenCalled();

    const overlay = document.querySelector("[data-dialog-overlay]");
    expect(overlay).not.toBeNull();
    if (overlay) {
      await user.click(overlay);
    }

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(handleOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
  });

  it("renders a titled shell without actions when none are provided", () => {
    render(
      <DialogShell
        open
        showCloseButton={false}
        title="Cargando filtros"
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Cargando filtros" }),
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses a visually hidden description when the consumer omits one", () => {
    render(<DialogShell open title="Filtros" onOpenChange={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Filtros" }),
    ).toHaveAccessibleDescription("Filtros");
    expect(
      screen.queryByRole("button", { name: "Cerrar" }),
    ).toBeInTheDocument();
  });
});
