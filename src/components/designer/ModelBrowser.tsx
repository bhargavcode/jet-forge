"use client";

import { useState } from "react";
import { bindableComposeProps, itemAlias, modelFields, suggestFields, type ModelField } from "@/lib/model";
import type { NodeType } from "@/lib/schema";
import { cn } from "@/lib/utils";

export function ModelBrowser({
  data,
  nodeType,
  bindings,
  itemBinding,
  onPick,
}: {
  data: Record<string, unknown>;
  nodeType: NodeType;
  bindings?: Record<string, string>;
  itemBinding?: string;
  onPick: (path: string, composeKey: string) => void;
}) {
  const compose = bindableComposeProps(nodeType);
  const [picked, setPicked] = useState<string | null>(null);
  const fields = modelFields(data);
  const suggested = suggestFields(nodeType, fields);
  const selectedKey = compose.some((item) => item.key === picked) ? (picked as string) : (compose[0]?.key ?? "text");
  const selected = compose.find((item) => item.key === selectedKey) ?? compose[0];

  function boundFor(key: string) {
    if (key === "itemBinding") return itemBinding ?? "";
    return bindings?.[key] ?? "";
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          Jetpack Compose properties
        </div>
        <p className="mb-2 text-[11px] leading-4 text-muted-foreground">
          Select a Compose target, then click a network field to bind it.
        </p>
        <div className="flex flex-col gap-1">
          {compose.map((item) => {
            const bound = boundFor(item.key);
            const active = selected?.key === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setPicked(item.key)}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2 py-1.5 text-left",
                  active ? "border-primary bg-primary/10" : "hover:bg-muted",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[11px]">{item.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{item.compose}</span>
                </span>
                <span className="max-w-[46%] truncate font-mono text-[10px] text-muted-foreground">
                  {bound || "unbound"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No API payload yet. Turn on Live API or add mock JSON on the Request panel — response fields appear here next to
          Compose properties.
        </p>
      ) : (
        <>
          {suggested.length ? (
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                Suggested for {selected?.compose ?? nodeType}
              </div>
              <div className="flex flex-col gap-1">
                {suggested.map((field) => (
                  <FieldButton
                    key={`s-${field.path}`}
                    field={field}
                    composeKey={selected?.key ?? "text"}
                    onPick={onPick}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Network model</div>
            <div className="max-h-48 space-y-0.5 overflow-auto rounded-md border p-1">
              {fields.slice(0, 80).map((field) => (
                <FieldButton
                  key={field.path}
                  field={field}
                  composeKey={selected?.key ?? "text"}
                  onPick={onPick}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FieldButton({
  field,
  composeKey,
  onPick,
}: {
  field: ModelField;
  composeKey: string;
  onPick: (path: string, composeKey: string) => void;
}) {
  const path = field.path.includes(".0.") ? itemAlias(field.path) : field.path;
  return (
    <button
      type="button"
      onClick={() => onPick(path, composeKey)}
      className={cn(
        "flex w-full items-center gap-2 rounded px-1.5 py-1 text-left hover:bg-muted",
        field.kind === "array" && "text-primary",
      )}
    >
      <span className="w-12 shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">{field.kind}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{path}</span>
      <span className="max-w-[90px] truncate text-[10px] text-muted-foreground">{field.sample}</span>
    </button>
  );
}
