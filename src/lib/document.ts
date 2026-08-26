import type { Interaction, ScreenDef, ScreenDocument, UiNode } from "./schema";
import { SCHEMA_VERSION } from "./schema";

export function currentScreen(doc: ScreenDocument, screenId?: string | null): ScreenDef {
  const id = screenId || doc.startScreenId;
  return doc.screens.find((screen) => screen.id === id) ?? doc.screens[0];
}

export function currentRoot(doc: ScreenDocument, screenId?: string | null): UiNode {
  return currentScreen(doc, screenId).root;
}

export function replaceScreenRoot(doc: ScreenDocument, screenId: string, root: UiNode): ScreenDocument {
  const screens = doc.screens.map((screen) => (screen.id === screenId ? { ...screen, root } : screen));
  const start = screens.find((screen) => screen.id === doc.startScreenId) ?? screens[0];
  return { ...doc, screens, root: start?.root ?? root };
}

export function mapAllRoots(doc: ScreenDocument, mapper: (root: UiNode, screen: ScreenDef) => UiNode): ScreenDocument {
  const screens = doc.screens.map((screen) => ({ ...screen, root: mapper(screen.root, screen) }));
  const start = screens.find((screen) => screen.id === doc.startScreenId) ?? screens[0];
  return { ...doc, screens, root: start?.root ?? doc.root };
}

export function patchScreen(doc: ScreenDocument, screenId: string, patch: Partial<ScreenDef>): ScreenDocument {
  return {
    ...doc,
    screens: doc.screens.map((screen) => (screen.id === screenId ? { ...screen, ...patch } : screen)),
  };
}

function normalizeNode(node: UiNode): UiNode {
  let interactions = node.interactions;
  if ((!interactions || interactions.length === 0) && node.onClick && node.onClick.type !== "none") {
    interactions = [{ event: "tap", action: node.onClick } satisfies Interaction];
  }
  const tap = interactions?.find((item) => item.event === "tap")?.action;
  return {
    ...node,
    interactions,
    onClick: tap ?? node.onClick,
    children: node.children?.map(normalizeNode),
  };
}

export function normalizeDocument(doc: ScreenDocument): ScreenDocument {
  if (doc.screens?.length) {
    const start = doc.screens.find((screen) => screen.id === doc.startScreenId) ?? doc.screens[0];
    const screens = doc.screens.map((screen, index) => {
      const rooted: ScreenDef = { ...screen, root: normalizeNode(screen.root) };
      if (!rooted.dataSourceIds?.length && rooted.emptyPath) {
        const id = rooted.emptyPath.split(".")[0];
        if (id) rooted.dataSourceIds = [id];
      }
      if (rooted.flowX == null) rooted.flowX = 48 + (index % 3) * 280;
      if (rooted.flowY == null) rooted.flowY = 48 + Math.floor(index / 3) * 220;
      return rooted;
    });
    const nextStart = screens.find((screen) => screen.id === start.id) ?? screens[0];
    return {
      ...doc,
      schemaVersion: SCHEMA_VERSION,
      screens,
      root: nextStart.root,
      startScreenId: nextStart.id,
      assets: doc.assets ?? [],
    };
  }
  const legacyRoot = normalizeNode(doc.root);
  const screen: ScreenDef = {
    id: "main",
    name: doc.name || "Main",
    route: "/",
    root: legacyRoot,
    dataSourceIds: doc.dataSources.map((source) => source.id),
    flowX: 48,
    flowY: 48,
  };
  return {
    ...doc,
    schemaVersion: SCHEMA_VERSION,
    screens: [screen],
    startScreenId: "main",
    root: legacyRoot,
    assets: doc.assets ?? [],
  };
}
