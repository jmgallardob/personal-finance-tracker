# Revolut visual reference

These files are a local design snapshot supplied for visual analysis:

- `style-reference.md`: narrative guidance and documented components.
- `design-tokens.json`: tool-neutral source tokens.
- `tailwind-theme.css`: Tailwind CSS v4 token representation.
- `css-variables.css`: plain CSS custom-property representation.

## Usage

This is reference material, not production styling to import unchanged. Before
implementing UI, use it together with
`docs/04-diseno-visual-ux.md`. The project document is authoritative whenever
the two differ.

Adapt these characteristics:

- black canvas and subtly elevated dark surfaces;
- cobalt-violet primary actions;
- restrained but broad accent palette;
- rounded cards, pill controls, and clear component states;
- generous rhythm with compact application-level information density;
- strong typographic hierarchy.

Do not copy Revolut trademarks, imagery, proprietary assets, or marketing-page
display scale. Aeonik Pro is not included in this repository; use Inter or the
system sans-serif stack unless a licensed font is added later. Keep Spanish for
user-visible UI copy and English for implementation identifiers.

The JSON and both CSS files intentionally express the same token set in different
formats. Future production tokens should use semantic project names and derive
from these values rather than depending on the `revolut` reference path.
