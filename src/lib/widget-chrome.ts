import type { ColorToken, NodeType, TextStyle, UiNode } from "./schema";

export const LABEL_TYPES: NodeType[] = [
  "Text",
  "FilledButton",
  "TonalButton",
  "ElevatedButton",
  "OutlinedButton",
  "TextButton",
  "Chip",
  "TextField",
  "Switch",
  "Checkbox",
  "Slider",
  "RadioButton",
  "TopAppBar",
  "ListItem",
  "SearchBar",
  "Snackbar",
  "Dialog",
  "Tab",
  "DropdownMenuItem",
  "SegmentedButtonItem",
];

export const BUTTON_TYPES: NodeType[] = [
  "FilledButton",
  "TonalButton",
  "ElevatedButton",
  "OutlinedButton",
  "TextButton",
  "Chip",
];

export const SURFACE_TYPES: NodeType[] = [
  "FilledButton",
  "TonalButton",
  "ElevatedButton",
  "OutlinedButton",
  "TextButton",
  "Chip",
  "IconButton",
  "Card",
  "Surface",
  "FAB",
  "TextField",
  "SearchBar",
  "BottomSheet",
  "Dialog",
];

export function isLabelType(type: NodeType) {
  return LABEL_TYPES.includes(type);
}

export function isButtonType(type: NodeType) {
  return BUTTON_TYPES.includes(type);
}

export function isSurfaceType(type: NodeType) {
  return SURFACE_TYPES.includes(type);
}

export function hasCustomSurface(node: UiNode) {
  return Boolean(
    (node.drawable && node.drawable.type !== "none") ||
      node.modifiers.backgroundHex ||
      node.modifiers.backgroundToken,
  );
}

export function defaultTextToken(type: NodeType): ColorToken {
  if (type === "FilledButton") return "onPrimary";
  if (type === "TonalButton") return "onSecondaryContainer";
  if (type === "OutlinedButton" || type === "TextButton" || type === "ElevatedButton") return "primary";
  if (type === "Chip") return "onSurface";
  if (type === "TextField") return "onSurface";
  if (type === "SearchBar") return "onSurface";
  return "onSurface";
}

export function defaultTypeScale(type: NodeType): TextStyle {
  if (isButtonType(type)) return "labelLarge";
  if (type === "TopAppBar") return "titleLarge";
  if (type === "TextField") return "bodyLarge";
  if (type === "SearchBar") return "bodyLarge";
  return "bodyLarge";
}

export function textAlignValue(node: UiNode): "start" | "center" | "end" {
  const value = String(node.props.textAlign ?? (isButtonType(node.type) ? "center" : "start"));
  if (value === "center" || value === "end") return value;
  return "start";
}

export function cssTextAlign(node: UiNode): "left" | "center" | "right" {
  const align = textAlignValue(node);
  return align === "center" ? "center" : align === "end" ? "right" : "left";
}

export function contentJustify(node: UiNode): "flex-start" | "center" | "flex-end" {
  const align = textAlignValue(node);
  return align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start";
}
