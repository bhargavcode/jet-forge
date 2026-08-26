"use client";

import { useDraggable } from "@dnd-kit/core";
import { CATALOG, type CatalogItem } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NodeType } from "@/lib/schema";

function PaletteItem({ item, onAdd }: { item: CatalogItem; onAdd?: (type: NodeType) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: "palette", type: item.type },
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-transparent bg-muted/40 px-2 py-1.5 text-left text-sm hover:border-border hover:bg-muted",
        isDragging && "opacity-40",
      )}
      onClick={() => onAdd?.(item.type)}
    >
      <GripVertical className="size-3.5 text-muted-foreground" />
      <span className="flex-1 truncate font-medium">{item.label}</span>
    </button>
  );
}

const GROUPS: CatalogItem["group"][] = ["Layout", "Chrome", "Actions", "Input", "Display"];

export function Palette({ onAdd }: { onAdd?: (type: NodeType) => void }) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        {GROUPS.map((group) => (
          <div key={group}>
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {group}
            </div>
            <div className="space-y-1">
              {CATALOG.filter((item) => item.group === group).map((item) => (
                <PaletteItem key={item.type} item={item} onAdd={onAdd} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
