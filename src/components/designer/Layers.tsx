"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UiNode } from "@/lib/schema";
import { currentRoot } from "@/lib/document";
import { interactionsOf } from "@/lib/interactions";
import { useDesigner } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function layerBadge(node: UiNode) {
  if (node.visibleWhen && node.visibleWhen !== "always") return node.visibleWhen;
  const gesture = interactionsOf(node).find((item) => item.action.type !== "none");
  if (gesture) return `${gesture.event} ${gesture.action.type}`;
  return node.slot;
}

function LayerRow({ node, depth }: { node: UiNode; depth: number }) {
  const selectedId = useDesigner((s) => s.selectedId);
  const select = useDesigner((s) => s.select);
  const selected = selectedId === node.id;
  const drag = useDraggable({
    id: `layer-${node.id}`,
    data: { source: "canvas", nodeId: node.id, type: node.type },
    disabled: node.type === "Scaffold",
  });
  const drop = useDroppable({
    id: `layer-drop-${node.id}`,
    data: { kind: "reorder", targetId: node.id, nodeId: node.id },
  });

  return (
    <>
      <button
        type="button"
        ref={(el) => {
          drag.setNodeRef(el);
          drop.setNodeRef(el);
        }}
        {...drag.listeners}
        {...drag.attributes}
        onClick={() => select(node.id)}
        className={cn(
          "flex w-full items-center rounded-md px-2 py-1 text-left text-xs hover:bg-muted",
          selected && "bg-primary/10 text-primary",
          drop.isOver && "m3-drop-over",
          drag.isDragging && "opacity-40",
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <span className="truncate font-medium">{node.type}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
          {layerBadge(node)}
        </span>
      </button>
      {node.children?.map((child) => (
        <LayerRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function Layers() {
  const screen = useDesigner((s) => s.screen);
  const currentScreenId = useDesigner((s) => s.currentScreenId);
  const setCurrentScreen = useDesigner((s) => s.setCurrentScreen);
  const addScreen = useDesigner((s) => s.addScreen);
  const patchCurrentScreen = useDesigner((s) => s.patchCurrentScreen);
  const moveSelected = useDesigner((s) => s.moveSelected);
  const deleteSelected = useDesigner((s) => s.deleteSelected);
  const deleteCurrentScreen = useDesigner((s) => s.deleteCurrentScreen);
  const root = currentRoot(screen, currentScreenId);
  const active = screen.screens.find((item) => item.id === currentScreenId);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Screens
          </span>
          <div className="flex gap-1">
            <Button size="icon-sm" variant="ghost" onClick={addScreen} aria-label="Add screen">
              <Plus className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Remove screen"
              onClick={() => {
                const message = deleteCurrentScreen();
                if (message) toast.message(message);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {screen.screens.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentScreen(item.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                item.id === currentScreenId ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
        {active ? (
          <>
            <Input
              value={active.route}
              onChange={(e) => patchCurrentScreen({ route: e.target.value })}
              className="h-7 font-mono text-xs"
            />
            <Input
              value={(active.dataSourceIds ?? []).join(",")}
              onChange={(e) =>
                patchCurrentScreen({
                  dataSourceIds: e.target.value
                    .split(",")
                    .map((part) => part.trim())
                    .filter(Boolean),
                })
              }
              placeholder="data sources: news,search"
              className="h-7 font-mono text-xs"
            />
            <Input
              value={active.emptyPath ?? ""}
              onChange={(e) => patchCurrentScreen({ emptyPath: e.target.value })}
              placeholder="empty path: news.articles"
              className="h-7 font-mono text-xs"
            />
          </>
        ) : null}
      </div>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Layers
        </span>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" onClick={() => moveSelected(-1)} aria-label="Move up">
            <ChevronUp className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => moveSelected(1)} aria-label="Move down">
            <ChevronDown className="size-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              const message = deleteSelected();
              if (message) toast.message(message);
            }}
            aria-label="Delete widget"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <LayerRow node={root} depth={0} />
        </div>
      </ScrollArea>
    </div>
  );
}
