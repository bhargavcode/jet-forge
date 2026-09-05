export const SCHEMA_VERSION = 11 as const;

export type NodeType =
  | "Scaffold"
  | "Column"
  | "Row"
  | "Box"
  | "LazyColumn"
  | "LazyRow"
  | "LazyVerticalGrid"
  | "Surface"
  | "HorizontalPager"
  | "PullRefresh"
  | "TopAppBar"
  | "NavigationBar"
  | "NavigationBarItem"
  | "NavigationRail"
  | "NavigationRailItem"
  | "NavigationDrawer"
  | "TabRow"
  | "Tab"
  | "Card"
  | "Text"
  | "FilledButton"
  | "OutlinedButton"
  | "TextButton"
  | "TonalButton"
  | "ElevatedButton"
  | "SegmentedButton"
  | "SegmentedButtonItem"
  | "FAB"
  | "TextField"
  | "SearchBar"
  | "Image"
  | "Icon"
  | "Chip"
  | "Switch"
  | "Checkbox"
  | "Slider"
  | "RadioButton"
  | "DropdownMenu"
  | "DropdownMenuItem"
  | "ExposedDropdownMenu"
  | "IconButton"
  | "Dialog"
  | "BottomSheet"
  | "Snackbar"
  | "Tooltip"
  | "Badge"
  | "Divider"
  | "Spacer"
  | "ListItem"
  | "CircularProgress"
  | "LinearProgressIndicator"
  | "DatePicker"
  | "TimePicker";

export type ScrollAxis = "none" | "vertical" | "horizontal";

export type SlotName = "topBar" | "content" | "bottomBar" | "fab" | "rail";

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
  | "secondaryContainer"
  | "onSecondaryContainer"
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
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "slideOutUp"
  | "slideOutLeft"
  | "scale"
  | "bounce"
  | "bounceIn"
  | "colorPulse"
  | "elevationPulse"
  | "cardSlide";

export type AnimationEasing = "standard" | "emphasized" | "bounce" | "linear";

export type AnimationRepeat = "none" | "infinite";

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
export type CanvasViewMode = "preview" | "blueprint";

export type PreviewDevicePreset = import("./preview-config").PreviewDevicePreset;
export type PreviewUiMode = import("./preview-config").PreviewUiMode;
export type PreviewConfig = import("./preview-config").PreviewConfig;

export type ActionType = "none" | "navigate" | "back" | "submitForm" | "retry" | "openUrl" | "callApi" | "focusNode";

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

export interface MarginSpec {
  all?: number;
  start?: number;
  top?: number;
  end?: number;
  bottom?: number;
}

export type HorizontalConstraint = "start" | "center" | "end" | "stretch";
export type VerticalConstraint = "top" | "center" | "bottom" | "stretch";
export type SizeMode = "wrap" | "fill" | "fixed";

/** Flow-layout alignment hints for Column/Row/Box children (not ConstraintLayout). */
export interface ConstraintSpec {
  horizontal?: HorizontalConstraint;
  vertical?: VerticalConstraint;
  margin?: MarginSpec;
}

export const ARRANGEMENTS = [
  "Top",
  "Bottom",
  "Start",
  "End",
  "Center",
  "SpaceBetween",
  "SpaceAround",
  "SpaceEvenly",
] as const;
export type ArrangementName = (typeof ARRANGEMENTS)[number];

export const ALIGNMENTS = [
  "Top",
  "Bottom",
  "Start",
  "End",
  "Center",
  "CenterHorizontally",
  "CenterVertically",
  "TopStart",
  "TopCenter",
  "TopEnd",
  "CenterStart",
  "CenterEnd",
  "BottomStart",
  "BottomCenter",
  "BottomEnd",
] as const;
export type AlignmentName = (typeof ALIGNMENTS)[number];

export const ALIGN_BY_VALUES = ["firstBaseline", "lastBaseline", "centerVertically", "top", "bottom"] as const;
export type AlignByValue = (typeof ALIGN_BY_VALUES)[number];

export const COLUMN_ARRANGEMENTS: ArrangementName[] = [
  "Top",
  "Bottom",
  "Center",
  "SpaceBetween",
  "SpaceAround",
  "SpaceEvenly",
];
export const ROW_ARRANGEMENTS: ArrangementName[] = [
  "Start",
  "End",
  "Center",
  "SpaceBetween",
  "SpaceAround",
  "SpaceEvenly",
];
export const COLUMN_ALIGNMENTS: AlignmentName[] = ["Start", "End", "CenterHorizontally", "Center"];
export const ROW_ALIGNMENTS: AlignmentName[] = ["Top", "Bottom", "CenterVertically", "Center"];
export const BOX_ALIGNMENTS: AlignmentName[] = [
  "TopStart",
  "TopCenter",
  "TopEnd",
  "CenterStart",
  "Center",
  "CenterEnd",
  "BottomStart",
  "BottomCenter",
  "BottomEnd",
];

export interface ModifierSpec {
  fillMaxWidth?: boolean;
  fillMaxHeight?: boolean;
  /** Convenience: both axes fill (Compose fillMaxSize). */
  fillMaxSize?: boolean;
  /** Modifier.fillMaxSize(fraction) — 0..1, default 1. */
  fillMaxSizeFraction?: number;
  /** Modifier.fillMaxWidth(fraction) — 0..1, default 1. */
  fillMaxWidthFraction?: number;
  /** Modifier.fillMaxHeight(fraction) — 0..1, default 1. */
  fillMaxHeightFraction?: number;
  widthMode?: SizeMode;
  heightMode?: SizeMode;
  widthDp?: number;
  heightDp?: number;
  /** Modifier.size(dp) — both axes when width/height are unset. */
  sizeDp?: number;
  minWidthDp?: number;
  maxWidthDp?: number;
  minHeightDp?: number;
  maxHeightDp?: number;
  /** Modifier.defaultMinSize */
  defaultMinWidthDp?: number;
  defaultMinHeightDp?: number;
  /** Modifier.requiredWidth / requiredHeight / requiredSize */
  requiredWidthDp?: number;
  requiredHeightDp?: number;
  requiredSizeDp?: number;
  wrapContentSize?: boolean;
  wrapContentSizeAlign?: AlignmentName;
  wrapContentSizeUnbounded?: boolean;
  wrapContentWidth?: boolean;
  wrapContentWidthAlign?: AlignmentName;
  wrapContentWidthUnbounded?: boolean;
  wrapContentHeight?: boolean;
  wrapContentHeightAlign?: AlignmentName;
  wrapContentHeightUnbounded?: boolean;
  /** Width / height aspect ratio, e.g. 1.5. */
  aspectRatio?: number;
  aspectRatioMatchHeightFirst?: boolean;
  /** ColumnScope/RowScope Modifier.weight */
  weight?: number;
  /** Compose weight(fill) — default true. */
  weightFill?: boolean;
  /** ColumnScope/RowScope/BoxScope Modifier.align */
  align?: AlignmentName;
  /** RowScope Modifier.alignBy */
  alignBy?: AlignByValue;
  alignByBaseline?: boolean;
  padding?: PaddingSpec;
  margin?: MarginSpec;
  clip?: "none" | "extraSmall" | "small" | "medium" | "large" | "full";
  clipToBounds?: boolean;
  alpha?: number;
  rotationDeg?: number;
  offsetXDp?: number;
  offsetYDp?: number;
  elevationDp?: number;
  zIndex?: number;
  backgroundToken?: ColorToken;
  backgroundHex?: string;
  borderWidthDp?: number;
  borderToken?: ColorToken;
  /** Modifier.graphicsLayer */
  graphicsScaleX?: number;
  graphicsScaleY?: number;
  graphicsTranslationX?: number;
  graphicsTranslationY?: number;
  graphicsRotationX?: number;
  graphicsRotationY?: number;
  graphicsRotationZ?: number;
  graphicsShadowElevation?: number;
  graphicsClip?: boolean;
  /** Modifier.clickable — show ripple / pointer affordance in design preview. */
  clickable?: boolean;
  rippleEnabled?: boolean;
  combinedClickable?: boolean;
  selectable?: boolean;
  selected?: boolean;
  toggleable?: boolean;
  toggled?: boolean;
  interactionEnabled?: boolean;
  onClickLabel?: string;
  semanticsMergeDescendants?: boolean;
  semanticsLabel?: string;
  scrollAxis?: ScrollAxis;
  /** Modifier.verticalScroll / horizontalScroll extras */
  verticalScroll?: boolean;
  horizontalScroll?: boolean;
  scrollEnabled?: boolean;
  reverseScrolling?: boolean;
  imePadding?: boolean;
  systemBarsPadding?: boolean;
}

export interface ComponentDef {
  id: string;
  name: string;
  root: UiNode;
  description?: string;
}

export type DrawableType = "none" | "color" | "gradient" | "image";

export interface DrawableSpec {
  type: DrawableType;
  colorToken?: ColorToken;
  colorHex?: string;
  startHex?: string;
  endHex?: string;
  angle?: number;
  url?: string;
  assetId?: string;
  tintToken?: ColorToken;
}

export interface EnterAnimation {
  type: EnterAnimationType;
  durationMs: number;
  delayMs: number;
  staggerMs?: number;
  easing?: AnimationEasing;
  repeat?: AnimationRepeat;
  colorFrom?: string;
  colorTo?: string;
  moveXDp?: number;
  moveYDp?: number;
}

export interface ClickAction {
  type: ActionType;
  screenId?: string;
  nodeId?: string;
  params?: Record<string, string>;
  url?: string;
  formId?: string;
  dataSourceId?: string;
}

export type VisibleIfOp = "truthy" | "falsy" | "equals" | "notEquals" | "empty" | "notEmpty";

export interface VisibleIf {
  path: string;
  op?: VisibleIfOp;
  value?: string;
}

export interface KotlinModelField {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface KotlinDataModel {
  id: string;
  name: string;
  kotlin: string;
  fields: KotlinModelField[];
  sourceId?: string;
  listPath?: string;
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
  constraints?: ConstraintSpec;
  animation?: EnterAnimation;
  drawable?: DrawableSpec;
  bindings?: Record<string, string>;
  children?: UiNode[];
  slot?: SlotName;
  itemBinding?: string;
  /** API sources fetched when this node (or its screen) is shown. */
  dataSourceIds?: string[];
  /** Reference to a reusable component master. */
  refComponentId?: string;
  /** Prefer `interactions` with event `tap`. Kept so published v2 documents still run. */
  onClick?: ClickAction;
  interactions?: Interaction[];
  formField?: FormFieldSpec;
  visibleWhen?: VisibleWhen;
  visibleIf?: VisibleIf;
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
  components?: ComponentDef[];
  assets?: AssetRef[];
  dataModels?: KotlinDataModel[];
  activeModelId?: string;
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
