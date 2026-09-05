import type { CSSProperties } from "react";
import type { ConstraintSpec, ModifierSpec, NodeType, UiNode } from "./schema";

export type HorizontalAlign = "start" | "center" | "end" | "stretch";
export type VerticalAlign = "top" | "center" | "bottom" | "stretch";

const FLOW_PARENT_TYPES = new Set<NodeType>(["Column", "LazyColumn", "Row", "LazyRow"]);

export interface DropContext {
  pointer?: { x: number; y: number };
  overNodeId?: string;
  containerRect?: { top: number; left: number; width: number; height: number };
}

export function isFlowLayoutParent(type: NodeType): boolean {
  return FLOW_PARENT_TYPES.has(type);
}

/** Keep only flow alignment hints — drop ConstraintLayout peer anchors. */
export function stripPeerConstraints(constraints?: ConstraintSpec): ConstraintSpec | undefined {
  if (!constraints) return undefined;
  const next: ConstraintSpec = {
    horizontal: constraints.horizontal,
    vertical: constraints.vertical,
    margin: constraints.margin,
  };
  if (!next.horizontal && !next.vertical && !next.margin) return undefined;
  return next;
}

export function columnJustify(arrangement?: string): CSSProperties["justifyContent"] {
  switch (arrangement) {
    case "center":
      return "center";
    case "bottom":
    case "end":
      return "flex-end";
    case "spaceBetween":
      return "space-between";
    case "spaceEvenly":
      return "space-evenly";
    case "spaceAround":
      return "space-around";
    default:
      return "flex-start";
  }
}

export function crossAxisAlign(alignment?: string): CSSProperties["alignItems"] {
  switch (alignment) {
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "stretch":
      return "stretch";
    default:
      return "flex-start";
  }
}

export function rowJustify(arrangement?: string): CSSProperties["justifyContent"] {
  switch (arrangement) {
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "spaceBetween":
      return "space-between";
    case "spaceEvenly":
      return "space-evenly";
    case "spaceAround":
      return "space-around";
    default:
      return "flex-start";
  }
}

export function rowCrossAlign(alignment?: string): CSSProperties["alignItems"] {
  switch (alignment) {
    case "top":
    case "start":
      return "flex-start";
    case "center":
      return "center";
    case "bottom":
    case "end":
      return "flex-end";
    case "stretch":
      return "stretch";
    default:
      return "center";
  }
}

export function boxAlign(alignment?: string): Pick<CSSProperties, "alignItems" | "justifyContent"> {
  switch (alignment) {
    case "topCenter":
      return { alignItems: "center", justifyContent: "flex-start" };
    case "topEnd":
      return { alignItems: "flex-end", justifyContent: "flex-start" };
    case "centerStart":
      return { alignItems: "flex-start", justifyContent: "center" };
    case "center":
      return { alignItems: "center", justifyContent: "center" };
    case "centerEnd":
      return { alignItems: "flex-end", justifyContent: "center" };
    case "bottomStart":
      return { alignItems: "flex-start", justifyContent: "flex-end" };
    case "bottomCenter":
      return { alignItems: "center", justifyContent: "flex-end" };
    case "bottomEnd":
      return { alignItems: "flex-end", justifyContent: "flex-end" };
    case "topStart":
    default:
      return { alignItems: "flex-start", justifyContent: "flex-start" };
  }
}

export function containerLayoutStyle(node: UiNode): CSSProperties {
  const arrangement = String(node.props.arrangement ?? "");
  const alignment = String(node.props.alignment ?? "");
  if (node.type === "Column" || node.type === "LazyColumn") {
    return {
      display: "flex",
      flexDirection: "column",
      justifyContent: columnJustify(arrangement || "top"),
      alignItems: crossAxisAlign(alignment || "start"),
    };
  }
  if (node.type === "Row") {
    return {
      display: "flex",
      flexDirection: "row",
      justifyContent: rowJustify(arrangement || "start"),
      alignItems: rowCrossAlign(alignment || "center"),
    };
  }
  if (node.type === "Box") {
    return {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      minHeight: node.modifiers.fillMaxHeight ? "100%" : undefined,
      ...boxAlign(String(node.props.alignment ?? "topStart")),
    };
  }
  return {};
}

export function inheritedChildAlignment(parent: UiNode | null): { horizontal?: string; vertical?: string } {
  if (!parent) return {};
  const alignment = String(parent.props.alignment ?? "");
  if (parent.type === "Column" || parent.type === "LazyColumn") {
    return { horizontal: alignment || "start" };
  }
  if (parent.type === "Row") {
    return { vertical: alignment || "center" };
  }
  if (parent.type === "Box") {
    const map: Record<string, { horizontal: string; vertical: string }> = {
      topStart: { horizontal: "start", vertical: "top" },
      topCenter: { horizontal: "center", vertical: "top" },
      topEnd: { horizontal: "end", vertical: "top" },
      centerStart: { horizontal: "start", vertical: "center" },
      center: { horizontal: "center", vertical: "center" },
      centerEnd: { horizontal: "end", vertical: "center" },
      bottomStart: { horizontal: "start", vertical: "bottom" },
      bottomCenter: { horizontal: "center", vertical: "bottom" },
      bottomEnd: { horizontal: "end", vertical: "bottom" },
    };
    return map[alignment] ?? map.topStart;
  }
  return {};
}

export function marginStyle(modifiers: ModifierSpec): CSSProperties {
  const m = modifiers.margin;
  if (!m) return {};
  if (m.all != null) return { margin: `${m.all}px` };
  return {
    marginLeft: m.start != null ? `${m.start}px` : undefined,
    marginRight: m.end != null ? `${m.end}px` : undefined,
    marginTop: m.top != null ? `${m.top}px` : undefined,
    marginBottom: m.bottom != null ? `${m.bottom}px` : undefined,
  };
}

export function constraintStyle(
  constraints: ConstraintSpec | undefined,
  parentType: NodeType | null,
): CSSProperties {
  if (!constraints) return {};
  const style: CSSProperties = {
    ...marginStyle({ margin: constraints.margin }),
  };

  if (parentType === "Box") {
    style.position = "absolute";
    const h = constraints.horizontal ?? "start";
    const v = constraints.vertical ?? "top";
    if (h === "start") {
      style.left = constraints.margin?.start ?? 0;
    } else if (h === "end") {
      style.right = constraints.margin?.end ?? 0;
    } else if (h === "center") {
      style.left = "50%";
      style.transform = "translateX(-50%)";
    } else if (h === "stretch") {
      style.left = constraints.margin?.start ?? 0;
      style.right = constraints.margin?.end ?? 0;
      style.width = "auto";
    }
    if (v === "top") {
      style.top = constraints.margin?.top ?? 0;
    } else if (v === "bottom") {
      style.bottom = constraints.margin?.bottom ?? 0;
    } else if (v === "center") {
      style.top = "50%";
      style.transform =
        h === "center" ? "translate(-50%, -50%)" : h === "stretch" ? "translateY(-50%)" : "translateY(-50%)";
    } else if (v === "stretch") {
      style.top = constraints.margin?.top ?? 0;
      style.bottom = constraints.margin?.bottom ?? 0;
      style.height = "auto";
    }
    return style;
  }

  // Column / Row child: align-self
  const h = constraints.horizontal;
  const v = constraints.vertical;
  if (h === "center") style.alignSelf = "center";
  else if (h === "end") style.alignSelf = "flex-end";
  else if (h === "stretch") style.alignSelf = "stretch";
  else style.alignSelf = "flex-start";

  if (parentType === "Row") {
    if (v === "center") style.alignSelf = "center";
    else if (v === "bottom") style.alignSelf = "flex-end";
    else if (v === "stretch") style.alignSelf = "stretch";
    else style.alignSelf = "flex-start";
  }

  return style;
}

export function defaultConstraintsForDrop(
  parent: UiNode,
  siblings: UiNode[],
  index: number,
): ConstraintSpec {
  const inherited = inheritedChildAlignment(parent);
  const nearest = siblings[index - 1] ?? siblings[index + 1] ?? null;
  const base: ConstraintSpec = {
    horizontal: (inherited.horizontal as HorizontalAlign) ?? "start",
    vertical: (inherited.vertical as VerticalAlign) ?? "top",
    margin: { all: 0 },
  };
  if (nearest) {
    if (parent.type === "Column" || parent.type === "LazyColumn") {
      base.vertical = "top";
      base.horizontal = inherited.horizontal as HorizontalAlign ?? "stretch";
    } else if (parent.type === "Row") {
      base.horizontal = "start";
      base.vertical = inherited.vertical as VerticalAlign ?? "center";
    } else if (parent.type === "Box") {
      base.horizontal = inherited.horizontal as HorizontalAlign ?? "start";
      base.vertical = inherited.vertical as VerticalAlign ?? "top";
    }
  }
  return base;
}

export function isContainerType(type: NodeType) {
  return type === "Column" || type === "Row" || type === "Box" || type === "LazyColumn" || type === "Card" || type === "Scaffold";
}
