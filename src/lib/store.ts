"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createNode } from "./catalog";
import { currentRoot, currentScreen, normalizeDocument, patchScreen, replaceScreenRoot } from "./document";
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
import { acceptsChild, findNode, findParent, insertChild, moveChild, removeNode, updateNode } from "./tree";

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
  select: (id: string | null) => void;
  setName: (name: string) => void;
  setTheme: (theme: ScreenDocument["theme"]) => void;
  setCurrentScreen: (id: string) => void;
  addScreen: () => void;
  patchCurrentScreen: (patch: Partial<ScreenDef>) => void;
  addNode: (parentId: string, type: NodeType, slot?: SlotName) => string | null;
  patchNode: (id: string, patch: Partial<UiNode>) => void;
  deleteSelected: () => void;
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
  reset: () => void;
  loadDocument: (screen: ScreenDocument) => void;
}

function withRoot(doc: ScreenDocument, screenId: string, root: UiNode): ScreenDocument {
  return replaceScreenRoot(doc, screenId, root);
}

export const useDesigner = create<DesignerState>()(
  persist(
    (set, get) => ({
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
      select: (id) => set({ selectedId: id }),
      setName: (name) => set({ screen: { ...get().screen, name } }),
      setTheme: (theme) => set({ screen: { ...get().screen, theme } }),
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
          screen: { ...get().screen, screens: [...get().screen.screens, def] },
          currentScreenId: id,
          selectedId: scaffold.id,
        });
      },
      patchCurrentScreen: (patch) => {
        const { screen, currentScreenId } = get();
        set({ screen: patchScreen(screen, currentScreenId, patch) });
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
          screen: withRoot(screen, currentScreenId, nextRoot),
          selectedId: node.id,
        });
        return node.id;
      },
      patchNode: (id, patch) => {
        const { screen, currentScreenId } = get();
        const root = currentRoot(screen, currentScreenId);
        set({ screen: withRoot(screen, currentScreenId, updateNode(root, id, patch)) });
      },
      deleteSelected: () => {
        const { selectedId, screen, currentScreenId } = get();
        const root = currentRoot(screen, currentScreenId);
        if (!selectedId || selectedId === root.id) return;
        const parent = findParent(root, selectedId);
        set({
          screen: withRoot(screen, currentScreenId, removeNode(root, selectedId)),
          selectedId: parent?.id ?? root.id,
        });
      },
      moveSelected: (direction) => {
        const { selectedId, screen, currentScreenId } = get();
        if (!selectedId) return;
        const root = currentRoot(screen, currentScreenId);
        set({ screen: withRoot(screen, currentScreenId, moveChild(root, selectedId, direction)) });
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
        set({ screen: { ...get().screen, dataSources: [...get().screen.dataSources, source] } });
      },
      patchDataSource: (id, patch) => {
        set({
          screen: {
            ...get().screen,
            dataSources: get().screen.dataSources.map((source) =>
              source.id === id ? { ...source, ...patch } : source,
            ),
          },
        });
      },
      removeDataSource: (id) => {
        set({
          screen: {
            ...get().screen,
            dataSources: get().screen.dataSources.filter((source) => source.id !== id),
          },
        });
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
        set({ screen: { ...screen, assets } });
      },
      reset: () => {
        const next = createStarterScreen();
        set({
          screen: next,
          currentScreenId: next.startScreenId,
          selectedId: "headlines-lede",
          previewData: {},
          previewErrors: {},
          previewStatus: "idle",
          playMode: false,
          canvasState: "auto",
        });
      },
      loadDocument: (screen) => {
        const doc = normalizeDocument(screen);
        set({
          screen: doc,
          currentScreenId: doc.startScreenId,
          selectedId: doc.root.id,
          previewStatus: "idle",
        });
      },
    }),
    {
      name: "compose-studio-draft-v5",
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
        };
      },
    },
  ),
);
