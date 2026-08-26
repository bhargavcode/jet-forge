"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AssetRef } from "@/lib/schema";
import { useDesigner } from "@/lib/store";
import { toast } from "sonner";

export function AssetUpload({
  kind,
  currentUrl,
  onPicked,
}: {
  kind: "image" | "icon";
  currentUrl?: string;
  onPicked: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addAsset = useDesigner((s) => s.addAsset);
  const assets = useDesigner((s) => s.screen.assets) ?? [];
  const [uploading, setUploading] = useState(false);
  const matching = assets.filter((asset) => asset.kind === kind || kind === "image");

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const res = await fetch("/api/assets", { method: "POST", body });
      if (!res.ok) throw new Error(await res.text());
      const asset = (await res.json()) as AssetRef;
      addAsset(asset);
      onPicked(asset.url);
      toast.success("Uploaded from this device");
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Could not store the file.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className="h-16 w-full rounded-md object-cover bg-muted" />
      ) : (
        <div className="flex h-16 items-center justify-center rounded-md border border-dashed text-[11px] text-muted-foreground">
          Placeholder — bind an API path to replace this at runtime
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "Uploading…" : "Upload from device"}
      </Button>
      {matching.length ? (
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Library</Label>
          <div className="flex flex-wrap gap-1">
            {matching.slice(0, 12).map((asset) => (
              <button
                key={asset.id}
                type="button"
                title={asset.name}
                onClick={() => onPicked(asset.url)}
                className="size-10 overflow-hidden rounded border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.name} className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
