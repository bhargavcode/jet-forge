"use client";

import type { CSSProperties } from "react";
import { ComposeNode } from "@/components/preview/ComposePreview";
import type { BindingScope } from "@/lib/bindings";
import { getScheme, schemeToCssVars } from "@/lib/theme";
import type { ScreenDocument } from "@/lib/schema";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  screen,
  scope,
  selectedId,
  onSelect,
  interactive,
  className,
}: {
  screen: ScreenDocument;
  scope: BindingScope;
  selectedId: string | null;
  onSelect?: (id: string) => void;
  interactive: boolean;
  className?: string;
}) {
  const scheme = getScheme(screen.theme.seed, screen.theme.mode);
  const vars = schemeToCssVars(scheme);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="phone-chassis"
        style={vars as CSSProperties}
        data-theme={screen.theme.mode}
      >
        <div className="phone-notch" />
        <div className="phone-status">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-[2px] border border-current opacity-80" />
          </span>
        </div>
        <div className="phone-screen font-[family-name:var(--font-roboto)]">
          <ComposeNode
            node={screen.root}
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
