import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TransactionsPage from "./page";

describe("TransactionsPage", () => {
  it("explains that the history is not connected yet", () => {
    render(<TransactionsPage />);

    expect(screen.getByRole("heading", { name: "Movimientos" })).toBeVisible();
    expect(
      screen.getByText(/se conectará cuando el registro esté disponible/i),
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
