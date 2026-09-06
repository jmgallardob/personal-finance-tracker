import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorPage, { errorPageCopy } from "./error";

describe("ErrorPage", () => {
  it("offers a recoverable retry without exposing error details", async () => {
    const reset = vi.fn();
    render(
      <ErrorPage
        error={Object.assign(new Error("detalle interno"), { digest: "abc" })}
        reset={reset}
      />,
    );

    expect(
      screen.getByRole("heading", { name: errorPageCopy.title }),
    ).toBeVisible();
    expect(screen.getByText(errorPageCopy.description)).toBeVisible();
    expect(screen.queryByText("detalle interno")).not.toBeInTheDocument();

    screen.getByRole("button", { name: errorPageCopy.action }).click();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
