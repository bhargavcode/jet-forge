import type { NodeType, UiNode } from "./schema";

export function walk(node: UiNode, visit: (n: UiNode, parent: UiNode | null) => void, parent: UiNode | null = null) {
  visit(node, parent);
  node.children?.forEach((child) => walk(child, visit, node));
}

export function findNode(root: UiNode, id: string): UiNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: UiNode, id: string): UiNode | null {
  for (const child of root.children ?? []) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

export function mapTree(root: UiNode, mapper: (node: UiNode) => UiNode): UiNode {
  const mapped = mapper(root);
  if (!mapped.children) return mapped;
  return {
    ...mapped,
    children: mapped.children.map((child) => mapTree(child, mapper)),
  };
}

export function updateNode(root: UiNode, id: string, patch: Partial<UiNode>): UiNode {
  return mapTree(root, (node) => {
    if (node.id !== id) return node;
    return {
      ...node,
      ...patch,
      props: patch.props ? { ...node.props, ...patch.props } : node.props,
      modifiers: patch.modifiers ? { ...node.modifiers, ...patch.modifiers } : node.modifiers,
      bindings: patch.bindings === undefined ? node.bindings : patch.bindings,
      onClick: patch.onClick !== undefined ? patch.onClick : node.onClick,
      interactions: patch.interactions !== undefined ? patch.interactions : node.interactions,
      formField: "formField" in patch ? patch.formField : node.formField,
      itemBinding: "itemBinding" in patch ? patch.itemBinding : node.itemBinding,
      drawable: patch.drawable === undefined ? node.drawable : patch.drawable,
      animation: patch.animation === undefined ? node.animation : patch.animation,
      visibleWhen: patch.visibleWhen !== undefined ? patch.visibleWhen : node.visibleWhen,
      visibleIf: "visibleIf" in patch ? patch.visibleIf : node.visibleIf,
    };
  });
}

export function removeNode(root: UiNode, id: string): UiNode {
  if (root.id === id) return root;
  return {
    ...root,
    children: root.children
      ?.filter((child) => child.id !== id)
      .map((child) => removeNode(child, id)),
  };
}

export function insertChild(
  root: UiNode,
  parentId: string,
  child: UiNode,
  index?: number,
): UiNode {
  return mapTree(root, (node) => {
    if (node.id !== parentId) return node;
    const children = [...(node.children ?? [])];
    const at = index === undefined ? children.length : Math.max(0, Math.min(index, children.length));
    children.splice(at, 0, child);
    return { ...node, children };
  });
}

export function relocateNode(root: UiNode, nodeId: string, parentId: string, index: number): UiNode {
  if (nodeId === parentId || nodeId === root.id) return root;
  const moving = findNode(root, nodeId);
  const parent = findNode(root, parentId);
  if (!moving || !parent || !acceptsChild(parent.type, moving.type)) return root;
  if (collectIds(moving).includes(parentId)) return root;
  const oldParent = findParent(root, nodeId);
  let at = index;
  if (oldParent?.id === parentId && oldParent.children) {
    const oldIndex = oldParent.children.findIndex((child) => child.id === nodeId);
    if (oldIndex >= 0 && oldIndex < at) at -= 1;
  }
  return insertChild(removeNode(root, nodeId), parentId, moving, at);
}

export function moveChild(root: UiNode, id: string, direction: -1 | 1): UiNode {
  const parent = findParent(root, id);
  if (!parent?.children) return root;
  const index = parent.children.findIndex((c) => c.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= parent.children.length) return root;
  const children = [...parent.children];
  const [item] = children.splice(index, 1);
  children.splice(next, 0, item);
  return updateNode(root, parent.id, { children });
}

export function isContainer(type: NodeType): boolean {
  return (
    type === "Scaffold" ||
    type === "Column" ||
    type === "Row" ||
    type === "Box" ||
    type === "Card" ||
    type === "LazyColumn" ||
    type === "NavigationBar"
  );
}

export function collectIds(node: UiNode): string[] {
  const ids = [node.id];
  for (const child of node.children ?? []) ids.push(...collectIds(child));
  return ids;
}

export function countWiring(node: UiNode) {
  let bindings = 0;
  let wires = 0;
  let widgets = 0;
  walk(node, (current) => {
    widgets += 1;
    bindings += Object.keys(current.bindings ?? {}).filter((key) => current.bindings?.[key]).length;
    if (current.itemBinding) bindings += 1;
    wires += (current.interactions ?? []).filter((item) => item.action.type !== "none").length;
    if ((!current.interactions || current.interactions.length === 0) && current.onClick && current.onClick.type !== "none") {
      wires += 1;
    }
  });
  return { widgets, bindings, wires };
}

export function clearNodeWiring(node: UiNode): UiNode {
  return {
    ...node,
    bindings: {},
    interactions: [],
    onClick: { type: "none" },
    formField: undefined,
    itemBinding: undefined,
    children: node.children?.map(clearNodeWiring),
  };
}

export function stripWiresToScreens(root: UiNode, removedScreenIds: Set<string>): UiNode {
  return mapTree(root, (node) => {
    const interactions = (node.interactions ?? []).filter((item) => {
      const target = item.action.screenId;
      return !target || !removedScreenIds.has(target);
    });
    const onClick =
      node.onClick?.screenId && removedScreenIds.has(node.onClick.screenId)
        ? { type: "none" as const }
        : node.onClick;
    return { ...node, interactions, onClick };
  });
}

export function stripBindingsToSource(root: UiNode, sourceId: string): UiNode {
  return mapTree(root, (node) => {
    const bindings = { ...node.bindings };
    for (const [key, path] of Object.entries(bindings)) {
      if (path === sourceId || path.startsWith(`${sourceId}.`)) delete bindings[key];
    }
    const itemBinding =
      node.itemBinding && (node.itemBinding === sourceId || node.itemBinding.startsWith(`${sourceId}.`))
        ? undefined
        : node.itemBinding;
    return { ...node, bindings, itemBinding };
  });
}

export function acceptsChild(parent: NodeType, child: NodeType): boolean {
  if (child === "NavigationBarItem") return parent === "NavigationBar";
  if (parent === "NavigationBar") return false;
  if (child === "TopAppBar" || child === "FAB" || child === "NavigationBar") {
    return parent === "Scaffold";
  }
  if (parent === "Scaffold") return true;
  return isContainer(parent);
}
