"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDesigner } from "@/lib/store";
import { inferKotlinModel, parseKotlinDataClass } from "@/lib/kotlin-model";
import { toast } from "sonner";

export function KotlinModelsPanel() {
  const models = useDesigner((s) => s.screen.dataModels ?? []);
  const activeModelId = useDesigner((s) => s.screen.activeModelId);
  const previewData = useDesigner((s) => s.previewData);
  const dataSources = useDesigner((s) => s.screen.dataSources);
  const addDataModel = useDesigner((s) => s.addDataModel);
  const patchDataModel = useDesigner((s) => s.patchDataModel);
  const removeDataModel = useDesigner((s) => s.removeDataModel);
  const setActiveModelId = useDesigner((s) => s.setActiveModelId);
  const active = models.find((item) => item.id === activeModelId) ?? models[0];

  return (
    <div className="space-y-3 border-t p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Kotlin data models
        </span>
        <Button size="sm" variant="outline" onClick={() => addDataModel()}>
          <Plus className="size-3.5" />
          Model
        </Button>
      </div>
      {models.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Add a <code>data class</code> so Bind can map Compose properties onto typed fields like{" "}
          <code>item.title</code>.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {models.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveModelId(item.id)}
              className={
                item.id === active?.id
                  ? "rounded-full bg-primary px-2 py-0.5 font-mono text-[11px] text-primary-foreground"
                  : "rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]"
              }
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
      {active ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Input
              value={active.name}
              onChange={(e) => patchDataModel(active.id, { name: e.target.value })}
              className="h-7"
            />
            <Button size="icon-sm" variant="ghost" onClick={() => removeDataModel(active.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <Select
            value={active.sourceId ?? ""}
            onValueChange={(value) => value && patchDataModel(active.id, { sourceId: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="API source" />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-7 font-mono text-xs"
            placeholder="List path: news.articles"
            value={active.listPath ?? ""}
            onChange={(e) => patchDataModel(active.id, { listPath: e.target.value })}
          />
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Kotlin</Label>
          <Textarea
            className="min-h-28 font-mono text-[11px]"
            value={active.kotlin}
            onChange={(e) => {
              const kotlin = e.target.value;
              const parsed = parseKotlinDataClass(kotlin);
              patchDataModel(active.id, {
                kotlin,
                name: parsed?.name ?? active.name,
                fields: parsed?.fields ?? active.fields,
              });
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const sourceId = active.sourceId ?? dataSources[0]?.id;
              const payload = sourceId ? previewData[sourceId] : Object.values(previewData)[0];
              if (payload == null) {
                toast.message("Run Live API first, then infer a data class from the response.");
                return;
              }
              const inferred = inferKotlinModel(active.name || "Article", payload, {
                sourceId,
                listPath: active.listPath,
              });
              patchDataModel(active.id, inferred);
              toast.success(`Inferred ${inferred.name} from the response.`);
            }}
          >
            Infer from API response
          </Button>
        </div>
      ) : null}
    </div>
  );
}
