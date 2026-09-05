import type { CSSProperties } from "react";
import {
  boxAlignCss,
  boxAlignment,
  columnAlignment,
  columnArrangement,
  rowAlignment,
  rowArrangement,
  arrangementJustify,
  horizontalAlignItems,
  verticalAlignItems,
} from "./compose-params";
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
  return arrangementJustify(columnArrangement({ arrangement: arrangement ?? "Top" }));
}

export function crossAxisAlign(alignment?: string): CSSProperties["alignItems"] {
  if (alignment === "stretch") return "stretch";
  return horizontalAlignItems(columnAlignment({ alignment: alignment ?? "Start" }));
}

export function rowJustify(arrangement?: string): CSSProperties["justifyContent"] {
  return arrangementJustify(rowArrangement({ arrangement: arrangement ?? "Start" }));
}

export function rowCrossAlign(alignment?: string): CSSProperties["alignItems"] {
  if (alignment === "stretch") return "stretch";
  return verticalAlignItems(rowAlignment({ alignment: alignment ?? "Top" }));
}

export function boxAlign(alignment?: string): Pick<CSSProperties, "alignItems" | "justifyContent"> {
  return boxAlignCss(boxAlignment({ alignment: alignment ?? "TopStart" }));
}

export function containerLayoutStyle(node: UiNode): CSSProperties {
  const reverse = Boolean(node.modifiers.reverseScrolling);
  if (node.type === "Column" || node.type === "LazyColumn") {
    return {
      display: "flex",
      flexDirection: reverse ? "column-reverse" : "column",
      justifyContent: arrangementJustify(columnArrangement(node.props)),
      alignItems: horizontalAlignItems(columnAlignment(node.props)),
    };
  }
  if (node.type === "Row" || node.type === "LazyRow") {
    return {
      display: "flex",
      flexDirection: reverse ? "row-reverse" : "row",
      justifyContent: arrangementJustify(rowArrangement(node.props)),
      alignItems: verticalAlignItems(rowAlignment(node.props)),
    };
  }
  if (node.type === "Box") {
    return {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      minHeight: node.modifiers.fillMaxHeight || node.modifiers.fillMaxSize ? "100%" : undefined,
      ...boxAlignCss(boxAlignment(node.props)),
    };
  }
  return {};
}

export function inheritedChildAlignment(parent: UiNode | null): { horizontal?: string; vertical?: string } {
  if (!parent) return {};
  if (parent.type === "Column" || parent.type === "LazyColumn") {
    const alignment = columnAlignment(parent.props);
    const horizontal =
      alignment === "End" || alignment === "TopEnd" || alignment === "CenterEnd" || alignment === "BottomEnd"
        ? "end"
        : alignment === "Center" || alignment === "CenterHorizontally" || alignment === "TopCenter"
          ? "center"
          : "start";
    return { horizontal };
  }
  if (parent.type === "Row" || parent.type === "LazyRow") {
    const alignment = rowAlignment(parent.props);
    const vertical =
      alignment === "Bottom" || alignment === "End" || alignment === "BottomStart" || alignment === "BottomEnd"
        ? "bottom"
        : alignment === "Center" || alignment === "CenterVertically" || alignment === "CenterStart"
          ? "center"
          : "top";
    return { vertical };
  }
  if (parent.type === "Box") {
    const alignment = boxAlignment(parent.props);
    const map: Record<string, { horizontal: string; vertical: string }> = {
      TopStart: { horizontal: "start", vertical: "top" },
      TopCenter: { horizontal: "center", vertical: "top" },
      TopEnd: { horizontal: "end", vertical: "top" },
      CenterStart: { horizontal: "start", vertical: "center" },
      Center: { horizontal: "center", vertical: "center" },
      CenterEnd: { horizontal: "end", vertical: "center" },
      BottomStart: { horizontal: "start", vertical: "bottom" },
      BottomCenter: { horizontal: "center", vertical: "bottom" },
      BottomEnd: { horizontal: "end", vertical: "bottom" },
    };
    return map[alignment] ?? map.TopStart;
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
