export const SCHEMA_VERSION = 1 as const;

export type NodeType =
  | "Scaffold"
  | "Column"
  | "Row"
  | "Box"
  | "LazyColumn"
  | "TopAppBar"
  | "NavigationBar"
  | "NavigationBarItem"
  | "Card"
  | "Text"
  | "FilledButton"
  | "OutlinedButton"
  | "TextButton"
  | "FAB"
  | "TextField"
  | "Image"
  | "Icon"
  | "Chip"
  | "Switch"
  | "Checkbox"
  | "Divider"
  | "Spacer"
  | "ListItem"
  | "CircularProgress";

export type SlotName = "topBar" | "content" | "bottomBar" | "fab";

export type TextStyle =
  | "displayLarge"
  | "headlineMedium"
  | "titleLarge"
  | "titleMedium"
  | "bodyLarge"
  | "bodyMedium"
  | "labelLarge"
  | "labelMedium";

export type ColorToken =
  | "primary"
  | "onPrimary"
  | "primaryContainer"
  | "onPrimaryContainer"
  | "secondary"
  | "onSecondary"
  | "surface"
  | "onSurface"
  | "onSurfaceVariant"
  | "surfaceContainer"
  | "surfaceContainerHigh"
  | "outline"
  | "error"
  | "tertiary";

export type EnterAnimationType =
  | "none"
  | "fade"
  | "slideUp"
  | "slideLeft"
  | "scale";

export type IconName =
  | "home"
  | "search"
  | "cart"
  | "person"
  | "add"
  | "favorite"
  | "star"
  | "settings"
  | "back"
  | "menu"
  | "notifications"
  | "tune";

export interface PaddingSpec {
  all?: number;
  start?: number;
  top?: number;
  end?: number;
  bottom?: number;
}

export interface ModifierSpec {
  fillMaxWidth?: boolean;
  fillMaxHeight?: boolean;
  widthDp?: number;
  heightDp?: number;
  weight?: number;
  padding?: PaddingSpec;
  clip?: "none" | "extraSmall" | "small" | "medium" | "large" | "full";
}

export interface EnterAnimation {
  type: EnterAnimationType;
  durationMs: number;
  delayMs: number;
  staggerMs?: number;
}

export interface UiNode {
  id: string;
  type: NodeType;
  props: Record<string, string | number | boolean | null>;
  modifiers: ModifierSpec;
  animation?: EnterAnimation;
  bindings?: Record<string, string>;
  children?: UiNode[];
  slot?: SlotName;
  /** JSON path to an array, e.g. `catalog.products`. Children render once per item. */
  itemBinding?: string;
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  mock?: unknown;
}

export interface ScreenTheme {
  mode: "light" | "dark";
  seed: "purple" | "teal" | "blue" | "orange";
}

export interface ScreenDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  theme: ScreenTheme;
  dataSources: DataSource[];
  root: UiNode;
  publishedAt?: string;
}

export interface PublishedScreenSummary {
  id: string;
  name: string;
  publishedAt: string;
}
