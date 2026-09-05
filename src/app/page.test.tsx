import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("explains the purpose and current state of the application", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Tu espacio financiero está en camino.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/registrar tus movimientos y entender mejor/i),
    ).toBeVisible();
  });
});
