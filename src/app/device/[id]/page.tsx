"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ComposeNode } from "@/components/preview/ComposePreview";
import { fetchSources, type BindingScope } from "@/lib/bindings";
import type { ScreenDocument } from "@/lib/schema";
import { getScheme, schemeToCssVars } from "@/lib/theme";

export default function DevicePage() {
  const params = useParams<{ id: string }>();
  const [screen, setScreen] = useState<ScreenDocument | null>(null);
  const [data, setData] = useState<BindingScope>({});
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
        const document = (await res.json()) as ScreenDocument;
        if (cancelled) return;
        setScreen(document);
        const { data: bound } = await fetchSources(document.dataSources);
        if (!cancelled) setData(bound);
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
    if (!screen) return {};
    return schemeToCssVars(getScheme(screen.theme.seed, screen.theme.mode));
  }, [screen]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#141218] text-sm text-[#CAC4D0]">
        Fetching published screen…
      </div>
    );
  }

  if (error || !screen) {
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

  const scheme = getScheme(screen.theme.seed, screen.theme.mode);

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
          <ComposeNode node={screen.root} scope={data} selectedId={null} interactive={false} />
        </div>
      </div>
    </div>
  );
}
