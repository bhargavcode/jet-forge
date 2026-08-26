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
import type { BodyMode, HttpMethod } from "@/lib/schema";
import { modelFields } from "@/lib/model";
import { KeyValueEditor } from "./KeyValueEditor";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const BODIES: BodyMode[] = ["none", "json", "form", "multipart"];

export function DataSourcesPanel() {
  const dataSources = useDesigner((s) => s.screen.dataSources);
  const addDataSource = useDesigner((s) => s.addDataSource);
  const patchDataSource = useDesigner((s) => s.patchDataSource);
  const removeDataSource = useDesigner((s) => s.removeDataSource);
  const previewErrors = useDesigner((s) => s.previewErrors);
  const previewData = useDesigner((s) => s.previewData);
  const [activeId, setActiveId] = useState<string | null>(null);
  const selectedId =
    activeId && dataSources.some((source) => source.id === activeId)
      ? activeId
      : (dataSources.find((source) => source.id === "news")?.id ?? dataSources[0]?.id);
  const source = dataSources.find((item) => item.id === selectedId);
  const bodyMode = source?.bodyMode ?? (source?.body ? "json" : "none");
  const responseFields = source
    ? modelFields(
        source.id in previewData ? { [source.id]: previewData[source.id] } : {},
        48,
      )
    : [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Request
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
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-3">
          {dataSources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Configure the request this screen will fire: method, headers, query, JSON or form body. Bindings like
              {" "}
              <code>{"{{forms.search.query}}"}</code> work in any value. Native Android/iOS runtimes call the same request — not a WebView.
            </p>
          ) : null}
          {source ? (
            <div className="space-y-3">
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
                    if (METHODS.includes(method as HttpMethod)) {
                      patchDataSource(source.id, { method: method as HttpMethod });
                    }
                  }}
                >
                  <SelectTrigger className="w-[104px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={source.url}
                  onChange={(e) => patchDataSource(source.id, { url: e.target.value })}
                  placeholder="https://api.example.com/items"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Headers</Label>
                <KeyValueEditor
                  rows={source.headerRows ?? []}
                  onChange={(headerRows) => patchDataSource(source.id, { headerRows })}
                  keyPlaceholder="Authorization"
                  valuePlaceholder="Bearer {{route.token}}"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Query</Label>
                <KeyValueEditor
                  rows={source.queryRows ?? []}
                  onChange={(queryRows) => patchDataSource(source.id, { queryRows })}
                  keyPlaceholder="q"
                  valuePlaceholder="{{forms.search.query}}"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Body</Label>
                <Select
                  value={bodyMode}
                  onValueChange={(value) => value && patchDataSource(source.id, { bodyMode: value as BodyMode })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BODIES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode === "json" ? "JSON" : mode === "form" ? "Form URL-encoded" : mode === "multipart" ? "Multipart form" : "None"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {bodyMode === "json" ? (
                <Textarea
                  value={source.body ?? ""}
                  onChange={(e) => patchDataSource(source.id, { body: e.target.value })}
                  placeholder='{"page":1,"q":"{{forms.search.query}}"}'
                  rows={4}
                  className="font-mono text-xs"
                />
              ) : null}
              {bodyMode === "form" || bodyMode === "multipart" ? (
                <KeyValueEditor
                  rows={source.formRows ?? []}
                  onChange={(formRows) => patchDataSource(source.id, { formRows })}
                  keyPlaceholder="field"
                  valuePlaceholder="{{forms.search.query}}"
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
              <div className="space-y-1">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Response model
                </Label>
                {responseFields.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Run Live API (or fill mock JSON) to see response keys you can bind in the Inspector.
                  </p>
                ) : (
                  <div className="max-h-40 space-y-0.5 overflow-auto rounded-md border p-1.5 font-mono text-[11px]">
                    {responseFields.map((field) => (
                      <div key={field.path} className="flex items-center gap-2">
                        <span className="w-12 shrink-0 text-[9px] uppercase text-muted-foreground">{field.kind}</span>
                        <span className="min-w-0 flex-1 truncate">{field.path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
