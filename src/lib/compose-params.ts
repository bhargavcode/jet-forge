import type { CSSProperties } from "react";
import type {
  AlignmentName,
  ArrangementName,
  ModifierSpec,
  NodeType,
  ScrollAxis,
  UiNode,
} from "./schema";
import { ALIGNMENTS, ARRANGEMENTS } from "./schema";

const ARRANGEMENT_ALIASES: Record<string, ArrangementName> = {
  top: "Top",
  Top: "Top",
  "Arrangement.Top": "Top",
  bottom: "Bottom",
  Bottom: "Bottom",
  "Arrangement.Bottom": "Bottom",
  start: "Start",
  Start: "Start",
  "Arrangement.Start": "Start",
  end: "End",
  End: "End",
  "Arrangement.End": "End",
  center: "Center",
  Center: "Center",
  "Arrangement.Center": "Center",
  spacebetween: "SpaceBetween",
  spaceBetween: "SpaceBetween",
  SpaceBetween: "SpaceBetween",
  "Arrangement.SpaceBetween": "SpaceBetween",
  spacearound: "SpaceAround",
  spaceAround: "SpaceAround",
  SpaceAround: "SpaceAround",
  "Arrangement.SpaceAround": "SpaceAround",
  spaceevenly: "SpaceEvenly",
  spaceEvenly: "SpaceEvenly",
  SpaceEvenly: "SpaceEvenly",
  "Arrangement.SpaceEvenly": "SpaceEvenly",
};

const ALIGNMENT_ALIASES: Record<string, AlignmentName> = {
  top: "Top",
  Top: "Top",
  "Alignment.Top": "Top",
  bottom: "Bottom",
  Bottom: "Bottom",
  "Alignment.Bottom": "Bottom",
  start: "Start",
  Start: "Start",
  "Alignment.Start": "Start",
  end: "End",
  End: "End",
  "Alignment.End": "End",
  center: "Center",
  Center: "Center",
  "Alignment.Center": "Center",
  centerhorizontally: "CenterHorizontally",
  centerHorizontally: "CenterHorizontally",
  CenterHorizontally: "CenterHorizontally",
  "Alignment.CenterHorizontally": "CenterHorizontally",
  centervertically: "CenterVertically",
  centerVertically: "CenterVertically",
  CenterVertically: "CenterVertically",
  "Alignment.CenterVertically": "CenterVertically",
  topstart: "TopStart",
  topStart: "TopStart",
  TopStart: "TopStart",
  "Alignment.TopStart": "TopStart",
  topcenter: "TopCenter",
  topCenter: "TopCenter",
  TopCenter: "TopCenter",
  "Alignment.TopCenter": "TopCenter",
  topend: "TopEnd",
  topEnd: "TopEnd",
  TopEnd: "TopEnd",
  "Alignment.TopEnd": "TopEnd",
  centerstart: "CenterStart",
  centerStart: "CenterStart",
  CenterStart: "CenterStart",
  "Alignment.CenterStart": "CenterStart",
  centerend: "CenterEnd",
  centerEnd: "CenterEnd",
  CenterEnd: "CenterEnd",
  "Alignment.CenterEnd": "CenterEnd",
  bottomstart: "BottomStart",
  bottomStart: "BottomStart",
  BottomStart: "BottomStart",
  "Alignment.BottomStart": "BottomStart",
  bottomcenter: "BottomCenter",
  bottomCenter: "BottomCenter",
  BottomCenter: "BottomCenter",
  "Alignment.BottomCenter": "BottomCenter",
  bottomend: "BottomEnd",
  bottomEnd: "BottomEnd",
  BottomEnd: "BottomEnd",
  "Alignment.BottomEnd": "BottomEnd",
};

function lookup<T extends string>(table: Record<string, T>, value: unknown): T | undefined {
  if (value == null) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  if (raw in table) return table[raw];
  const compact = raw.replace(/\s+/g, "");
  if (compact in table) return table[compact];
  const lower = compact.toLowerCase();
  if (lower in table) return table[lower];
  return undefined;
}

export function normalizeArrangement(value: unknown): ArrangementName | undefined {
  const found = lookup(ARRANGEMENT_ALIASES, value);
  if (found) return found;
  const raw = String(value ?? "");
  return (ARRANGEMENTS as readonly string[]).includes(raw) ? (raw as ArrangementName) : undefined;
}

export function normalizeAlignment(value: unknown): AlignmentName | undefined {
  const found = lookup(ALIGNMENT_ALIASES, value);
  if (found) return found;
  const raw = String(value ?? "");
  return (ALIGNMENTS as readonly string[]).includes(raw) ? (raw as AlignmentName) : undefined;
}

export function propString(props: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (props[key] != null && props[key] !== "") return props[key];
  }
  return undefined;
}

export function columnArrangement(props: Record<string, unknown>): ArrangementName {
  return normalizeArrangement(propString(props, "verticalArrangement", "arrangement")) ?? "Top";
}

export function columnAlignment(props: Record<string, unknown>): AlignmentName {
  return normalizeAlignment(propString(props, "horizontalAlignment", "alignment")) ?? "Start";
}

export function rowArrangement(props: Record<string, unknown>): ArrangementName {
  return normalizeArrangement(propString(props, "horizontalArrangement", "arrangement")) ?? "Start";
}

export function rowAlignment(props: Record<string, unknown>): AlignmentName {
  return normalizeAlignment(propString(props, "verticalAlignment", "alignment")) ?? "Top";
}

export function boxAlignment(props: Record<string, unknown>): AlignmentName {
  return normalizeAlignment(propString(props, "contentAlignment", "alignment")) ?? "TopStart";
}

export function spacedByAlignment(props: Record<string, unknown>): AlignmentName | undefined {
  return normalizeAlignment(propString(props, "spacedByAlignment"));
}

export function arrangementJustify(name: ArrangementName): CSSProperties["justifyContent"] {
  switch (name) {
    case "Center":
      return "center";
    case "Bottom":
    case "End":
      return "flex-end";
    case "SpaceBetween":
      return "space-between";
    case "SpaceAround":
      return "space-around";
    case "SpaceEvenly":
      return "space-evenly";
    default:
      return "flex-start";
  }
}

export function horizontalAlignItems(name: AlignmentName): CSSProperties["alignItems"] {
  switch (name) {
    case "End":
    case "TopEnd":
    case "CenterEnd":
    case "BottomEnd":
      return "flex-end";
    case "Center":
    case "CenterHorizontally":
    case "TopCenter":
    case "BottomCenter":
      return "center";
    default:
      return "flex-start";
  }
}

export function verticalAlignItems(name: AlignmentName): CSSProperties["alignItems"] {
  switch (name) {
    case "Bottom":
    case "End":
    case "BottomStart":
    case "BottomCenter":
    case "BottomEnd":
      return "flex-end";
    case "Center":
    case "CenterVertically":
    case "CenterStart":
    case "CenterEnd":
      return "center";
    default:
      return "flex-start";
  }
}

export function boxAlignCss(name: AlignmentName): Pick<CSSProperties, "alignItems" | "justifyContent"> {
  switch (name) {
    case "TopCenter":
      return { alignItems: "center", justifyContent: "flex-start" };
    case "TopEnd":
      return { alignItems: "flex-end", justifyContent: "flex-start" };
    case "CenterStart":
      return { alignItems: "flex-start", justifyContent: "center" };
    case "Center":
    case "CenterHorizontally":
    case "CenterVertically":
      return { alignItems: "center", justifyContent: "center" };
    case "CenterEnd":
      return { alignItems: "flex-end", justifyContent: "center" };
    case "BottomStart":
      return { alignItems: "flex-start", justifyContent: "flex-end" };
    case "BottomCenter":
      return { alignItems: "center", justifyContent: "flex-end" };
    case "BottomEnd":
      return { alignItems: "flex-end", justifyContent: "flex-end" };
    case "End":
      return { alignItems: "flex-end", justifyContent: "flex-start" };
    case "Bottom":
      return { alignItems: "flex-start", justifyContent: "flex-end" };
    default:
      return { alignItems: "flex-start", justifyContent: "flex-start" };
  }
}

export function childAlignSelf(parentType: NodeType | null | undefined, align?: AlignmentName): CSSProperties["alignSelf"] {
  if (!align || !parentType) return undefined;
  if (parentType === "Column" || parentType === "LazyColumn" || parentType === "LazyVerticalGrid") {
    return horizontalAlignItems(align) as CSSProperties["alignSelf"];
  }
  if (parentType === "Row" || parentType === "LazyRow") {
    return verticalAlignItems(align) as CSSProperties["alignSelf"];
  }
  return undefined;
}

export function clampFraction(value: number | undefined, fallback = 1): number {
  if (value == null || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function resolvedScrollAxis(modifiers: ModifierSpec): ScrollAxis {
  if (modifiers.verticalScroll) return "vertical";
  if (modifiers.horizontalScroll) return "horizontal";
  return modifiers.scrollAxis ?? "none";
}

export function fillPercent(enabled: boolean | undefined, fraction: number | undefined, modeFill: boolean): string | undefined {
  if (!enabled && !modeFill) return undefined;
  const pct = clampFraction(fraction, 1) * 100;
  return `${pct}%`;
}

export function patchContainerProps(
  node: UiNode,
  next: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> {
  const props = { ...node.props, ...next };
  if (next.verticalArrangement != null) props.arrangement = next.verticalArrangement;
  if (next.horizontalArrangement != null) props.arrangement = next.horizontalArrangement;
  if (next.horizontalAlignment != null) props.alignment = next.horizontalAlignment;
  if (next.verticalAlignment != null) props.alignment = next.verticalAlignment;
  if (next.contentAlignment != null) props.alignment = next.contentAlignment;
  if (next.arrangement != null) {
    if (node.type === "Column" || node.type === "LazyColumn" || node.type === "LazyVerticalGrid") {
      props.verticalArrangement = String(next.arrangement);
    }
    if (node.type === "Row" || node.type === "LazyRow") {
      props.horizontalArrangement = String(next.arrangement);
    }
  }
  if (next.alignment != null) {
    if (node.type === "Column" || node.type === "LazyColumn" || node.type === "LazyVerticalGrid") {
      props.horizontalAlignment = String(next.alignment);
    }
    if (node.type === "Row" || node.type === "LazyRow") {
      props.verticalAlignment = String(next.alignment);
    }
    if (node.type === "Box") {
      props.contentAlignment = String(next.alignment);
    }
  }
  return props;
}
