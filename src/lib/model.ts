import type { NodeType } from "./schema";

export type ModelKind = "string" | "number" | "boolean" | "array" | "object" | "url" | "image" | "color";

export interface ModelField {
  path: string;
  kind: ModelKind;
  sample: string;
  sourceId: string;
}

function kindOf(key: string, value: unknown): ModelKind {
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object") return "object";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  const text = String(value ?? "");
  if (/^(#|rgb|hsl)/i.test(text) || /color|accent|tint/i.test(key)) return "color";
  if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(text) || /image|thumb|photo|icon|avatar/i.test(key)) return "image";
  if (/^https?:\/\//i.test(text) || /(^|\.)(url|href|link)$/i.test(key)) return "url";
  return "string";
}

function sampleOf(value: unknown): string {
  if (value == null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === "object") return "object";
  const text = String(value);
  return text.length > 48 ? `${text.slice(0, 45)}…` : text;
}

export function modelFields(data: Record<string, unknown>, limit = 140): ModelField[] {
  const out: ModelField[] = [];

  function walk(value: unknown, path: string, sourceId: string, depth: number) {
    if (!path || out.length >= limit || depth > 6) return;
    const kind = kindOf(path.split(".").at(-1) ?? path, value);
    out.push({ path, kind, sample: sampleOf(value), sourceId });
    if (Array.isArray(value)) {
      if (value.length > 0) walk(value[0], `${path}.0`, sourceId, depth + 1);
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        walk(child, `${path}.${key}`, sourceId, depth + 1);
      }
    }
  }

  for (const [sourceId, payload] of Object.entries(data)) {
    walk(payload, sourceId, sourceId, 0);
  }
  return out;
}

export function arrayPaths(data: Record<string, unknown>): string[] {
  return modelFields(data)
    .filter((field) => field.kind === "array")
    .map((field) => field.path);
}

export function itemAlias(path: string): string {
  const match = path.match(/^(.*)\.(0|item)\.(.+)$/);
  if (!match) return path;
  return `item.${match[3]}`;
}

export function suggestFields(type: NodeType, fields: ModelField[]): ModelField[] {
  const ranked = fields.map((field) => {
    let score = 0;
    if (type === "Image" || type === "Icon") {
      if (field.kind === "image") score += 5;
      if (field.kind === "url") score += 3;
    } else if (type === "LazyColumn" || type === "Column" || type === "Row") {
      if (field.kind === "array") score += 5;
    } else if (type === "Text" || type === "ListItem" || type === "TopAppBar" || type === "Chip") {
      if (field.kind === "string") score += 3;
      if (/title|name|headline|text|description|source/i.test(field.path)) score += 2;
    } else if (type === "FilledButton" || type === "OutlinedButton" || type === "TextButton") {
      if (/url|href|link/i.test(field.path)) score += 3;
      if (field.kind === "string") score += 1;
    }
    return { field, score };
  });
  return ranked
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.field)
    .slice(0, 12);
}

export function bindableComposeProps(type: NodeType): { key: string; label: string; compose: string }[] {
  const shared = [{ key: "contentDescription", label: "contentDescription", compose: "Modifier.semantics" }];
  switch (type) {
    case "Text":
      return [
        { key: "text", label: "text", compose: "Text(text)" },
        { key: "color", label: "color", compose: "TextStyle.color" },
      ];
    case "Image":
      return [
        { key: "url", label: "painter / url", compose: "Image(painter)" },
        { key: "accent", label: "placeholder color", compose: "Color" },
        { key: "alt", label: "contentDescription", compose: "contentDescription" },
      ];
    case "Icon":
      return [
        { key: "url", label: "custom painter", compose: "Icon(painter)" },
        { key: "name", label: "ImageVector", compose: "Icons.Filled.*" },
        { key: "color", label: "tint", compose: "Icon tint" },
      ];
    case "ListItem":
      return [
        { key: "headline", label: "headline", compose: "ListItem headline" },
        { key: "supporting", label: "supporting", compose: "ListItem supporting" },
      ];
    case "TopAppBar":
      return [{ key: "title", label: "title", compose: "TopAppBar title" }];
    case "TextField":
      return [
        { key: "value", label: "value", compose: "TextField value" },
        { key: "label", label: "label", compose: "TextField label" },
        { key: "placeholder", label: "placeholder", compose: "placeholder" },
        { key: "color", label: "text color", compose: "TextField colors" },
      ];
    case "FilledButton":
    case "OutlinedButton":
    case "TextButton":
    case "Chip":
      return [
        { key: "label", label: "label", compose: "Button text" },
        { key: "color", label: "content color", compose: "Button contentColor" },
      ];
    case "Switch":
    case "Checkbox":
      return [{ key: "label", label: "label", compose: "label" }];
    case "Card":
      return [{ key: "variant", label: "variant", compose: "CardDefaults" }];
    case "LazyColumn":
    case "Column":
    case "Row":
      return [{ key: "itemBinding", label: "items", compose: "LazyColumn items" }];
    default:
      return shared;
  }
}
