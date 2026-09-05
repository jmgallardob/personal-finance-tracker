import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RootLayout, { metadata } from "./layout";

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
  });
});
