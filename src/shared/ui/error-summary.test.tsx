import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";
import { ErrorSummary } from "./error-summary";
import { Field } from "./field";
import { Input } from "./input";

describe("ErrorSummary", () => {
  it("does not announce an alert when there are no errors", () => {
    const { container } = render(<ErrorSummary errors={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists field errors and links each message to its control", () => {
    render(
      <ErrorSummary
        errors={[
          { fieldId: "amount", message: "Introduce un importe válido" },
          { message: "No se ha podido guardar el movimiento" },
        ]}
      />,
    );

    const summary = screen.getByRole("alert", {
      name: "Hay errores en el formulario",
    });

    expect(summary).toHaveAttribute("tabIndex", "-1");
    expect(
      screen.getByRole("link", { name: "Introduce un importe válido" }),
    ).toHaveAttribute("href", "#amount");
    expect(
      screen.getByText("No se ha podido guardar el movimiento"),
    ).not.toHaveAttribute("href");
    expect(
      screen.queryByRole("link", {
        name: "No se ha podido guardar el movimiento",
      }),
    ).not.toBeInTheDocument();
  });

  it("connects the summary, invalid field and submit action in one form", () => {
    render(
      <form>
        <ErrorSummary
          title="Revisa los datos"
          errors={[
            { fieldId: "amount", message: "Introduce un importe válido" },
          ]}
        />
        <Field
          id="amount"
          label="Importe"
          error="Introduce un importe válido"
          required
        >
          <Input name="amount" inputMode="decimal" tabular />
        </Field>
        <Button type="submit">Añadir gasto</Button>
      </form>,
    );

    expect(
      screen.getByRole("alert", { name: "Revisa los datos" }),
    ).toBeVisible();
    expect(screen.getByLabelText(/Importe/)).toBeInvalid();
    expect(
      screen.getByRole("button", { name: "Añadir gasto" }),
    ).toHaveAttribute("type", "submit");
  });
});
