"use client";

import { useState, useSyncExternalStore } from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Palette } from "./Palette";
import { Layers } from "./Layers";
import { Inspector } from "./Inspector";
import { DataSourcesPanel } from "./DataSourcesPanel";
import { KotlinModelsPanel } from "./KotlinModelsPanel";
import { Toolbar } from "./Toolbar";
import { PhoneFrame } from "./PhoneFrame";
import { FlowBoard } from "./FlowBoard";
import { HistoryHotkeys } from "./HistoryHotkeys";
import { CanvasStage } from "./CanvasStage";
import { HorizontalResize, VerticalResize } from "./PaneSplit";
import { cn } from "@/lib/utils";
import { RuntimeHost } from "@/components/runtime/RuntimeHost";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDesigner } from "@/lib/store";
import { CATALOG } from "@/lib/catalog";
import { currentRoot } from "@/lib/document";
import { acceptsChild, findNode, findParent, hostIdFromVirtual, isContainer, isVirtualNodeId } from "@/lib/tree";
import { nodeIdFromOver } from "@/lib/drop";
import type { NodeType, SlotName } from "@/lib/schema";
import { toast } from "sonner";

const collisionDetection: CollisionDetection = (args) => {
  const activeId = String(args.active.id);
  const source = args.active.data.current?.source as string | undefined;
  const activeNodeId = args.active.data.current?.nodeId as string | undefined;
  const fromLayers = source === "layers" || activeId.startsWith("layer-");

  const droppableData = (collision: {
    id: string | number;
    data?: { droppableContainer?: { data?: { current?: { nodeId?: string; kind?: string } } } };
  }) => collision.data?.droppableContainer?.data?.current;

  const scoped = (collisions: ReturnType<typeof pointerWithin>) =>
    collisions.filter((collision) => {
      const id = String(collision.id);
      if (id.startsWith("palette-") || id.startsWith("canvas-")) return false;
      if (fromLayers && !id.startsWith("layer-")) return false;
      if (!fromLayers && (id.startsWith("layer-drop-") || id.startsWith("layer-"))) return false;
      const data = droppableData(collision);
      if (
        activeNodeId &&
        (data?.nodeId === activeNodeId ||
          id === `node-${activeNodeId}` ||
          id === `layer-${activeNodeId}` ||
          id === `layer-drop-${activeNodeId}`)
      ) {
        return false;
      }
      return true;
    });

  const preferSibling = (collisions: ReturnType<typeof pointerWithin>) => {
    const reorder = collisions.filter((collision) => droppableData(collision)?.kind === "reorder");
    return reorder.length ? reorder : collisions;
  };

  const pointer = preferSibling(scoped(pointerWithin(args)));
  if (pointer.length) return pointer;
  return preferSibling(scoped(closestCorners(args)));
};

function dropAfter(event: DragEndEvent) {
  const over = event.over;
  if (!over) return false;
  const start = event.activatorEvent as PointerEvent | undefined;
  const x = (start?.clientX ?? 0) + event.delta.x;
  const y = (start?.clientY ?? 0) + event.delta.y;
  const horizontal = over.rect.width > over.rect.height * 1.6;
  return horizontal ? x > over.rect.left + over.rect.width / 2 : y > over.rect.top + over.rect.height / 2;
}

export function Designer() {
  const screen = useDesigner((s) => s.screen);
  const currentScreenId = useDesigner((s) => s.currentScreenId);
  const selectedId = useDesigner((s) => s.selectedId);
  const select = useDesigner((s) => s.select);
  const addNode = useDesigner((s) => s.addNode);
  const relocate = useDesigner((s) => s.relocateNode);
  const previewData = useDesigner((s) => s.previewData);
  const previewErrors = useDesigner((s) => s.previewErrors);
  const liveData = useDesigner((s) => s.liveData);
  const playMode = useDesigner((s) => s.playMode);
  const canvasState = useDesigner((s) => s.canvasState);
  const workspaceMode = useDesigner((s) => s.workspaceMode);
  const layout = useDesigner((s) => s.layout);
  const setLayout = useDesigner((s) => s.setLayout);
  const [activeDrag, setActiveDrag] = useState<{ type: NodeType; label: string } | null>(null);
  const [mobileTab, setMobileTab] = useState("canvas");
  const hydrated = useSyncExternalStore(
    (onChange) => useDesigner.persist.onFinishHydration(onChange),
    () => useDesigner.persist.hasHydrated(),
    () => false,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: workspaceMode === "prototype" ? 10_000 : 5 },
    }),
  );

  const root = currentRoot(screen, currentScreenId);

  function onDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type as NodeType | undefined;
    const nodeId = event.active.data.current?.nodeId as string | undefined;
    const moving = nodeId ? findNode(root, nodeId) : null;
    const label =
      moving && typeof moving.props.label === "string"
        ? moving.props.label
        : moving && typeof moving.props.text === "string"
          ? moving.props.text
          : type
            ? (CATALOG.find((item) => item.type === type)?.label ?? type)
            : "";
    setActiveDrag(type ? { type, label: String(label) } : null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const data = event.active.data.current as
      | { source?: string; type?: NodeType; nodeId?: string }
      | undefined;
    const over = event.over;
    if (!over) return;
    let targetId = nodeIdFromOver(over.id, over.data.current as { targetId?: string; nodeId?: string } | undefined);
    if (isVirtualNodeId(targetId)) {
      targetId = `${hostIdFromVirtual(targetId)}::content`;
    }
    if (!targetId || targetId.startsWith("palette-")) return;
    const kind = (over.data.current?.kind as string | undefined) ?? (data?.source === "layers" ? "reorder" : undefined);

    let parentId = targetId;
    let slot: SlotName | undefined;
    if (targetId.includes("::")) {
      const [id, slotName] = targetId.split("::") as [string, SlotName];
      parentId = id;
      slot = slotName;
    }

    const after = dropAfter(event);

    if ((data?.source === "canvas" || data?.source === "layers") && data.nodeId) {
      if (isVirtualNodeId(data.nodeId)) return;
      if (data.nodeId === parentId && kind !== "reorder") return;
      if (kind === "reorder") {
        const target = findNode(root, parentId);
        const parent = target ? findParent(root, parentId) : null;
        if (!target || !parent?.children) return;
        const index = parent.children.findIndex((child) => child.id === parentId);
        const message = relocate(data.nodeId, parent.id, Math.max(0, index + (after ? 1 : 0)));
        if (message) toast.message(message);
        return;
      }
      const parent = findNode(root, parentId);
      if (!parent) return;
      if (!acceptsChild(parent.type, data.type as NodeType)) {
        const siblingParent = findParent(root, parentId);
        if (siblingParent?.children && acceptsChild(siblingParent.type, data.type as NodeType)) {
          const index = siblingParent.children.findIndex((child) => child.id === parentId);
          const message = relocate(data.nodeId, siblingParent.id, Math.max(0, index + (after ? 1 : 0)));
          if (message) toast.message(message);
          return;
        }
        toast.error(`${data.type} cannot be dropped on ${parent.type}`);
        return;
      }
      const message = relocate(data.nodeId, parentId, parent.children?.length ?? 0);
      if (message) toast.message(message);
      return;
    }

    const type = data?.type;
    if (!type) return;
    if (kind === "reorder") {
      const target = findNode(root, parentId);
      const parent = target ? findParent(root, parentId) : null;
      if (!parent) return;
      if (!acceptsChild(parent.type, type)) {
        toast.error(`${type} cannot be dropped on ${parent.type}`);
        return;
      }
      const index = parent.children?.findIndex((child) => child.id === parentId) ?? 0;
      addNode(parent.id, type, slot, Math.max(0, index + (after ? 1 : 0)));
      return;
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

  const catalogLabel = activeDrag
    ? (CATALOG.find((item) => item.type === activeDrag.type)?.label ?? activeDrag.type)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <HistoryHotkeys />
        <Toolbar />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className="hidden min-h-0 shrink-0 flex-col overflow-hidden border-r bg-background md:flex"
            style={{ width: layout.leftW }}
          >
            <div className="min-h-0 overflow-hidden" style={{ flex: `${layout.leftSplit} 1 0` }}>
              <Palette onAdd={addToSelection} />
            </div>
            <HorizontalResize
              onDelta={(dy) => {
                const total = 600;
                setLayout({ leftSplit: layout.leftSplit + dy / total });
              }}
            />
            <div className="min-h-0 overflow-hidden" style={{ flex: `${1 - layout.leftSplit} 1 0` }}>
              <Layers />
            </div>
          </aside>
          <VerticalResize className="hidden md:block" onDelta={(dx) => setLayout({ leftW: layout.leftW + dx })} />
          <main
            className={cn(
              "relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_#ece8f3,_#d8d3e0_62%,_#c9c4d2)]",
              workspaceMode === "prototype" ? "items-stretch" : "items-stretch",
            )}
          >
            <div className="absolute top-2 right-2 left-2 z-10 md:hidden">
              <Tabs value={mobileTab} onValueChange={setMobileTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="palette">Components</TabsTrigger>
                  <TabsTrigger value="canvas">Canvas</TabsTrigger>
                  <TabsTrigger value="inspect">Inspect</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className={mobileTab !== "palette" ? "hidden md:hidden" : "w-full pt-12 md:hidden"}>
              <div className="rounded-xl border bg-background">
                <Palette onAdd={addToSelection} />
              </div>
            </div>
            <div className={mobileTab !== "inspect" ? "hidden md:hidden" : "w-full pt-12 md:hidden"}>
              <div className="h-[70vh] overflow-hidden rounded-xl border bg-background">
                <Inspector />
              </div>
            </div>
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1",
                mobileTab === "canvas" || mobileTab === "inspect" ? "md:flex" : "hidden md:flex",
              )}
            >
              {workspaceMode === "prototype" ? (
                <FlowBoard />
              ) : (
                <CanvasStage>
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
                </CanvasStage>
              )}
            </div>
          </main>
          <VerticalResize className="hidden lg:block" onDelta={(dx) => setLayout({ rightW: layout.rightW - dx })} />
          <aside
            className="hidden min-h-0 shrink-0 flex-col overflow-hidden border-l bg-background lg:flex"
            style={{ width: layout.rightW }}
          >
            <div className="min-h-0 overflow-hidden bg-background" style={{ flex: `${layout.rightSplit} 1 0` }}>
              <Inspector />
            </div>
            <HorizontalResize
              onDelta={(dy) => {
                setLayout({ rightSplit: layout.rightSplit + dy / 600 });
              }}
            />
            <div className="flex min-h-0 flex-col overflow-hidden bg-background" style={{ flex: `${1 - layout.rightSplit} 1 0` }}>
              <Tabs defaultValue="request" className="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
                <div className="shrink-0 border-b px-2 pt-2">
                  <TabsList className="w-full">
                    <TabsTrigger value="request" className="flex-1">
                      Request
                    </TabsTrigger>
                    <TabsTrigger value="models" className="flex-1">
                      Models
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="request" className="mt-0 min-h-0 flex-1 overflow-hidden">
                  <DataSourcesPanel />
                </TabsContent>
                <TabsContent value="models" className="mt-0 min-h-0 flex-1 overflow-hidden">
                  <KotlinModelsPanel />
                </TabsContent>
              </Tabs>
            </div>
          </aside>
        </div>
      </div>
      <DragOverlay dropAnimation={null} style={{ zIndex: 2000 }}>
        {activeDrag ? (
          <div className="max-w-56 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-lg">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{catalogLabel}</div>
            <div className="truncate">{activeDrag.label || catalogLabel}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
