"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UiNode } from "@/lib/schema";
import { useDesigner } from "@/lib/store";
import { cn } from "@/lib/utils";

function LayerRow({ node, depth }: { node: UiNode; depth: number }) {
  const selectedId = useDesigner((s) => s.selectedId);
  const select = useDesigner((s) => s.select);
  const selected = selectedId === node.id;

  return (
    <>
      <button
        type="button"
        onClick={() => select(node.id)}
        className={cn(
          "flex w-full items-center rounded-md px-2 py-1 text-left text-xs hover:bg-muted",
          selected && "bg-primary/10 text-primary",
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <span className="truncate font-medium">{node.type}</span>
        {node.slot ? (
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            {node.slot}
          </span>
        ) : null}
      </button>
      {node.children?.map((child) => (
        <LayerRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function Layers() {
  const root = useDesigner((s) => s.screen.root);
  const moveSelected = useDesigner((s) => s.moveSelected);
  const deleteSelected = useDesigner((s) => s.deleteSelected);

  return (
    <div className="flex h-full flex-col">
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
          <Button size="icon-sm" variant="ghost" onClick={deleteSelected} aria-label="Delete">
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
