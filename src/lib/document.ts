import type { Interaction, ScreenDef, ScreenDocument, UiNode } from "./schema";
import { SCHEMA_VERSION } from "./schema";
import { isFlowLayoutParent, stripPeerConstraints } from "./layout";
import { flowPosition } from "./flow-layout";

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

function sanitizeDp(value: number | undefined): number | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  const rounded = Math.round(value);
  return Math.abs(rounded) < 1 ? undefined : rounded;
}

function sanitizeModifiers(
  modifiers: UiNode["modifiers"],
  parent?: UiNode,
): UiNode["modifiers"] {
  const next = { ...modifiers };
  for (const key of [
    "widthDp",
    "heightDp",
    "sizeDp",
    "minWidthDp",
    "maxWidthDp",
    "minHeightDp",
    "maxHeightDp",
    "defaultMinWidthDp",
    "defaultMinHeightDp",
    "requiredWidthDp",
    "requiredHeightDp",
    "requiredSizeDp",
    "elevationDp",
    "borderWidthDp",
    "graphicsTranslationX",
    "graphicsTranslationY",
    "graphicsShadowElevation",
  ] as const) {
    const value = next[key];
    if (typeof value === "number") next[key] = Math.round(value);
  }
  // Flow children follow Column/Row order — free-drag offsets only break device parity.
  if (parent && isFlowLayoutParent(parent.type)) {
    delete next.offsetXDp;
    delete next.offsetYDp;
    return next;
  }
  const ox = sanitizeDp(next.offsetXDp);
  const oy = sanitizeDp(next.offsetYDp);
  if (ox == null) delete next.offsetXDp;
  else next.offsetXDp = ox;
  if (oy == null) delete next.offsetYDp;
  else next.offsetYDp = oy;
  return next;
}

/**
 * Free-drag views parked as Scaffold siblings (no slot) are dropped by runtimes that only
 * read topBar/content/bottomBar. Keep them in a content Box overlay so publish matches canvas.
 */
function normalizeScaffoldChildren(children: UiNode[] | undefined): UiNode[] | undefined {
  if (!children?.length) return children;
  const chrome = new Set(["topBar", "bottomBar", "fab", "rail"]);
  const slotted = children.filter((child) => child.slot && chrome.has(child.slot));
  const content = children.find((child) => child.slot === "content");
  const orphans = children.filter((child) => child !== content && !(child.slot && chrome.has(child.slot)));
  if (!orphans.length) return children.map((child) => normalizeNode(child));

  const contentKids: UiNode[] = [
    ...(content
      ? [
          {
            ...content,
            slot: undefined,
          } satisfies UiNode,
        ]
      : []),
    ...orphans,
  ];

  const wrap: UiNode = {
    id: content?.id ? `${content.id}_host` : `scaffold_content_${Math.random().toString(36).slice(2, 8)}`,
    type: "Box",
    props: { alignment: "topStart" },
    modifiers: {
      fillMaxWidth: true,
      fillMaxHeight: true,
      widthMode: "fill",
      heightMode: "fill",
    },
    slot: "content",
    children: contentKids,
  };
  return [...slotted.map((child) => normalizeNode(child)), normalizeNode(wrap)];
}

function scaffoldReservesChromeSpace(children: UiNode[] | undefined): boolean {
  return (children ?? []).some((child) => {
    const slot = child.slot;
    if (slot === "topBar" || slot === "bottomBar" || slot === "rail") return true;
    return (
      child.type === "TopAppBar" ||
      child.type === "NavigationBar" ||
      child.type === "NavigationRail" ||
      child.type === "NavigationDrawer"
    );
  });
}

/**
 * Empty top / bottom / side chrome must not reserve layout on publish.
 * Promote content to fill the screen (keep Scaffold only when a FAB still needs a host).
 */
function collapseEmptyScaffoldChrome(node: UiNode): UiNode {
  const children = node.children ?? [];
  if (scaffoldReservesChromeSpace(children)) return node;

  const content = children.find((child) => child.slot === "content");
  const fab = children.find((child) => child.slot === "fab" || child.type === "FAB");
  if (!content) return node;

  const filledContent: UiNode = {
    ...content,
    slot: fab ? "content" : undefined,
    modifiers: {
      ...content.modifiers,
      fillMaxWidth: true,
      fillMaxHeight: true,
      widthMode: content.modifiers?.widthMode ?? "fill",
      heightMode: content.modifiers?.heightMode ?? "fill",
      backgroundToken: content.modifiers?.backgroundToken ?? node.modifiers?.backgroundToken,
      backgroundHex: content.modifiers?.backgroundHex ?? node.modifiers?.backgroundHex,
    },
  };

  if (!fab) {
    return filledContent;
  }

  return {
    ...node,
    children: [filledContent, fab],
  };
}

function normalizeNode(node: UiNode, parent?: UiNode): UiNode {
  let interactions = node.interactions;
  if ((!interactions || interactions.length === 0) && node.onClick && node.onClick.type !== "none") {
    interactions = [{ event: "tap", action: node.onClick } satisfies Interaction];
  }
  const tap = interactions?.find((item) => item.event === "tap")?.action;
  let constraints = stripPeerConstraints(node.constraints);
  let children =
    node.type === "Scaffold"
      ? normalizeScaffoldChildren(node.children)
      : node.children?.map((child) => normalizeNode(child, node));

  let next: UiNode = {
    ...node,
    constraints,
    modifiers: sanitizeModifiers(node.modifiers ?? {}, parent),
    interactions,
    onClick: tap ?? node.onClick,
    children,
  };

  if (next.type === "Scaffold") {
    next = collapseEmptyScaffoldChrome(next);
    // collapse may promote content (non-Scaffold) — still sanitize that path
    if (next.type !== "Scaffold") {
      next = {
        ...next,
        modifiers: sanitizeModifiers(next.modifiers ?? {}, parent),
        children: next.children?.map((child) => normalizeNode(child, next)),
      };
    }
  }

  return next;
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
      if (rooted.flowX == null || rooted.flowY == null) {
        const pos = flowPosition(index);
        if (rooted.flowX == null) rooted.flowX = pos.flowX;
        if (rooted.flowY == null) rooted.flowY = pos.flowY;
      }
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
      dataModels: doc.dataModels ?? [],
      activeModelId: doc.activeModelId,
    };
  }
  const legacyRoot = normalizeNode(doc.root);
  const screen: ScreenDef = {
    id: "main",
    name: doc.name || "Main",
    route: "/",
    root: legacyRoot,
    dataSourceIds: doc.dataSources.map((source) => source.id),
    flowX: flowPosition(0).flowX,
    flowY: flowPosition(0).flowY,
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
