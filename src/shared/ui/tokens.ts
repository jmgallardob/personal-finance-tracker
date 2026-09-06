export const colorTokens = {
  surface: "#000000",
  surfaceDeep: "#0A0A0A",
  surfaceRaised: "#16181A",
  surfaceHover: "#1F2226",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.72)",
  primary: "#494FDF",
  primaryBright: "#4F55F1",
  income: "#00A87E",
  expense: "#E61E49",
  danger: "#E23B4A",
  border: "rgba(255,255,255,0.12)",
} as const;

export const typeScaleTokens = {
  caption: 13,
  bodySm: 14,
  body: 16,
  bodyLg: 18,
  headingSm: 20,
  heading: 24,
  headingLg: 32,
  display: 40,
} as const;

export const spaceTokens = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 14,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radiusTokens = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

export const controlSizeTokens = {
  buttonHeight: 48,
  inputHeight: 56,
  minTouchTarget: 44,
} as const;

export const fontFamilyTokens = {
  sans: '"Inter Variable", Inter, system-ui, sans-serif',
} as const;
