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
      bindings:
        patch.bindings === undefined
          ? node.bindings
          : { ...node.bindings, ...patch.bindings },
      onClick: patch.onClick !== undefined ? patch.onClick : node.onClick,
      interactions: patch.interactions !== undefined ? patch.interactions : node.interactions,
      formField:
        patch.formField === undefined
          ? node.formField
          : { ...node.formField, ...patch.formField },
      visibleWhen: patch.visibleWhen !== undefined ? patch.visibleWhen : node.visibleWhen,
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

export function acceptsChild(parent: NodeType, child: NodeType): boolean {
  if (child === "NavigationBarItem") return parent === "NavigationBar";
  if (parent === "NavigationBar") return false;
  if (child === "TopAppBar" || child === "FAB" || child === "NavigationBar") {
    return parent === "Scaffold";
  }
  if (parent === "Scaffold") return true;
  return isContainer(parent);
}
