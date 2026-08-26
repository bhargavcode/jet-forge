export const SCHEMA_VERSION = 3 as const;

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

export type EnterAnimationType = "none" | "fade" | "slideUp" | "slideLeft" | "scale";

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

export type VisibleWhen = "always" | "loading" | "error" | "ready" | "empty" | "invalid";

export type CanvasState = "auto" | VisibleWhen;

export type WorkspaceMode = "design" | "prototype";

export type ActionType = "none" | "navigate" | "back" | "submitForm" | "retry" | "openUrl" | "callApi";

export type TouchEvent =
  | "tap"
  | "doubleTap"
  | "longPress"
  | "swipeLeft"
  | "swipeRight"
  | "swipeUp"
  | "swipeDown";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type BodyMode = "none" | "json" | "form" | "multipart";

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

export interface ClickAction {
  type: ActionType;
  screenId?: string;
  params?: Record<string, string>;
  url?: string;
  formId?: string;
  dataSourceId?: string;
}

export interface Interaction {
  event: TouchEvent;
  action: ClickAction;
}

export interface KeyValue {
  key: string;
  value: string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message: string;
}

export interface FormFieldSpec {
  formId: string;
  name: string;
  validation?: ValidationRule;
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
  itemBinding?: string;
  /** Prefer `interactions` with event `tap`. Kept so published v2 documents still run. */
  onClick?: ClickAction;
  interactions?: Interaction[];
  formField?: FormFieldSpec;
  visibleWhen?: VisibleWhen;
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  headerRows?: KeyValue[];
  queryRows?: KeyValue[];
  bodyMode?: BodyMode;
  body?: string;
  formRows?: KeyValue[];
  mock?: unknown;
  fallbackToMock?: boolean;
  simulateFailure?: boolean;
}

export interface AssetRef {
  id: string;
  name: string;
  kind: "image" | "icon";
  mime: string;
  url: string;
}

export interface ScreenDef {
  id: string;
  name: string;
  route: string;
  root: UiNode;
  dataSourceIds?: string[];
  emptyPath?: string;
  flowX?: number;
  flowY?: number;
}

export interface ScreenTheme {
  mode: "light" | "dark";
  seed: "purple" | "teal" | "blue" | "orange";
}

export interface ScreenDocument {
  schemaVersion: number;
  id: string;
  name: string;
  theme: ScreenTheme;
  dataSources: DataSource[];
  screens: ScreenDef[];
  startScreenId: string;
  root: UiNode;
  assets?: AssetRef[];
  publishedAt?: string;
}

export interface PublishedScreenSummary {
  id: string;
  name: string;
  publishedAt: string;
}

export const NONE_ACTION: ClickAction = { type: "none" };

export const TOUCH_EVENTS: TouchEvent[] = [
  "tap",
  "doubleTap",
  "longPress",
  "swipeLeft",
  "swipeRight",
  "swipeUp",
  "swipeDown",
];
