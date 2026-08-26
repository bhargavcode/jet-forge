"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DndContext } from "@dnd-kit/core";
import { ComposeNode } from "@/components/preview/ComposePreview";
import { RuntimeHost, useRuntimeScope } from "@/components/runtime/RuntimeHost";
import { currentRoot, normalizeDocument } from "@/lib/document";
import { useRuntime } from "@/lib/runtime-context";
import type { ScreenDocument } from "@/lib/schema";
import { getScheme, schemeToCssVars } from "@/lib/theme";

export default function DevicePage() {
  const params = useParams<{ id: string }>();
  const [document, setDocument] = useState<ScreenDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/screens/${params.id}`);
        if (!res.ok) throw new Error(res.status === 404 ? "This screen was not published." : "Could not load screen.");
        const payload = normalizeDocument((await res.json()) as ScreenDocument);
        if (!cancelled) setDocument(payload);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load screen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const vars = useMemo(() => {
    if (!document) return {};
    return schemeToCssVars(getScheme(document.theme.seed, document.theme.mode));
  }, [document]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#141218] text-sm text-[#CAC4D0]">
        Fetching published screen…
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-[#141218] px-6 text-center">
        <div className="text-lg text-[#E6E0E9]">Screen unavailable</div>
        <p className="max-w-sm text-sm text-[#CAC4D0]">{error ?? "Unknown error"}</p>
        <Link href="/" className="mt-2 text-sm text-[#D0BCFF] underline-offset-4 hover:underline">
          Back to designer
        </Link>
      </div>
    );
  }

  const scheme = getScheme(document.theme.seed, document.theme.mode);

  return (
    <div className="flex h-dvh flex-col" style={{ background: scheme.surface }}>
      <div
        className="mx-auto flex h-full w-full max-w-[430px] flex-col font-[family-name:var(--font-roboto)] shadow-2xl"
        style={{ ...vars, background: scheme.surface, color: scheme.onSurface } as React.CSSProperties}
      >
        <div
          className="flex h-8 items-center justify-between px-4 text-[12px] font-medium"
          style={{ color: scheme.onSurface }}
        >
          <span>9:41</span>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">Compose runtime</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <DndContext>
            <RuntimeHost key={document.id} document={document} mode="device">
              <DeviceCanvas document={document} />
            </RuntimeHost>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

function DeviceCanvas({ document }: { document: ScreenDocument }) {
  const runtime = useRuntime();
  const scope = useRuntimeScope();
  const root = currentRoot(document, runtime?.screenId);
  return (
    <div className="h-full min-h-0">
      <ComposeNode node={root} scope={scope} selectedId={null} interactive={false} />
    </div>
  );
}
