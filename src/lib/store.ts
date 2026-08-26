"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createNode } from "./catalog";
import { fetchSources, type BindingScope } from "./bindings";
import type { DataSource, NodeType, ScreenDocument, SlotName, UiNode } from "./schema";
import { createStarterScreen } from "./starter-screen";
import { acceptsChild, findNode, findParent, insertChild, moveChild, removeNode, updateNode } from "./tree";

interface DesignerState {
  screen: ScreenDocument;
  selectedId: string | null;
  previewData: BindingScope;
  previewErrors: Record<string, string>;
  previewStatus: "idle" | "loading" | "ready" | "error";
  liveData: boolean;
  select: (id: string | null) => void;
  setName: (name: string) => void;
  setTheme: (theme: ScreenDocument["theme"]) => void;
  addNode: (parentId: string, type: NodeType, slot?: SlotName) => string | null;
  patchNode: (id: string, patch: Partial<UiNode>) => void;
  deleteSelected: () => void;
  moveSelected: (direction: -1 | 1) => void;
  addDataSource: () => void;
  patchDataSource: (id: string, patch: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  loadPreview: () => Promise<void>;
  setLiveData: (live: boolean) => void;
  reset: () => void;
  loadDocument: (screen: ScreenDocument) => void;
}

export const useDesigner = create<DesignerState>()(
  persist(
    (set, get) => ({
      screen: createStarterScreen(),
      selectedId: "headline",
      previewData: {},
      previewErrors: {},
      previewStatus: "idle",
      liveData: true,
      select: (id) => set({ selectedId: id }),
      setName: (name) => set({ screen: { ...get().screen, name } }),
      setTheme: (theme) => set({ screen: { ...get().screen, theme } }),
      addNode: (parentId, type, slot) => {
        const parent = findNode(get().screen.root, parentId);
        if (!parent || !acceptsChild(parent.type, type)) return null;
        const node = createNode(type);
        if (slot) node.slot = slot;
        if (parent.type === "Scaffold" && !slot) {
          if (type === "TopAppBar") node.slot = "topBar";
          else if (type === "NavigationBar") node.slot = "bottomBar";
          else if (type === "FAB") node.slot = "fab";
          else node.slot = "content";
        }
        set({
          screen: { ...get().screen, root: insertChild(get().screen.root, parentId, node) },
          selectedId: node.id,
        });
        return node.id;
      },
      patchNode: (id, patch) => {
        set({ screen: { ...get().screen, root: updateNode(get().screen.root, id, patch) } });
      },
      deleteSelected: () => {
        const { selectedId, screen } = get();
        if (!selectedId || selectedId === screen.root.id) return;
        const parent = findParent(screen.root, selectedId);
        set({
          screen: { ...screen, root: removeNode(screen.root, selectedId) },
          selectedId: parent?.id ?? screen.root.id,
        });
      },
      moveSelected: (direction) => {
        const { selectedId, screen } = get();
        if (!selectedId) return;
        set({ screen: { ...screen, root: moveChild(screen.root, selectedId, direction) } });
      },
      addDataSource: () => {
        const source: DataSource = {
          id: `api_${Math.random().toString(36).slice(2, 7)}`,
          name: "New API",
          url: "https://jsonplaceholder.typicode.com/users/1",
          method: "GET",
          mock: { name: "Ada Lovelace" },
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
            body: JSON.stringify({ dataSources: get().screen.dataSources }),
          });
          if (!res.ok) throw new Error(await res.text());
          const payload = (await res.json()) as {
            data: BindingScope;
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
          const { data, errors } = await fetchSources(get().screen.dataSources);
          set({
            previewData: data,
            previewErrors: errors,
            previewStatus: "error",
          });
        }
      },
      setLiveData: (live) => set({ liveData: live }),
      reset: () =>
        set({
          screen: createStarterScreen(),
          selectedId: "headline",
          previewData: {},
          previewErrors: {},
          previewStatus: "idle",
        }),
      loadDocument: (screen) =>
        set({
          screen,
          selectedId: screen.root.id,
          previewStatus: "idle",
        }),
    }),
    {
      name: "compose-studio-draft",
      partialize: (state) => ({ screen: state.screen, selectedId: state.selectedId, liveData: state.liveData }),
    },
  ),
);
