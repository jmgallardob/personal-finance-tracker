import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";

const deleteDescription =
  "Se eliminará Supermercado · 6 sep. 2026 · −12,50 €. Esta acción no se puede deshacer.";

function DeleteConfirmHarness({
  error,
  pending = false,
  onCancel,
  onConfirm,
}: {
  error?: string;
  pending?: boolean;
  onCancel?: () => void;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Eliminar
      </Button>
      <ConfirmDialog
        confirmLabel="Eliminar movimiento"
        description={deleteDescription}
        error={error}
        open={open}
        pending={pending}
        title="¿Eliminar este movimiento?"
        onCancel={onCancel}
        onConfirm={onConfirm}
        onOpenChange={setOpen}
      />
    </>
  );
}

describe("ConfirmDialog", () => {
  it("confirms a destructive action from the opened dialog", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <DeleteConfirmHarness
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    const dialog = screen.getByRole("dialog", {
      name: "¿Eliminar este movimiento?",
    });
    expect(dialog).toHaveAccessibleDescription(deleteDescription);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: "Eliminar movimiento" }),
    );

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleCancel).not.toHaveBeenCalled();
  });

  it("cancels from the keyboard and never invokes the action", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <DeleteConfirmHarness
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />,
    );

    const opener = screen.getByRole("button", { name: "Eliminar" });
    await user.click(opener);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(handleConfirm).not.toHaveBeenCalled();
    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
  });

  it("cancels with the explicit control and restores focus", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <DeleteConfirmHarness
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />,
    );

    const opener = screen.getByRole("button", { name: "Eliminar" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(handleConfirm).not.toHaveBeenCalled();
    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
  });

  it("blocks confirm, cancel and dismiss while pending", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    const handleOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open
        pending
        confirmLabel="Desactivar recurrencia"
        confirmVariant="primary"
        description="La regla Alquiler dejará de generar copias y conservará el histórico."
        title="¿Desactivar esta recurrencia?"
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        onOpenChange={handleOpenChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Desactivar recurrencia" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.keyboard("{Escape}");

    expect(handleConfirm).not.toHaveBeenCalled();
    expect(handleCancel).not.toHaveBeenCalled();
    expect(handleOpenChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "¿Desactivar esta recurrencia?" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Desactivar recurrencia" }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("keeps the dialog open and the error visible after a failed action", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <ConfirmDialog
        open
        confirmLabel="Eliminar movimiento"
        description={deleteDescription}
        error="No se ha podido eliminar el movimiento."
        title="¿Eliminar este movimiento?"
        onConfirm={handleConfirm}
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("alert", { name: "Hay errores en el formulario" }),
    ).toHaveTextContent("No se ha podido eliminar el movimiento.");
    expect(
      screen.getByRole("dialog", { name: "¿Eliminar este movimiento?" }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Eliminar movimiento" }),
    );

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("dialog", { name: "¿Eliminar este movimiento?" }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toBeVisible();
  });
});
