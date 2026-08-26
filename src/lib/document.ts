import type { ScreenDef, ScreenDocument, UiNode } from "./schema";

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

export function patchScreen(doc: ScreenDocument, screenId: string, patch: Partial<ScreenDef>): ScreenDocument {
  return {
    ...doc,
    screens: doc.screens.map((screen) => (screen.id === screenId ? { ...screen, ...patch } : screen)),
  };
}

export function normalizeDocument(doc: ScreenDocument): ScreenDocument {
  if (doc.screens?.length) {
    const start = doc.screens.find((screen) => screen.id === doc.startScreenId) ?? doc.screens[0];
    const screens = doc.screens.map((screen) => {
      if (screen.dataSourceIds && screen.dataSourceIds.length > 0) return screen;
      if (screen.emptyPath) {
        const id = screen.emptyPath.split(".")[0];
        if (id) return { ...screen, dataSourceIds: [id] };
      }
      return screen;
    });
    const nextStart = screens.find((screen) => screen.id === start.id) ?? screens[0];
    return { ...doc, schemaVersion: 2, screens, root: nextStart.root, startScreenId: nextStart.id };
  }
  const legacyRoot = doc.root;
  const screen: ScreenDef = {
    id: "main",
    name: doc.name || "Main",
    route: "/",
    root: legacyRoot,
    dataSourceIds: doc.dataSources.map((source) => source.id),
  };
  return {
    ...doc,
    schemaVersion: 2,
    screens: [screen],
    startScreenId: "main",
    root: legacyRoot,
  };
}
