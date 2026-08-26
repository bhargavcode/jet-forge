"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KeyValue } from "@/lib/schema";

export function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value or {{binding}}",
}: {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      {rows.map((row, index) => (
        <div key={`${index}-${row.key}`} className="flex gap-1">
          <Input
            value={row.key}
            placeholder={keyPlaceholder}
            className="h-8 font-mono text-xs"
            onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, key: e.target.value };
              onChange(next);
            }}
          />
          <Input
            value={row.value}
            placeholder={valuePlaceholder}
            className="h-8 font-mono text-xs"
            onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, value: e.target.value };
              onChange(next);
            }}
          />
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...rows, { key: "", value: "" }])}>
        <Plus className="size-3.5" />
        Pair
      </Button>
    </div>
  );
}
