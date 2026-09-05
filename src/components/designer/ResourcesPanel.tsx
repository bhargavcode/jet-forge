"use client";

import { ImageIcon, Palette, SunMoon } from "lucide-react";
import { SEED_OPTIONS, getScheme } from "@/lib/theme";
import { COLOR_TOKEN_LABELS } from "@/lib/assets";
import type { ColorToken } from "@/lib/schema";
import { useDesigner } from "@/lib/store";
import { cn } from "@/lib/utils";

const TOKEN_KEYS = Object.keys(COLOR_TOKEN_LABELS) as ColorToken[];

export function ResourcesPanel() {
  const screen = useDesigner((s) => s.screen);
  const setTheme = useDesigner((s) => s.setTheme);
  const assets = screen.assets ?? [];
  const scheme = getScheme(screen.theme.seed, screen.theme.mode);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="size-4 text-primary" />
          Resources
        </div>
        <p className="text-[11px] text-muted-foreground">Theme, color tokens, and uploaded assets</p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <SunMoon className="size-3.5" />
            Theme
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SEED_OPTIONS.map((seed) => (
              <button
                key={seed.id}
                type="button"
                title={seed.label}
                onClick={() => setTheme({ ...screen.theme, seed: seed.id })}
                className={cn(
                  "size-7 rounded-full border-2",
                  screen.theme.seed === seed.id ? "border-primary ring-2 ring-primary/30" : "border-transparent",
                )}
                style={{ background: seed.swatch }}
              />
            ))}
          </div>
          <div className="flex rounded-lg border p-0.5">
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme({ ...screen.theme, mode })}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs capitalize",
                  screen.theme.mode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Color tokens</div>
          <div className="grid grid-cols-2 gap-1.5">
            {TOKEN_KEYS.map((token) => (
              <div
                key={token}
                className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                title={token}
              >
                <span
                  className="size-4 shrink-0 rounded border"
                  style={{
                    background:
                      token in scheme
                        ? String(scheme[token as keyof typeof scheme])
                        : undefined,
                  }}
                />
                <span className="truncate text-[10px] leading-tight">{COLOR_TOKEN_LABELS[token]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ImageIcon className="size-3.5" />
            Assets ({assets.length})
          </div>
          {assets.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-4 text-center text-[11px] text-muted-foreground">
              Upload images from the Inspector on Image or Icon nodes.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {assets.map((asset) => (
                <div key={asset.id} className="overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.name} className="aspect-square w-full object-cover bg-muted" />
                  <div className="truncate px-1.5 py-1 text-[10px]" title={asset.url}>
                    {asset.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
