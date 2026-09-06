import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("exposes an accessible name and stays enabled in the default state", () => {
    render(<Button>Añadir gasto</Button>);

    const button = screen.getByRole("button", { name: "Añadir gasto" });

    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("focus-visible:outline-primary-bright");
    expect(button.className).toContain("h-12");
    expect(button.className).toContain("max-w-full");
  });

  it("does not invoke the action when disabled", () => {
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Añadir ingreso
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Añadir ingreso" });
    button.click();

    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("blocks repeated activation while pending", () => {
    const handleClick = vi.fn();

    render(
      <Button pending onClick={handleClick}>
        Guardar
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Guardar" });
    button.click();

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("keeps secondary and danger treatments distinct from the primary action", () => {
    const { rerender } = render(
      <Button variant="secondary">Guardar y añadir otro</Button>,
    );

    expect(
      screen.getByRole("button", { name: "Guardar y añadir otro" }),
    ).toHaveClass("border-border");

    rerender(
      <Button type="submit" variant="danger">
        Eliminar movimiento
      </Button>,
    );

    const dangerButton = screen.getByRole("button", {
      name: "Eliminar movimiento",
    });
    expect(dangerButton).toHaveAttribute("type", "submit");
    expect(dangerButton.className).toContain("border-danger");
    expect(dangerButton.className).not.toContain("bg-primary");
  });
});
