"use client";

import { useState, useSyncExternalStore } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Palette } from "./Palette";
import { Layers } from "./Layers";
import { Inspector } from "./Inspector";
import { DataSourcesPanel } from "./DataSourcesPanel";
import { Toolbar } from "./Toolbar";
import { PhoneFrame } from "./PhoneFrame";
import { RuntimeHost } from "@/components/runtime/RuntimeHost";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDesigner } from "@/lib/store";
import { CATALOG } from "@/lib/catalog";
import { currentRoot } from "@/lib/document";
import { acceptsChild, findNode, findParent, isContainer } from "@/lib/tree";
import type { NodeType, SlotName } from "@/lib/schema";
import { toast } from "sonner";

export function Designer() {
  const screen = useDesigner((s) => s.screen);
  const currentScreenId = useDesigner((s) => s.currentScreenId);
  const selectedId = useDesigner((s) => s.selectedId);
  const select = useDesigner((s) => s.select);
  const addNode = useDesigner((s) => s.addNode);
  const previewData = useDesigner((s) => s.previewData);
  const previewErrors = useDesigner((s) => s.previewErrors);
  const liveData = useDesigner((s) => s.liveData);
  const playMode = useDesigner((s) => s.playMode);
  const canvasState = useDesigner((s) => s.canvasState);
  const [activeType, setActiveType] = useState<NodeType | null>(null);
  const [mobileTab, setMobileTab] = useState("canvas");
  const hydrated = useSyncExternalStore(
    (onChange) => useDesigner.persist.onFinishHydration(onChange),
    () => useDesigner.persist.hasHydrated(),
    () => false,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const root = currentRoot(screen, currentScreenId);

  function onDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type as NodeType | undefined;
    setActiveType(type ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveType(null);
    const type = event.active.data.current?.type as NodeType | undefined;
    const targetId = String(event.over?.data.current?.targetId ?? event.over?.id ?? "");
    if (!type || !targetId || targetId.startsWith("palette-")) return;

    let parentId = targetId;
    let slot: SlotName | undefined;
    if (targetId.includes("::")) {
      const [id, slotName] = targetId.split("::") as [string, SlotName];
      parentId = id;
      slot = slotName;
    }

    const parent = findNode(root, parentId);
    if (!parent) return;
    if (!acceptsChild(parent.type, type)) {
      toast.error(`${type} cannot be dropped on ${parent.type}`);
      return;
    }
    addNode(parentId, type, slot);
  }

  function addToSelection(type: NodeType) {
    const selected = selectedId ? findNode(root, selectedId) : root;
    if (selected && isContainer(selected.type) && acceptsChild(selected.type, type)) {
      addNode(selected.id, type);
      return;
    }
    const parent = selectedId ? findParent(root, selectedId) : null;
    if (parent && acceptsChild(parent.type, type)) {
      addNode(parent.id, type);
      return;
    }
    toast.error("Select a layout container first, then drop or click a component.");
  }

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Restoring canvas…
      </div>
    );
  }

  const catalogLabel = CATALOG.find((item) => item.type === activeType)?.label;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[240px] shrink-0 flex-col border-r md:flex">
            <div className="h-1/2 min-h-0 border-b">
              <Palette onAdd={addToSelection} />
            </div>
            <div className="h-1/2 min-h-0">
              <Layers />
            </div>
          </aside>
          <main className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,_#ece8f3,_#d8d3e0_62%,_#c9c4d2)] p-4 md:p-8">
            <div className="md:hidden absolute top-2 left-2 right-2 z-10">
              <Tabs value={mobileTab} onValueChange={setMobileTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="palette">Components</TabsTrigger>
                  <TabsTrigger value="canvas">Canvas</TabsTrigger>
                  <TabsTrigger value="inspect">Inspect</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className={mobileTab !== "palette" ? "hidden md:hidden" : "md:hidden w-full pt-12"}>
              <div className="rounded-xl border bg-background">
                <Palette onAdd={addToSelection} />
              </div>
            </div>
            <div className={mobileTab !== "inspect" ? "hidden md:hidden" : "md:hidden w-full pt-12"}>
              <div className="h-[70vh] rounded-xl border bg-background">
                <Inspector />
              </div>
            </div>
            <div className={mobileTab === "canvas" || mobileTab === "inspect" ? "md:block" : "hidden md:block"}>
              <RuntimeHost
                key={playMode ? `play-${screen.id}` : `edit-${screen.id}`}
                document={screen}
                mode={playMode ? "play" : "edit"}
                canvasState={canvasState}
                editScreenId={currentScreenId}
                liveData={liveData}
                previewData={previewData}
                previewErrors={previewErrors}
              >
                <PhoneFrame
                  document={screen}
                  selectedId={playMode ? null : selectedId}
                  onSelect={select}
                  interactive={!playMode}
                />
              </RuntimeHost>
            </div>
          </main>
          <aside className="hidden w-[300px] shrink-0 flex-col border-l lg:flex">
            <div className="h-[58%] min-h-0 border-b">
              <Inspector />
            </div>
            <div className="min-h-0 flex-1">
              <DataSourcesPanel />
            </div>
          </aside>
        </div>
      </div>
      <DragOverlay>
        {activeType ? (
          <div className="rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-lg">
            {catalogLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
