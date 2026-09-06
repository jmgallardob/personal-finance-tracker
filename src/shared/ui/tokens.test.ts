import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  colorTokens,
  controlSizeTokens,
  fontFamilyTokens,
  radiusTokens,
  spaceTokens,
  typeScaleTokens,
} from "./tokens";

const globalsCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../app/globals.css"),
  "utf8",
);

function channelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function hexToRgb(hex: string): readonly [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb: readonly [number, number, number]): number {
  const [red, green, blue] = rgb.map(channelToLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function compositeOnBackground(
  foreground: readonly [number, number, number],
  alpha: number,
  background: readonly [number, number, number],
): readonly [number, number, number] {
  return [
    foreground[0] * alpha + background[0] * (1 - alpha),
    foreground[1] * alpha + background[1] * (1 - alpha),
    foreground[2] * alpha + background[2] * (1 - alpha),
  ];
}

describe("design tokens", () => {
  it("keeps the documented application type, space, radius and control scales", () => {
    expect(Object.values(typeScaleTokens)).toEqual([
      13, 14, 16, 18, 20, 24, 32, 40,
    ]);
    expect(Object.values(spaceTokens)).toEqual([4, 6, 8, 14, 16, 24, 32, 48]);
    expect(radiusTokens).toMatchObject({ sm: 8, md: 12, lg: 20, full: 9999 });
    expect(controlSizeTokens).toEqual({
      buttonHeight: 48,
      inputHeight: 56,
      minTouchTarget: 44,
    });
    expect(fontFamilyTokens.sans).toContain("Inter Variable");
  });

  it("meets WCAG 2.2 AA contrast for text and filled actions on dark surfaces", () => {
    const surface = hexToRgb(colorTokens.surface);
    const surfaceDeep = hexToRgb(colorTokens.surfaceDeep);
    const raised = hexToRgb(colorTokens.surfaceRaised);
    const text = hexToRgb(colorTokens.text);
    const muted = compositeOnBackground(text, 0.72, surface);
    const primary = hexToRgb(colorTokens.primary);
    const primaryBright = hexToRgb(colorTokens.primaryBright);
    const danger = hexToRgb(colorTokens.danger);
    const income = hexToRgb(colorTokens.income);
    const expense = hexToRgb(colorTokens.expense);

    expect(contrastRatio(text, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(text, raised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(muted, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(text, primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(text, primaryBright)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(danger, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(danger, surfaceDeep)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(income, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(expense, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(primary, surface)).toBeGreaterThanOrEqual(3);
  });

  it("exposes the same semantic colors in the global stylesheet", () => {
    expect(globalsCss).toContain("--color-surface: #000000");
    expect(globalsCss).toContain("--color-surface-deep: #0a0a0a");
    expect(globalsCss).toContain("--color-surface-raised: #16181a");
    expect(globalsCss).toContain("--color-surface-hover: #1f2226");
    expect(globalsCss).toContain("--color-text: #ffffff");
    expect(globalsCss).toContain("--color-text-muted: rgb(255 255 255 / 0.72)");
    expect(globalsCss).toContain("--color-primary: #494fdf");
    expect(globalsCss).toContain("--color-primary-bright: #4f55f1");
    expect(globalsCss).toContain("--color-income: #00a87e");
    expect(globalsCss).toContain("--color-expense: #e61e49");
    expect(globalsCss).toContain("--color-danger: #e23b4a");
    expect(globalsCss).toContain("--color-border: rgb(255 255 255 / 0.12)");
    expect(globalsCss).toContain('"Inter Variable"');
    expect(globalsCss).toContain(":focus-visible");
    expect(globalsCss).toContain("prefers-reduced-motion");
  });
});
