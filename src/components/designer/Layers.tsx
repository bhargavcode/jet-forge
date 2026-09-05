"use client";

import { useMemo, useState } from "react";
import {
  BringToFront,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  SendToBack,
  Trash2,
} from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UiNode } from "@/lib/schema";
import { currentRoot } from "@/lib/document";
import { interactionsOf } from "@/lib/interactions";
import { arrayPaths } from "@/lib/model";
import { isolateDragListeners } from "@/lib/dnd-bind";
import { useDesigner } from "@/lib/store";
import { isContainer, siblingStackInfo } from "@/lib/tree";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function layerLabel(node: UiNode) {
  const props = node.props ?? {};
  const text =
    (typeof props.text === "string" && props.text) ||
    (typeof props.label === "string" && props.label) ||
    (typeof props.title === "string" && props.title) ||
    (typeof props.headline === "string" && props.headline) ||
    "";
  return text ? String(text).slice(0, 22) : null;
}

function layerBadge(node: UiNode) {
  if (node.slot) return node.slot;
  if (node.visibleWhen && node.visibleWhen !== "always") return node.visibleWhen;
  const gesture = interactionsOf(node).find((item) => item.action.type !== "none");
  if (gesture) return `${gesture.event}`;
  return null;
}

function LayerRow({
  node,
  depth,
  parentType,
  collapsed,
  onToggle,
}: {
  node: UiNode;
  depth: number;
  parentType?: string;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
}) {
  const selectedId = useDesigner((s) => s.selectedId);
  const select = useDesigner((s) => s.select);
  const selected = selectedId === node.id;
  const children = node.children ?? [];
  const container = isContainer(node.type);
  const isCollapsed = collapsed.has(node.id);
  const caption = layerLabel(node);
  const badge = layerBadge(node);

  const drag = useDraggable({
    id: `layer-${node.id}`,
    data: { source: "layers", nodeId: node.id, type: node.type },
    disabled: node.type === "Scaffold",
  });
  const drop = useDroppable({
    id: `layer-drop-${node.id}`,
    data: {
      kind: container ? "container" : "reorder",
      targetId: node.id,
      nodeId: node.id,
    },
  });

  return (
    <>
      <div
        ref={(el) => {
          drag.setNodeRef(el);
          drop.setNodeRef(el);
        }}
        {...(node.type !== "Scaffold" ? isolateDragListeners(drag.listeners) : {})}
        {...(node.type !== "Scaffold" ? drag.attributes : {})}
        onClick={() => select(node.id)}
        className={cn(
          "group/layer relative flex w-full cursor-grab items-center gap-1 rounded-md py-1 pr-2 text-left text-xs hover:bg-muted",
          selected && "bg-primary/10 text-primary",
          drop.isOver && "ring-1 ring-primary/40 bg-primary/5",
          drag.isDragging && "opacity-40",
          node.type === "Scaffold" && "cursor-default",
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
        role="button"
        tabIndex={0}
        title={
          parentType
            ? `${node.type} inside ${parentType}`
            : container
              ? `${node.type} container`
              : node.type
        }
      >
        {depth > 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 top-0 w-px bg-border"
            style={{ left: 6 + (depth - 1) * 14 + 8 }}
          />
        ) : null}
        {container && children.length > 0 ? (
          <button
            type="button"
            className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted-foreground/10"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        ) : (
          <span className="inline-flex size-4 shrink-0 items-center justify-center">
            {node.type !== "Scaffold" ? (
              <GripVertical className="size-3 text-muted-foreground opacity-70" />
            ) : null}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate font-medium">{node.type}</span>
            {container ? (
              <span className="shrink-0 rounded bg-muted px-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {children.length}
              </span>
            ) : null}
          </div>
          <div className="truncate text-[10px] text-muted-foreground">
            {caption ? (
              <span>&ldquo;{caption}&rdquo;</span>
            ) : parentType ? (
              <span>in {parentType}</span>
            ) : (
              <span className="font-mono">{node.id.slice(0, 8)}</span>
            )}
            {badge ? <span className="ml-1 uppercase tracking-wider">· {badge}</span> : null}
          </div>
        </div>
      </div>
      {!isCollapsed
        ? children.map((child) => (
            <LayerRow
              key={child.id}
              node={child}
              depth={depth + 1}
              parentType={node.type}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))
        : null}
    </>
  );
}

export function Layers() {
  const screen = useDesigner((s) => s.screen);
  const currentScreenId = useDesigner((s) => s.currentScreenId);
  const selectedId = useDesigner((s) => s.selectedId);
  const setCurrentScreen = useDesigner((s) => s.setCurrentScreen);
  const addScreen = useDesigner((s) => s.addScreen);
  const duplicateCurrentScreen = useDesigner((s) => s.duplicateCurrentScreen);
  const patchCurrentScreen = useDesigner((s) => s.patchCurrentScreen);
  const moveSelected = useDesigner((s) => s.moveSelected);
  const stackSelected = useDesigner((s) => s.stackSelected);
  const deleteSelected = useDesigner((s) => s.deleteSelected);
  const deleteCurrentScreen = useDesigner((s) => s.deleteCurrentScreen);
  const addDataSource = useDesigner((s) => s.addDataSource);
  const previewData = useDesigner((s) => s.previewData);
  const root = currentRoot(screen, currentScreenId);
  const active = screen.screens.find((item) => item.id === currentScreenId);
  const selectedSources = new Set(active?.dataSourceIds ?? []);
  const stack = useMemo(
    () => (selectedId ? siblingStackInfo(root, selectedId) : null),
    [root, selectedId],
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const pathOptions = [
    ...arrayPaths(previewData),
    ...(screen.dataModels ?? []).map((model) => model.listPath).filter(Boolean),
    active?.emptyPath,
  ].filter((path, index, all): path is string => Boolean(path) && all.indexOf(path) === index);

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runStack(action: "backward" | "forward" | "back" | "front") {
    const message = stackSelected(action);
    if (message) toast.message(message);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 max-h-[52%] flex-col overflow-hidden border-b">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
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
              aria-label="Duplicate screen"
              onClick={() => {
                const message = duplicateCurrentScreen();
                if (message) toast.message(message);
              }}
            >
              <Copy className="size-3.5" />
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
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 px-3 pb-3">
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
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Screen name
                  </Label>
                  <Input
                    value={active.name}
                    onChange={(e) => patchCurrentScreen({ name: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Route
                  </Label>
                  <Input
                    value={active.route}
                    onChange={(e) => patchCurrentScreen({ route: e.target.value })}
                    placeholder="/headlines"
                    className="h-7 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Data sources
                    </Label>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={addDataSource}>
                      <Plus className="size-3" />
                      Add API
                    </Button>
                  </div>
                  {screen.dataSources.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">No APIs yet. Add one to bind this screen.</p>
                  ) : (
                    <div className="space-y-1 rounded-md border p-1.5">
                      {screen.dataSources.map((source) => {
                        const checked = selectedSources.has(source.id);
                        return (
                          <label key={source.id} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = new Set(selectedSources);
                                if (checked) next.delete(source.id);
                                else next.add(source.id);
                                patchCurrentScreen({ dataSourceIds: [...next] });
                              }}
                            />
                            <span className="font-mono">{source.id}</span>
                            <span className="truncate text-muted-foreground">{source.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Empty list path
                  </Label>
                  <Select
                    value={active.emptyPath || "__none__"}
                    onValueChange={(value) =>
                      patchCurrentScreen({
                        emptyPath: !value || value === "__none__" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 font-mono text-xs">
                      <SelectValue placeholder="Choose a list from the API" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {pathOptions.map((path) => (
                        <SelectItem key={path} value={path}>
                          {path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={active.emptyPath ?? ""}
                    onChange={(e) => patchCurrentScreen({ emptyPath: e.target.value || undefined })}
                    placeholder="Or type a new path, e.g. news.articles"
                    className="h-7 font-mono text-xs"
                  />
                </div>
              </>
            ) : null}
          </div>
        </ScrollArea>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-col gap-1 border-b px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Layers
            </span>
            <div className="flex gap-0.5">
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={!stack?.canSendBackward}
                onClick={() => runStack("back")}
                aria-label="Send to back"
                title="Send to back"
              >
                <SendToBack className="size-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={!stack?.canSendBackward}
                onClick={() => moveSelected(-1)}
                aria-label="Send backward"
                title="Send backward"
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={!stack?.canBringForward}
                onClick={() => moveSelected(1)}
                aria-label="Bring forward"
                title="Bring forward"
              >
                <ChevronDown className="size-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={!stack?.canBringForward}
                onClick={() => runStack("front")}
                aria-label="Bring to front"
                title="Bring to front"
              >
                <BringToFront className="size-3.5" />
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
          {stack ? (
            <p className="text-[10px] text-muted-foreground">
              Inside <span className="font-medium text-foreground">{stack.parentType}</span>
              {" · "}
              order {stack.index + 1}/{stack.count}
              {" · "}
              later draws on top
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Nested tree of containers. Drag to reorder or drop onto a container to nest.
            </p>
          )}
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-2">
            <LayerRow node={root} depth={0} collapsed={collapsed} onToggle={toggleCollapsed} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
