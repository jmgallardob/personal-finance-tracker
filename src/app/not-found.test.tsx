import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NotFound, { notFoundCopy } from "./not-found";

vi.mock("next/link", () => ({
  default: function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

describe("NotFound", () => {
  it("explains the missing route and links back home", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: notFoundCopy.title }),
    ).toBeVisible();
    expect(screen.getByText(notFoundCopy.description)).toBeVisible();
    expect(
      screen.getByRole("link", { name: notFoundCopy.action }),
    ).toHaveAttribute("href", "/");
  });
});
