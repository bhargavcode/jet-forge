import { nanoid } from "nanoid";
import type { EnterAnimation, NodeType, UiNode } from "./schema";

export interface CatalogItem {
  type: NodeType;
  label: string;
  group: "Layout" | "Chrome" | "Actions" | "Input" | "Display";
  hint: string;
}

export const CATALOG: CatalogItem[] = [
  { type: "Scaffold", label: "Scaffold", group: "Layout", hint: "Material screen shell" },
  { type: "Column", label: "Column", group: "Layout", hint: "Vertical stack" },
  { type: "Row", label: "Row", group: "Layout", hint: "Horizontal stack" },
  { type: "Box", label: "Box", group: "Layout", hint: "Overlay stack" },
  { type: "LazyColumn", label: "LazyColumn", group: "Layout", hint: "Scrolling list" },
  { type: "Card", label: "Card", group: "Layout", hint: "Elevated surface" },
  { type: "TopAppBar", label: "Top app bar", group: "Chrome", hint: "Small Material 3 bar" },
  { type: "NavigationBar", label: "Navigation bar", group: "Chrome", hint: "Bottom destinations" },
  { type: "NavigationBarItem", label: "Nav item", group: "Chrome", hint: "Destination in the bar" },
  { type: "FAB", label: "FAB", group: "Chrome", hint: "Floating action button" },
  { type: "FilledButton", label: "Filled button", group: "Actions", hint: "Primary action" },
  { type: "OutlinedButton", label: "Outlined button", group: "Actions", hint: "Secondary action" },
  { type: "TextButton", label: "Text button", group: "Actions", hint: "Tertiary action" },
  { type: "Chip", label: "Chip", group: "Actions", hint: "Assist chip" },
  { type: "TextField", label: "Text field", group: "Input", hint: "Filled text field" },
  { type: "Switch", label: "Switch", group: "Input", hint: "On / off toggle" },
  { type: "Checkbox", label: "Checkbox", group: "Input", hint: "Binary choice" },
  { type: "Text", label: "Text", group: "Display", hint: "Typography role" },
  { type: "Image", label: "Image", group: "Display", hint: "Remote or bound image" },
  { type: "Icon", label: "Icon", group: "Display", hint: "Material icon" },
  { type: "ListItem", label: "List item", group: "Display", hint: "Headline + supporting" },
  { type: "Divider", label: "Divider", group: "Display", hint: "Hairline separator" },
  { type: "Spacer", label: "Spacer", group: "Display", hint: "Fixed gap" },
  { type: "CircularProgress", label: "Progress", group: "Display", hint: "Indeterminate spinner" },
];

export const DEFAULT_ANIMATION: EnterAnimation = {
  type: "fade",
  durationMs: 280,
  delayMs: 0,
  staggerMs: 40,
};

function id() {
  return nanoid(8);
}

export function createNode(type: NodeType): UiNode {
  const base: UiNode = {
    id: id(),
    type,
    props: {},
    modifiers: { fillMaxWidth: type !== "Icon" && type !== "FAB" && type !== "CircularProgress" },
    animation: { ...DEFAULT_ANIMATION, type: type === "Scaffold" ? "none" : "fade" },
    children: [],
  };

  switch (type) {
    case "Scaffold":
      return { ...base, modifiers: { fillMaxWidth: true, fillMaxHeight: true } };
    case "Column":
      return {
        ...base,
        props: { arrangement: "top", alignment: "start", spacedBy: 12 },
        modifiers: { fillMaxWidth: true, padding: { all: 16 } },
      };
    case "Row":
      return {
        ...base,
        props: { arrangement: "start", alignment: "center", spacedBy: 12 },
        modifiers: { fillMaxWidth: true },
      };
    case "Box":
      return { ...base, props: { alignment: "topStart" } };
    case "LazyColumn":
      return {
        ...base,
        props: { spacedBy: 12 },
        modifiers: { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 16 } },
        itemBinding: "",
      };
    case "Card":
      return {
        ...base,
        props: { variant: "elevated" },
        modifiers: { fillMaxWidth: true, padding: { all: 16 }, clip: "medium" },
        animation: { type: "slideUp", durationMs: 320, delayMs: 0, staggerMs: 50 },
      };
    case "TopAppBar":
      return {
        ...base,
        slot: "topBar",
        props: { title: "Title", navigationIcon: "menu" },
        modifiers: { fillMaxWidth: true },
        animation: { type: "none", durationMs: 0, delayMs: 0 },
      };
    case "NavigationBar":
      return {
        ...base,
        slot: "bottomBar",
        modifiers: { fillMaxWidth: true },
        animation: { type: "none", durationMs: 0, delayMs: 0 },
        children: [
          createNode("NavigationBarItem"),
          {
            ...createNode("NavigationBarItem"),
            props: { label: "Search", icon: "search", selected: false },
          },
        ],
      };
    case "NavigationBarItem":
      return {
        ...base,
        props: { label: "Home", icon: "home", selected: true },
        modifiers: {},
        animation: { type: "none", durationMs: 0, delayMs: 0 },
      };
    case "FAB":
      return {
        ...base,
        slot: "fab",
        props: { icon: "add", contentDescription: "Create" },
        modifiers: {},
        animation: { type: "scale", durationMs: 240, delayMs: 120 },
      };
    case "FilledButton":
    case "OutlinedButton":
    case "TextButton":
      return {
        ...base,
        props: {
          label: type === "FilledButton" ? "Confirm" : "Action",
          textAlign: "center",
          style: "labelLarge",
          color: type === "FilledButton" ? "onPrimary" : "primary",
          enabled: true,
        },
        modifiers: { clip: "full" },
      };
    case "Chip":
      return {
        ...base,
        props: {
          label: "Filter",
          textAlign: "center",
          style: "labelLarge",
          color: "onSurface",
          enabled: true,
        },
        modifiers: { clip: "full" },
      };
    case "TextField":
      return {
        ...base,
        props: {
          label: "Search",
          placeholder: "Hint text",
          value: "",
          textAlign: "start",
          style: "bodyLarge",
          color: "onSurface",
          enabled: true,
        },
        modifiers: { fillMaxWidth: true, clip: "extraSmall" },
      };
    case "Switch":
      return { ...base, props: { label: "Notifications", checked: true }, modifiers: { fillMaxWidth: true } };
    case "Checkbox":
      return { ...base, props: { label: "Remember me", checked: false }, modifiers: { fillMaxWidth: true } };
    case "Text":
      return {
        ...base,
        props: { text: "Headline", style: "titleLarge", color: "onSurface" },
        modifiers: { fillMaxWidth: true },
      };
    case "Image":
      return {
        ...base,
        props: { url: "", alt: "Image", accent: "#6750A4" },
        modifiers: { fillMaxWidth: true, heightDp: 140, clip: "medium" },
      };
    case "Icon":
      return { ...base, props: { name: "star", color: "primary", size: 24 }, modifiers: {} };
    case "ListItem":
      return {
        ...base,
        props: {
          headline: "List item",
          supporting: "Supporting text",
          leadingIcon: "star",
        },
        modifiers: { fillMaxWidth: true, padding: { top: 8, bottom: 8 } },
      };
    case "Divider":
      return { ...base, modifiers: { fillMaxWidth: true }, animation: { type: "none", durationMs: 0, delayMs: 0 } };
    case "Spacer":
      return { ...base, props: { height: 16 }, modifiers: { fillMaxWidth: true }, animation: { type: "none", durationMs: 0, delayMs: 0 } };
    case "CircularProgress":
      return { ...base, props: { size: 40 }, modifiers: {} };
    default:
      return base;
  }
}

export const BINDABLE_PROPS: Partial<Record<NodeType, { key: string; label: string }[]>> = {
  Text: [
    { key: "text", label: "Text" },
    { key: "color", label: "Color token" },
  ],
  Image: [
    { key: "url", label: "Image URL (API)" },
    { key: "accent", label: "Placeholder color" },
    { key: "alt", label: "contentDescription" },
  ],
  Icon: [
    { key: "url", label: "Custom icon URL" },
    { key: "name", label: "Icon name" },
    { key: "color", label: "Tint" },
  ],
  FilledButton: [
    { key: "label", label: "Label" },
    { key: "color", label: "Text color" },
  ],
  OutlinedButton: [
    { key: "label", label: "Label" },
    { key: "color", label: "Text color" },
  ],
  TextButton: [
    { key: "label", label: "Label" },
    { key: "color", label: "Text color" },
  ],
  Chip: [
    { key: "label", label: "Label" },
    { key: "color", label: "Text color" },
  ],
  TopAppBar: [{ key: "title", label: "Title" }],
  TextField: [
    { key: "value", label: "Value" },
    { key: "label", label: "Label" },
  ],
  ListItem: [
    { key: "headline", label: "Headline" },
    { key: "supporting", label: "Supporting" },
  ],
  LazyColumn: [{ key: "itemBinding", label: "List items" }],
  Column: [{ key: "itemBinding", label: "List items" }],
  Row: [{ key: "itemBinding", label: "List items" }],
  Card: [{ key: "variant", label: "Variant" }],
  Switch: [{ key: "label", label: "Label" }],
  Checkbox: [{ key: "label", label: "Label" }],
};
