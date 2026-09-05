import { resolveProp, type BindingScope } from "./bindings";
import type { UiNode } from "./schema";

/** Map stored slider value to 0–1 thumb position using valueMin/valueMax. */
export function sliderPosition(node: UiNode, scope?: BindingScope): number {
  const min = Number(node.props.valueMin ?? 0);
  const max = Number(node.props.valueMax ?? 100);
  const raw = Number(
    scope ? resolveProp(node, "value", scope) ?? node.props.value ?? 0.5 : node.props.value ?? 0.5,
  );
  if (max <= min) return 0.5;
  if (raw <= 1 && max > 1) return Math.min(1, Math.max(0, raw));
  return Math.min(1, Math.max(0, (raw - min) / (max - min)));
}
