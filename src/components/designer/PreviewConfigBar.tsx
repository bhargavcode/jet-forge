"use client";

import { useDesigner } from "@/lib/store";
import {
  PREVIEW_DEVICES,
  PREVIEW_FONT_SCALES,
  previewDevice,
} from "@/lib/preview-config";
import type { PreviewUiMode } from "@/lib/preview-config";
import { cn } from "@/lib/utils";

export function PreviewConfigBar({ className }: { className?: string }) {
  const previewConfig = useDesigner((s) => s.previewConfig);
  const setPreviewConfig = useDesigner((s) => s.setPreviewConfig);
  const themeMode = useDesigner((s) => s.screen.theme.mode);
  const device = previewDevice(previewConfig.device);

  return (
    <div
      className={cn(
        "flex max-w-full flex-wrap items-center gap-2 rounded-lg border bg-background/95 px-2 py-1.5 text-[11px] shadow-sm backdrop-blur",
        className,
      )}
      title="Preview configuration — like Android Studio @Preview parameters"
    >
      <span className="hidden font-medium text-muted-foreground sm:inline">Preview</span>

      <label className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Device</span>
        <select
          className="h-7 max-w-[9rem] rounded-md border bg-background px-1.5"
          value={previewConfig.device}
          onChange={(e) =>
            setPreviewConfig({ device: e.target.value as typeof previewConfig.device })
          }
        >
          {PREVIEW_DEVICES.map((item) => (
            <option key={item.id} value={item.id} title={item.hint}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Font</span>
        <select
          className="h-7 rounded-md border bg-background px-1.5"
          value={String(previewConfig.fontScale)}
          onChange={(e) => setPreviewConfig({ fontScale: Number(e.target.value) })}
        >
          {PREVIEW_FONT_SCALES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="text-muted-foreground">UI</span>
        <select
          className="h-7 rounded-md border bg-background px-1.5"
          value={previewConfig.uiMode}
          onChange={(e) => setPreviewConfig({ uiMode: e.target.value as PreviewUiMode })}
        >
          <option value="follow">Follow theme ({themeMode})</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>

      <label className="flex cursor-pointer items-center gap-1.5">
        <input
          type="checkbox"
          className="size-3.5 rounded border"
          checked={previewConfig.rtl}
          onChange={(e) => setPreviewConfig({ rtl: e.target.checked })}
        />
        <span className="text-muted-foreground">RTL</span>
      </label>

      <span className="ml-auto hidden font-mono text-[10px] text-muted-foreground md:inline">
        {device.width}×{device.height} · {Math.round(previewConfig.fontScale * 100)}% text
      </span>
    </div>
  );
}

export function usePreviewDeviceSize(fixedDevice?: boolean) {
  const previewConfig = useDesigner((s) => s.previewConfig);
  if (fixedDevice) return previewDevice("phone");
  return previewDevice(previewConfig.device);
}
