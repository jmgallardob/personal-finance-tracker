import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CategoriesPage from "./page";

describe("CategoriesPage", () => {
  it("explains that the catalog is not connected yet", () => {
    render(<CategoriesPage />);

    expect(screen.getByRole("heading", { name: "Categorías" })).toBeVisible();
    expect(
      screen.getByText(/se conectará cuando el catálogo esté disponible/i),
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
