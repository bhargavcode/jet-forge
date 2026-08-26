"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDesigner } from "@/lib/store";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function DataSourcesPanel() {
  const dataSources = useDesigner((s) => s.screen.dataSources);
  const addDataSource = useDesigner((s) => s.addDataSource);
  const patchDataSource = useDesigner((s) => s.patchDataSource);
  const removeDataSource = useDesigner((s) => s.removeDataSource);
  const previewErrors = useDesigner((s) => s.previewErrors);
  const [activeId, setActiveId] = useState<string | null>(null);
  const selectedId =
    activeId && dataSources.some((source) => source.id === activeId)
      ? activeId
      : (dataSources.find((source) => source.id === "news")?.id ?? dataSources[0]?.id);
  const source = dataSources.find((item) => item.id === selectedId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Data sources
        </span>
        <Button size="sm" variant="outline" onClick={addDataSource}>
          <Plus className="size-3.5" />
          API
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
        {dataSources.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No APIs yet.</p>
        ) : (
          <p className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground">Edit</p>
        )}
        {dataSources.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[11px]",
              item.id === selectedId ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {item.id}
          </button>
        ))}
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {dataSources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add a REST endpoint. The Android runtime will call the same URL when this screen is published.
            </p>
          ) : null}
          {source ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="font-mono text-xs">{source.id}</Label>
                <Button size="icon-sm" variant="ghost" onClick={() => removeDataSource(source.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <Input
                value={source.name}
                onChange={(e) => patchDataSource(source.id, { name: e.target.value })}
                placeholder="Display name"
              />
              <div className="flex gap-2">
                <Select
                  value={source.method}
                  onValueChange={(method) => {
                    if (method === "GET" || method === "POST") {
                      patchDataSource(source.id, { method });
                    }
                  }}
                >
                  <SelectTrigger className="w-[96px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={source.url}
                  onChange={(e) => patchDataSource(source.id, { url: e.target.value })}
                  placeholder="https://api.example.com/items"
                />
              </div>
              {source.method === "POST" ? (
                <Textarea
                  value={source.body ?? ""}
                  onChange={(e) => patchDataSource(source.id, { body: e.target.value })}
                  placeholder='{"page":1}'
                  rows={3}
                />
              ) : null}
              <label className="flex items-center justify-between gap-2 text-xs">
                Fall back to mock on error
                <Switch
                  checked={Boolean(source.fallbackToMock)}
                  onCheckedChange={(checked) =>
                    patchDataSource(source.id, { fallbackToMock: Boolean(checked) })
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs">
                Simulate API failure
                <Switch
                  checked={Boolean(source.simulateFailure)}
                  onCheckedChange={(checked) =>
                    patchDataSource(source.id, { simulateFailure: Boolean(checked) })
                  }
                />
              </label>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Mock fallback (JSON)
              </Label>
              <Textarea
                value={JSON.stringify(source.mock ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    patchDataSource(source.id, { mock: JSON.parse(e.target.value) });
                  } catch {
                    /* keep typing */
                  }
                }}
                rows={5}
                className="font-mono text-xs"
              />
              {previewErrors[source.id] ? (
                <p className="text-xs text-destructive">
                  Live fetch failed ({previewErrors[source.id]}). Canvas error state will show in Play unless mock fallback is on.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
