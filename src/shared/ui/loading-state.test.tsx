import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingState, loadingStateCopy } from "./loading-state";

describe("LoadingState", () => {
  it("announces a polite Spanish loading status", () => {
    render(<LoadingState />);

    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(loadingStateCopy.default);
    expect(screen.getByText("Cargando…")).toBeVisible();
  });

  it("accepts a more specific loading message", () => {
    render(<LoadingState label="Cargando movimientos…" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando movimientos…",
    );
    expect(
      screen.queryByText(loadingStateCopy.default),
    ).not.toBeInTheDocument();
  });
});
