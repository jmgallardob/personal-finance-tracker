import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("accepts a value and keeps the accessible name", () => {
    render(<Input aria-label="Importe" defaultValue="12,50" />);

    const input = screen.getByRole("textbox", { name: "Importe" });

    expect(input).toHaveValue("12,50");
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: "30,00" } });
    expect(input).toHaveValue("30,00");
  });

  it("marks the control invalid and describes the failure", () => {
    render(
      <>
        <Input aria-label="Importe" aria-describedby="amount-error" invalid />
        <p id="amount-error">Introduce un importe válido</p>
      </>,
    );

    const input = screen.getByRole("textbox", { name: "Importe" });

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Introduce un importe válido");
    expect(input.className).toContain("border-danger");
  });

  it("exposes a disabled control that assistive technology can ignore", () => {
    render(
      <Input aria-label="Concepto" defaultValue="Supermercado" disabled />,
    );

    const input = screen.getByRole("textbox", { name: "Concepto" });

    expect(input).toBeDisabled();
    expect(input).toHaveValue("Supermercado");
  });

  it("uses tabular figures and a numeric keypad for amounts", () => {
    render(<Input aria-label="Importe" inputMode="decimal" tabular />);

    const input = screen.getByRole("textbox", { name: "Importe" });

    expect(input).toHaveAttribute("inputMode", "decimal");
    expect(input.className).toContain("tabular-nums");
    expect(input.className).toContain("h-14");
    expect(input.className).toContain("max-w-full");
    expect(input.className).toContain("focus-visible:outline-primary-bright");
  });
});
