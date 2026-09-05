import type { ClickAction, Interaction, ScreenDocument, TouchEvent, UiNode } from "./schema";
import { walk } from "./tree";

export function interactionsOf(node: UiNode): Interaction[] {
  if (node.interactions && node.interactions.length > 0) return node.interactions;
  if (node.onClick && node.onClick.type !== "none") {
    return [{ event: "tap", action: node.onClick }];
  }
  return [];
}

export function tapAction(node: UiNode): ClickAction | undefined {
  return interactionsOf(node).find((item) => item.event === "tap")?.action ?? node.onClick;
}

export function actionForEvent(node: UiNode, event: TouchEvent): ClickAction | undefined {
  return interactionsOf(node).find((item) => item.event === event)?.action;
}

export function hasRuntimeGestures(node: UiNode): boolean {
  return interactionsOf(node).some((item) => item.action.type !== "none");
}

export function gestureFromDelta(dx: number, dy: number, threshold = 48): TouchEvent | "tap" {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < threshold && absY < threshold) return "tap";
  if (absX >= absY) return dx < 0 ? "swipeLeft" : "swipeRight";
  return dy < 0 ? "swipeUp" : "swipeDown";
}

export interface ScreenWire {
  fromScreenId: string;
  fromNodeId: string;
  fromNodeType: string;
  event: TouchEvent;
  actionType: string;
  toScreenId: string | null;
  toNodeId?: string;
}

export function collectWires(document: ScreenDocument): ScreenWire[] {
  const wires: ScreenWire[] = [];
  const seen = new Set<string>();
  for (const screen of document.screens) {
    walk(screen.root, (node) => {
      for (const item of interactionsOf(node)) {
        if (item.action.type === "none") continue;
        const toScreenId =
          item.action.type === "navigate" || item.action.type === "submitForm"
            ? item.action.screenId ?? null
            : item.action.type === "back"
              ? null
              : null;
        if (item.action.type === "navigate" || item.action.type === "submitForm" || item.action.type === "back" || item.action.type === "focusNode") {
          const signature = `${screen.id}:${node.id}:${item.event}:${item.action.type}:${toScreenId ?? ""}:${item.action.nodeId ?? ""}`;
          if (seen.has(signature)) continue;
          seen.add(signature);
          wires.push({
            fromScreenId: screen.id,
            fromNodeId: node.id,
            fromNodeType: node.type,
            event: item.event,
            actionType: item.action.type,
            toScreenId: item.action.type === "focusNode" ? screen.id : toScreenId,
            toNodeId: item.action.nodeId,
          });
        }
      }
    });
  }
  return wires;
}

export function hotspotNodes(root: UiNode): UiNode[] {
  const hotspots: UiNode[] = [];
  walk(root, (node) => {
    if (interactionsOf(node).some((item) => item.action.type !== "none")) {
      hotspots.push(node);
      return;
    }
    if (
      node.type === "FilledButton" ||
      node.type === "OutlinedButton" ||
      node.type === "TextButton" ||
      node.type === "Card" ||
      node.type === "FAB" ||
      node.type === "ListItem" ||
      node.type === "NavigationBarItem" ||
      node.type === "Chip" ||
      node.type === "Image"
    ) {
      hotspots.push(node);
    }
  });
  return hotspots;
}
