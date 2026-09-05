export type SeedName = "purple" | "teal" | "blue" | "orange";

export interface MaterialScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerLowest: string;
  outline: string;
  outlineVariant: string;
  error: string;
  inverseSurface: string;
  inverseOnSurface: string;
}

const light: Record<SeedName, MaterialScheme> = {
  purple: {
    primary: "#6750A4",
    onPrimary: "#FFFFFF",
    primaryContainer: "#EADDFF",
    onPrimaryContainer: "#21005D",
    secondary: "#625B71",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#E8DEF8",
    onSecondaryContainer: "#1D192B",
    tertiary: "#7D5260",
    onTertiary: "#FFFFFF",
    surface: "#FEF7FF",
    onSurface: "#1D1B20",
    onSurfaceVariant: "#49454F",
    surfaceContainer: "#F3EDF7",
    surfaceContainerHigh: "#ECE6F0",
    surfaceContainerLowest: "#FFFFFF",
    outline: "#79747E",
    outlineVariant: "#CAC4D0",
    error: "#B3261E",
    inverseSurface: "#322F35",
    inverseOnSurface: "#F5EFF7",
  },
  teal: {
    primary: "#006A6A",
    onPrimary: "#FFFFFF",
    primaryContainer: "#6FF7F6",
    onPrimaryContainer: "#002020",
    secondary: "#4A6363",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#CCF2F1",
    onSecondaryContainer: "#051F1F",
    tertiary: "#4B607C",
    onTertiary: "#FFFFFF",
    surface: "#F4FBFA",
    onSurface: "#161D1D",
    onSurfaceVariant: "#3F4948",
    surfaceContainer: "#E9EFEE",
    surfaceContainerHigh: "#E3E9E8",
    surfaceContainerLowest: "#FFFFFF",
    outline: "#6F7978",
    outlineVariant: "#BEC9C8",
    error: "#BA1A1A",
    inverseSurface: "#2B3231",
    inverseOnSurface: "#ECF2F1",
  },
  blue: {
    primary: "#005DB7",
    onPrimary: "#FFFFFF",
    primaryContainer: "#D6E3FF",
    onPrimaryContainer: "#001B3D",
    secondary: "#555F71",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#DAE2F9",
    onSecondaryContainer: "#101C2B",
    tertiary: "#6E5676",
    onTertiary: "#FFFFFF",
    surface: "#F9F9FF",
    onSurface: "#1A1C1E",
    onSurfaceVariant: "#43474E",
    surfaceContainer: "#EEEFF4",
    surfaceContainerHigh: "#E8E8ED",
    surfaceContainerLowest: "#FFFFFF",
    outline: "#74777F",
    outlineVariant: "#C4C6CF",
    error: "#BA1A1A",
    inverseSurface: "#2F3033",
    inverseOnSurface: "#F0F0F4",
  },
  orange: {
    primary: "#8B5000",
    onPrimary: "#FFFFFF",
    primaryContainer: "#FFDCBE",
    onPrimaryContainer: "#2C1600",
    secondary: "#725A42",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#FFDCBE",
    onSecondaryContainer: "#2C1600",
    tertiary: "#586338",
    onTertiary: "#FFFFFF",
    surface: "#FFF8F4",
    onSurface: "#201B16",
    onSurfaceVariant: "#51443A",
    surfaceContainer: "#F5EBE4",
    surfaceContainerHigh: "#EFE5DE",
    surfaceContainerLowest: "#FFFFFF",
    outline: "#837468",
    outlineVariant: "#D5C3B5",
    error: "#BA1A1A",
    inverseSurface: "#362F2B",
    inverseOnSurface: "#FBEEE6",
  },
};

const dark: Record<SeedName, MaterialScheme> = {
  purple: {
    primary: "#D0BCFF",
    onPrimary: "#381E72",
    primaryContainer: "#4F378B",
    onPrimaryContainer: "#EADDFF",
    secondary: "#CCC2DC",
    onSecondary: "#332D41",
    secondaryContainer: "#4A4458",
    onSecondaryContainer: "#E8DEF8",
    tertiary: "#EFB8C8",
    onTertiary: "#492532",
    surface: "#141218",
    onSurface: "#E6E0E9",
    onSurfaceVariant: "#CAC4D0",
    surfaceContainer: "#211F26",
    surfaceContainerHigh: "#2B2930",
    surfaceContainerLowest: "#0F0D13",
    outline: "#938F99",
    outlineVariant: "#49454F",
    error: "#F2B8B5",
    inverseSurface: "#E6E0E9",
    inverseOnSurface: "#322F35",
  },
  teal: {
    primary: "#4CDADA",
    onPrimary: "#003737",
    primaryContainer: "#004F4F",
    onPrimaryContainer: "#6FF7F6",
    secondary: "#B0CCCC",
    onSecondary: "#1B3535",
    secondaryContainer: "#334B4B",
    onSecondaryContainer: "#CCF2F1",
    tertiary: "#B3C8E8",
    onTertiary: "#24324A",
    surface: "#0E1514",
    onSurface: "#DDE4E3",
    onSurfaceVariant: "#BEC9C8",
    surfaceContainer: "#1A2120",
    surfaceContainerHigh: "#252B2B",
    surfaceContainerLowest: "#090F0F",
    outline: "#889392",
    outlineVariant: "#3F4948",
    error: "#FFB4AB",
    inverseSurface: "#DDE4E3",
    inverseOnSurface: "#2B3231",
  },
  blue: {
    primary: "#A9C7FF",
    onPrimary: "#003063",
    primaryContainer: "#00468C",
    onPrimaryContainer: "#D6E3FF",
    secondary: "#BDC7DC",
    onSecondary: "#273141",
    secondaryContainer: "#3E4759",
    onSecondaryContainer: "#DAE2F9",
    tertiary: "#DABCE2",
    onTertiary: "#3F2844",
    surface: "#111318",
    onSurface: "#E2E2E6",
    onSurfaceVariant: "#C4C6CF",
    surfaceContainer: "#1D2024",
    surfaceContainerHigh: "#272A2F",
    surfaceContainerLowest: "#0C0E13",
    outline: "#8E9099",
    outlineVariant: "#43474E",
    error: "#FFB4AB",
    inverseSurface: "#E2E2E6",
    inverseOnSurface: "#2F3033",
  },
  orange: {
    primary: "#FFB870",
    onPrimary: "#4A2800",
    primaryContainer: "#693C00",
    onPrimaryContainer: "#FFDCBE",
    secondary: "#E1C0A5",
    onSecondary: "#402C18",
    secondaryContainer: "#693C00",
    onSecondaryContainer: "#FFDCBE",
    tertiary: "#C0CC97",
    onTertiary: "#2D340F",
    surface: "#18120D",
    onSurface: "#EDE0D8",
    onSurfaceVariant: "#D5C3B5",
    surfaceContainer: "#251E19",
    surfaceContainerHigh: "#302923",
    surfaceContainerLowest: "#120D09",
    outline: "#9E8E81",
    outlineVariant: "#51443A",
    error: "#FFB4AB",
    inverseSurface: "#EDE0D8",
    inverseOnSurface: "#362F2B",
  },
};

export function getScheme(seed: SeedName, mode: "light" | "dark"): MaterialScheme {
  return mode === "dark" ? dark[seed] : light[seed];
}

export function schemeToCssVars(scheme: MaterialScheme): Record<string, string> {
  return {
    "--md-primary": scheme.primary,
    "--md-on-primary": scheme.onPrimary,
    "--md-primary-container": scheme.primaryContainer,
    "--md-on-primary-container": scheme.onPrimaryContainer,
    "--md-secondary": scheme.secondary,
    "--md-on-secondary": scheme.onSecondary,
    "--md-secondary-container": scheme.secondaryContainer,
    "--md-on-secondary-container": scheme.onSecondaryContainer,
    "--md-tertiary": scheme.tertiary,
    "--md-on-tertiary": scheme.onTertiary,
    "--md-surface": scheme.surface,
    "--md-on-surface": scheme.onSurface,
    "--md-on-surface-variant": scheme.onSurfaceVariant,
    "--md-surface-container": scheme.surfaceContainer,
    "--md-surface-container-high": scheme.surfaceContainerHigh,
    "--md-surface-container-lowest": scheme.surfaceContainerLowest,
    "--md-outline": scheme.outline,
    "--md-outline-variant": scheme.outlineVariant,
    "--md-error": scheme.error,
    "--md-inverse-surface": scheme.inverseSurface,
    "--md-inverse-on-surface": scheme.inverseOnSurface,
  };
}

export const SEED_OPTIONS: { id: SeedName; label: string; swatch: string }[] = [
  { id: "purple", label: "Purple", swatch: "#6750A4" },
  { id: "teal", label: "Teal", swatch: "#006A6A" },
  { id: "blue", label: "Blue", swatch: "#005DB7" },
  { id: "orange", label: "Orange", swatch: "#8B5000" },
];
