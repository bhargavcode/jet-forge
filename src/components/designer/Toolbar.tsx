"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HelpCircle, Moon, Play, RotateCcw, Square, Sun, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SEED_OPTIONS } from "@/lib/theme";
import { useDesigner } from "@/lib/store";
import type { CanvasState } from "@/lib/schema";
import { cn } from "@/lib/utils";

export function Toolbar() {
  const screen = useDesigner((s) => s.screen);
  const setName = useDesigner((s) => s.setName);
  const setTheme = useDesigner((s) => s.setTheme);
  const liveData = useDesigner((s) => s.liveData);
  const setLiveData = useDesigner((s) => s.setLiveData);
  const loadPreview = useDesigner((s) => s.loadPreview);
  const reset = useDesigner((s) => s.reset);
  const playMode = useDesigner((s) => s.playMode);
  const setPlayMode = useDesigner((s) => s.setPlayMode);
  const canvasState = useDesigner((s) => s.canvasState);
  const setCanvasState = useDesigner((s) => s.setCanvasState);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    if (liveData) {
      void loadPreview();
    }
  }, [liveData, loadPreview, screen.dataSources]);

  async function publish() {
    setPublishing(true);
    try {
      const res = await fetch("/api/screens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(screen),
      });
      if (!res.ok) throw new Error(await res.text());
      const payload = (await res.json()) as { id: string; devicePath: string };
      setPublishedId(payload.id);
      toast.success("Screen published", {
        description: "Android can now fetch this document and bind the same APIs.",
      });
    } catch (error) {
      toast.error("Publish failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur">
      <div className="mr-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
          CS
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Compose Studio</div>
          <div className="text-[11px] text-muted-foreground">Material 3 · Jetpack runtime</div>
        </div>
      </div>
      <Input
        value={screen.name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 w-[180px]"
      />
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {SEED_OPTIONS.map((seed) => (
          <button
            key={seed.id}
            type="button"
            title={seed.label}
            onClick={() => setTheme({ ...screen.theme, seed: seed.id })}
            className={cn(
              "size-5 rounded-full border",
              screen.theme.seed === seed.id && "ring-2 ring-ring ring-offset-2",
            )}
            style={{ background: seed.swatch }}
          />
        ))}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setTheme({ ...screen.theme, mode: screen.theme.mode === "light" ? "dark" : "light" })}
      >
        {screen.theme.mode === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
        {screen.theme.mode}
      </Button>
      <label className="ml-auto flex items-center gap-2 text-sm">
        <Switch checked={liveData} onCheckedChange={setLiveData} />
        Live API
      </label>
      <select
        className="h-8 rounded-lg border bg-background px-2 text-xs"
        value={canvasState}
        disabled={playMode}
        onChange={(e) => setCanvasState(e.target.value as CanvasState)}
      >
        <option value="auto">Canvas: ready</option>
        <option value="loading">Canvas: loading</option>
        <option value="error">Canvas: error</option>
        <option value="empty">Canvas: empty</option>
        <option value="invalid">Canvas: invalid</option>
      </select>
      <Button size="sm" variant={playMode ? "default" : "outline"} onClick={() => setPlayMode(!playMode)}>
        {playMode ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
        {playMode ? "Stop" : "Play"}
      </Button>
      <Button size="sm" variant="ghost" onClick={reset}>
        <RotateCcw className="size-3.5" />
        US sample
      </Button>
      <Link href="/screens" className="text-xs font-medium text-muted-foreground hover:text-foreground">
        Published
      </Link>
      <HowItWorks />
      <Button size="sm" onClick={() => void publish()} disabled={publishing}>
        <Upload className="size-3.5" />
        {publishing ? "Publishing…" : "Publish"}
      </Button>
      {publishedId ? (
        <Link
          href={`/device/${publishedId}`}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Open device runtime
        </Link>
      ) : null}
    </header>
  );
}

function HowItWorks() {
  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <HelpCircle className="size-3.5" />
        Plan
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Design → publish → Android</DialogTitle>
          <DialogDescription>
            One JSON document drives the designer preview and the Jetpack Compose runtime.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm leading-6">
          <li>
            <strong>1. Design.</strong> Drag Material 3 components onto the phone. Scaffold maps to
            topBar, content, bottomBar, and FAB — the same slots Compose uses.
          </li>
          <li>
            <strong>2. Bind and validate.</strong> REST sources, form rules, and{" "}
            <code>visibleWhen</code> (loading / error / empty / invalid) are designed on the same canvas.
          </li>
          <li>
            <strong>3. Actions.</strong> Clicks navigate to another screen, submit a form, retry a failed
            API, or open a URL. Press Play to run those routes on the phone.
          </li>
          <li>
            <strong>4. Publish.</strong> Android fetches the document, calls the same US news APIs, and
            executes the same actions.
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
