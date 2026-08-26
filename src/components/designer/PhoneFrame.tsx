"use client";

import type { CSSProperties } from "react";
import { ComposeNode } from "@/components/preview/ComposePreview";
import { useRuntimeScope } from "@/components/runtime/RuntimeHost";
import { currentRoot } from "@/lib/document";
import { useRuntime } from "@/lib/runtime-context";
import { getScheme, schemeToCssVars } from "@/lib/theme";
import type { ScreenDocument } from "@/lib/schema";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  document,
  selectedId,
  onSelect,
  interactive,
  className,
}: {
  document: ScreenDocument;
  selectedId: string | null;
  onSelect?: (id: string) => void;
  interactive: boolean;
  className?: string;
}) {
  const runtime = useRuntime();
  const scope = useRuntimeScope();
  const root = currentRoot(document, runtime?.screenId);
  const scheme = getScheme(document.theme.seed, document.theme.mode);
  const vars = schemeToCssVars(scheme);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="phone-chassis"
        style={vars as CSSProperties}
        data-theme={document.theme.mode}
      >
        <div className="phone-notch" />
        <div className="phone-status">
          <span>9:41</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] opacity-70">
            {runtime?.enabled ? runtime.uiState : document.screens.find((s) => s.id === runtime?.screenId)?.name}
          </span>
        </div>
        <div className="phone-screen font-[family-name:var(--font-roboto)]">
          <ComposeNode
            node={root}
            scope={scope}
            selectedId={selectedId}
            onSelect={onSelect}
            interactive={interactive}
          />
        </div>
        <div className="phone-gesture" />
      </div>
    </div>
  );
}
