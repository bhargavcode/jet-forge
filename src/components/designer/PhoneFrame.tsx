"use client";

import type { CSSProperties } from "react";
import { ComposeNode } from "@/components/preview/ComposePreview";
import { useRuntimeScope } from "@/components/runtime/RuntimeHost";
import { currentRoot } from "@/lib/document";
import { useRuntime } from "@/lib/runtime-context";
import { resolvePreviewUiMode } from "@/lib/preview-config";
import { getScheme, schemeToCssVars } from "@/lib/theme";
import type { ScreenDocument } from "@/lib/schema";
import { useDesigner } from "@/lib/store";
import { cn } from "@/lib/utils";
import { usePreviewDeviceSize } from "./PreviewConfigBar";

export function PhoneFrame({
  document,
  selectedId,
  onSelect,
  interactive,
  className,
  fixedDevice = false,
}: {
  document: ScreenDocument;
  selectedId: string | null;
  onSelect?: (id: string) => void;
  interactive: boolean;
  className?: string;
  /** Flow-board thumbnails always use the default phone size. */
  fixedDevice?: boolean;
}) {
  const runtime = useRuntime();
  const scope = useRuntimeScope();
  const canvasViewMode = useDesigner((s) => s.canvasViewMode);
  const previewConfig = useDesigner((s) => s.previewConfig);
  const device = usePreviewDeviceSize(fixedDevice);
  const root = currentRoot(document, runtime?.screenId);
  const effectiveMode = fixedDevice
    ? document.theme.mode
    : resolvePreviewUiMode(previewConfig.uiMode, document.theme.mode);
  const scheme = getScheme(document.theme.seed, effectiveMode);
  const vars = schemeToCssVars(scheme);
  const fontScale = fixedDevice ? 1 : previewConfig.fontScale;
  const rtl = fixedDevice ? false : previewConfig.rtl;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="phone-chassis"
        style={
          {
            ...vars,
            width: device.width,
            height: device.height,
          } as CSSProperties
        }
        data-theme={effectiveMode}
        data-preview-device={device.id}
      >
        <div className="phone-notch" />
        <div className="phone-status">
          <span>9:41</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] opacity-70">
            {runtime?.enabled ? runtime.uiState : document.screens.find((s) => s.id === runtime?.screenId)?.name}
            {!fixedDevice && previewConfig.uiMode !== "follow" ? ` · ${effectiveMode}` : null}
          </span>
        </div>
        <div
          className={cn(
            "phone-screen font-[family-name:var(--font-roboto)]",
            canvasViewMode === "blueprint" && "blueprint",
          )}
          dir={rtl ? "rtl" : "ltr"}
          data-preview-rtl={rtl ? "1" : undefined}
          style={
            {
              "--preview-font-scale": fontScale,
            } as CSSProperties
          }
        >
          <div
            className="phone-screen-content h-full min-h-0 w-full overflow-hidden"
            style={{ zoom: fontScale === 1 ? undefined : fontScale }}
          >
            <ComposeNode
              node={root}
              scope={scope}
              selectedId={selectedId}
              onSelect={onSelect}
              interactive={interactive}
            />
          </div>
        </div>
        <div className="phone-gesture" />
      </div>
    </div>
  );
}
