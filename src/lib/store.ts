"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createNode } from "./catalog";
import { currentRoot, currentScreen, mapAllRoots, normalizeDocument, patchScreen, replaceScreenRoot } from "./document";
import type {
  AssetRef,
  CanvasState,
  DataSource,
  NodeType,
  ScreenDef,
  ScreenDocument,
  SlotName,
  UiNode,
  WorkspaceMode,
} from "./schema";
import { createStarterScreen } from "./starter-screen";
import {
  acceptsChild,
  clearNodeWiring,
  countWiring,
  findNode,
  findParent,
  insertChild,
  mapTree,
  moveChild,
  removeNode,
  stripBindingsToSource,
  stripWiresToScreens,
  updateNode,
} from "./tree";

interface DesignerSnapshot {
  screen: ScreenDocument;
  currentScreenId: string;
  selectedId: string | null;
}

interface DesignerState {
  screen: ScreenDocument;
  currentScreenId: string;
  selectedId: string | null;
  previewData: Record<string, unknown>;
  previewErrors: Record<string, string>;
  previewStatus: "idle" | "loading" | "ready" | "error";
  liveData: boolean;
  playMode: boolean;
  canvasState: CanvasState;
  workspaceMode: WorkspaceMode;
  past: DesignerSnapshot[];
  future: DesignerSnapshot[];
  select: (id: string | null) => void;
  setName: (name: string) => void;
  setTheme: (theme: ScreenDocument["theme"]) => void;
  setCurrentScreen: (id: string) => void;
  addScreen: () => void;
  deleteCurrentScreen: () => string | null;
  patchCurrentScreen: (patch: Partial<ScreenDef>) => void;
  addNode: (parentId: string, type: NodeType, slot?: SlotName) => string | null;
  patchNode: (id: string, patch: Partial<UiNode>) => void;
  deleteSelected: () => string | null;
  clearSelectedWiring: () => string | null;
  moveSelected: (direction: -1 | 1) => void;
  addDataSource: () => void;
  patchDataSource: (id: string, patch: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  loadPreview: () => Promise<void>;
  setLiveData: (live: boolean) => void;
  setPlayMode: (play: boolean) => void;
  setCanvasState: (state: CanvasState) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  addAsset: (asset: AssetRef) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  loadDocument: (screen: ScreenDocument) => void;
}

function withRoot(doc: ScreenDocument, screenId: string, root: UiNode): ScreenDocument {
  return replaceScreenRoot(doc, screenId, root);
}

function cloneSnapshot(state: { screen: ScreenDocument; currentScreenId: string; selectedId: string | null }): DesignerSnapshot {
  return {
    screen: structuredClone(state.screen),
    currentScreenId: state.currentScreenId,
    selectedId: state.selectedId,
  };
}

let lastPatch: { id: string; at: number } | null = null;

export const useDesigner = create<DesignerState>()(
  persist(
    (set, get) => {
      function historyPatch(extra: Partial<DesignerState> = {}) {
        const current = get();
        return {
          past: [...current.past, cloneSnapshot(current)].slice(-60),
          future: [] as DesignerSnapshot[],
          ...extra,
        };
      }

      return {
        screen: createStarterScreen(),
        currentScreenId: "headlines",
        selectedId: "headlines-lede",
        previewData: {},
        previewErrors: {},
        previewStatus: "idle",
        liveData: true,
        playMode: false,
        canvasState: "auto",
        workspaceMode: "design",
        past: [],
        future: [],
        select: (id) => set({ selectedId: id }),
        setName: (name) => set({ ...historyPatch(), screen: { ...get().screen, name } }),
        setTheme: (theme) => set({ ...historyPatch(), screen: { ...get().screen, theme } }),
        setCurrentScreen: (id) => {
          const screen = currentScreen(get().screen, id);
          set({ currentScreenId: screen.id, selectedId: screen.root.id });
        },
        addScreen: () => {
          const id = `screen_${Math.random().toString(36).slice(2, 6)}`;
          const scaffold = createNode("Scaffold");
          const index = get().screen.screens.length;
          const def: ScreenDef = {
            id,
            name: "New screen",
            route: `/${id}`,
            root: scaffold,
            dataSourceIds: [],
            flowX: 48 + (index % 3) * 280,
            flowY: 48 + Math.floor(index / 3) * 220,
          };
          set({
            ...historyPatch(),
            screen: { ...get().screen, screens: [...get().screen.screens, def] },
            currentScreenId: id,
            selectedId: scaffold.id,
          });
        },
        deleteCurrentScreen: () => {
          const { screen, currentScreenId } = get();
          if (screen.screens.length < 2) return "Keep at least one screen.";
          const removed = new Set([currentScreenId]);
          const remaining = screen.screens.filter((item) => item.id !== currentScreenId);
          const nextId = remaining[0]?.id;
          if (!nextId) return "Keep at least one screen.";
          const cleaned = mapAllRoots(
            { ...screen, screens: remaining, startScreenId: screen.startScreenId === currentScreenId ? nextId : screen.startScreenId },
            (root) => stripWiresToScreens(root, removed),
          );
          set({
            ...historyPatch(),
            screen: cleaned,
            currentScreenId: nextId,
            selectedId: currentScreen(cleaned, nextId).root.id,
          });
          return `Removed screen and prototype wires that targeted it.`;
        },
        patchCurrentScreen: (patch) => {
          const { screen, currentScreenId } = get();
          set({ ...historyPatch(), screen: patchScreen(screen, currentScreenId, patch) });
        },
        addNode: (parentId, type, slot) => {
          const { screen, currentScreenId } = get();
          const root = currentRoot(screen, currentScreenId);
          const parent = findNode(root, parentId);
          if (!parent || !acceptsChild(parent.type, type)) return null;
          const node = createNode(type);
          if (slot) node.slot = slot;
          if (parent.type === "Scaffold" && !slot) {
            if (type === "TopAppBar") node.slot = "topBar";
            else if (type === "NavigationBar") node.slot = "bottomBar";
            else if (type === "FAB") node.slot = "fab";
            else node.slot = "content";
          }
          const nextRoot = insertChild(root, parentId, node);
          set({
            ...historyPatch(),
            screen: withRoot(screen, currentScreenId, nextRoot),
            selectedId: node.id,
          });
          return node.id;
        },
        patchNode: (id, patch) => {
          const current = get();
          const now = Date.now();
          const coalesce =
            Boolean(lastPatch) &&
            lastPatch!.id === id &&
            now - lastPatch!.at < 450 &&
            current.future.length === 0;
          lastPatch = { id, at: now };
          const root = currentRoot(current.screen, current.currentScreenId);
          set({
            ...(coalesce ? {} : historyPatch()),
            screen: withRoot(current.screen, current.currentScreenId, updateNode(root, id, patch)),
          });
        },
        deleteSelected: () => {
          const { selectedId, screen, currentScreenId } = get();
          const root = currentRoot(screen, currentScreenId);
          if (!selectedId || selectedId === root.id) return "The Scaffold shell cannot be removed. Clear its children instead.";
          const target = findNode(root, selectedId);
          if (!target) return null;
          const stats = countWiring(target);
          const parent = findParent(root, selectedId);
          set({
            ...historyPatch(),
            screen: withRoot(screen, currentScreenId, removeNode(root, selectedId)),
            selectedId: parent?.id ?? root.id,
          });
          return `Removed ${target.type} (${stats.widgets} widget${stats.widgets === 1 ? "" : "s"}, ${stats.bindings} binding${stats.bindings === 1 ? "" : "s"}, ${stats.wires} wire${stats.wires === 1 ? "" : "s"}).`;
        },
        clearSelectedWiring: () => {
          const { selectedId, screen, currentScreenId } = get();
          const root = currentRoot(screen, currentScreenId);
          if (!selectedId) return null;
          const target = findNode(root, selectedId);
          if (!target) return null;
          const stats = countWiring(target);
          set({
            ...historyPatch(),
            screen: withRoot(
              screen,
              currentScreenId,
              mapTree(root, (node) => (node.id === selectedId ? clearNodeWiring(node) : node)),
            ),
          });
          return `Cleared ${stats.bindings} binding${stats.bindings === 1 ? "" : "s"} and ${stats.wires} wire${stats.wires === 1 ? "" : "s"} on ${target.type}.`;
        },
        moveSelected: (direction) => {
          const { selectedId, screen, currentScreenId } = get();
          if (!selectedId) return;
          const root = currentRoot(screen, currentScreenId);
          set({ ...historyPatch(), screen: withRoot(screen, currentScreenId, moveChild(root, selectedId, direction)) });
        },
        addDataSource: () => {
          const source: DataSource = {
            id: `api_${Math.random().toString(36).slice(2, 7)}`,
            name: "New API",
            url: "/api/news/us",
            method: "GET",
            headerRows: [],
            queryRows: [],
            formRows: [],
            bodyMode: "none",
            fallbackToMock: false,
            mock: { articles: [] },
          };
          set({ ...historyPatch(), screen: { ...get().screen, dataSources: [...get().screen.dataSources, source] } });
        },
        patchDataSource: (id, patch) => {
          set({
            ...historyPatch(),
            screen: {
              ...get().screen,
              dataSources: get().screen.dataSources.map((source) =>
                source.id === id ? { ...source, ...patch } : source,
              ),
            },
          });
        },
        removeDataSource: (id) => {
          const screen = get().screen;
          const next = mapAllRoots(
            { ...screen, dataSources: screen.dataSources.filter((source) => source.id !== id) },
            (root) => stripBindingsToSource(root, id),
          );
          set({ ...historyPatch(), screen: next });
        },
        loadPreview: async () => {
          set({ previewStatus: "loading" });
          try {
            const res = await fetch("/api/bind", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dataSources: get().screen.dataSources,
                scope: { forms: {}, route: {} },
              }),
            });
            if (!res.ok) throw new Error(await res.text());
            const payload = (await res.json()) as {
              data: Record<string, unknown>;
              errors: Record<string, string>;
            };
            const hasHardError =
              Object.keys(payload.errors).length > 0 && Object.keys(payload.data).length === 0;
            set({
              previewData: payload.data,
              previewErrors: payload.errors,
              previewStatus: hasHardError ? "error" : "ready",
            });
          } catch {
            set({ previewStatus: "error" });
          }
        },
        setLiveData: (live) => set({ liveData: live }),
        setPlayMode: (play) => set({ playMode: play, workspaceMode: play ? "design" : get().workspaceMode }),
        setCanvasState: (canvasState) => set({ canvasState }),
        setWorkspaceMode: (workspaceMode) => set({ workspaceMode, playMode: false }),
        addAsset: (asset) => {
          const screen = get().screen;
          const assets = [asset, ...(screen.assets ?? []).filter((item) => item.id !== asset.id)];
          set({ ...historyPatch(), screen: { ...screen, assets } });
        },
        undo: () => {
          const { past, future } = get();
          const previous = past.at(-1);
          if (!previous) return;
          lastPatch = null;
          const current = cloneSnapshot(get());
          set({
            past: past.slice(0, -1),
            future: [...future, current],
            screen: previous.screen,
            currentScreenId: previous.currentScreenId,
            selectedId: previous.selectedId,
          });
        },
        redo: () => {
          const { past, future } = get();
          const next = future.at(-1);
          if (!next) return;
          lastPatch = null;
          const current = cloneSnapshot(get());
          set({
            future: future.slice(0, -1),
            past: [...past, current],
            screen: next.screen,
            currentScreenId: next.currentScreenId,
            selectedId: next.selectedId,
          });
        },
        reset: () => {
          const next = createStarterScreen();
          set({
            ...historyPatch(),
            screen: next,
            currentScreenId: next.startScreenId,
            selectedId: "headlines-lede",
            previewData: {},
            previewErrors: {},
            previewStatus: "idle",
            playMode: false,
            canvasState: "auto",
            workspaceMode: "design",
          });
        },
        loadDocument: (screen) => {
          const doc = normalizeDocument(screen);
          set({
            ...historyPatch(),
            screen: doc,
            currentScreenId: doc.startScreenId,
            selectedId: doc.root.id,
            previewStatus: "idle",
          });
        },
      };
    },
    {
      name: "compose-studio-draft-v6",
      partialize: (state) => ({
        screen: state.screen,
        currentScreenId: state.currentScreenId,
        selectedId: state.selectedId,
        liveData: state.liveData,
      }),
      merge: (persisted, current) => {
        const raw = (persisted as Partial<DesignerState>) ?? {};
        const screen = raw.screen ? normalizeDocument(raw.screen) : current.screen;
        return {
          ...current,
          ...raw,
          screen,
          currentScreenId: raw.currentScreenId ?? screen.startScreenId,
          past: [],
          future: [],
        };
      },
    },
  ),
);

export type { DesignerSnapshot };
