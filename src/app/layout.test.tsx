import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import RootLayout, { metadata } from "./layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

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

describe("RootLayout", () => {
  it("declares Spanish document metadata", () => {
    expect(metadata).toMatchObject({
      title: "Mis finanzas",
      description: "Una visión privada y clara de tus finanzas personales.",
    });
  });

  it("renders a Spanish document containing the page content", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <p>Contenido financiero</p>
      </RootLayout>,
    );

    expect(markup).toContain('<html lang="es">');
    expect(markup).toContain("Contenido financiero");
    expect(markup).toContain("Inicio");
    expect(markup).toContain("Movimientos");
    expect(markup).toContain("Categorías");
    expect(markup).toContain('href="/transactions"');
  });
});
