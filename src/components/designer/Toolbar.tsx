"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, HelpCircle, LayoutGrid, Magnet, Moon, Play, Redo2, RotateCcw, Square, Sun, Undo2, Upload } from "lucide-react";
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
import { documentFingerprint, useDesigner } from "@/lib/store";
import type { CanvasState, CanvasViewMode, WorkspaceMode } from "@/lib/schema";
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
  const workspaceMode = useDesigner((s) => s.workspaceMode);
  const setWorkspaceMode = useDesigner((s) => s.setWorkspaceMode);
  const canvasViewMode = useDesigner((s) => s.canvasViewMode);
  const setCanvasViewMode = useDesigner((s) => s.setCanvasViewMode);
  const snapEnabled = useDesigner((s) => s.snapEnabled);
  const setSnapEnabled = useDesigner((s) => s.setSnapEnabled);
  const undo = useDesigner((s) => s.undo);
  const redo = useDesigner((s) => s.redo);
  const canUndo = useDesigner((s) => s.past.length > 0);
  const canRedo = useDesigner((s) => s.future.length > 0);
  const canvasZoom = useDesigner((s) => s.canvasZoom);
  const setCanvasZoom = useDesigner((s) => s.setCanvasZoom);
  const publishedId = useDesigner((s) => s.publishedId);
  const publishedFingerprint = useDesigner((s) => s.publishedFingerprint);
  const markPublished = useDesigner((s) => s.markPublished);
  const [publishing, setPublishing] = useState(false);
  const dirty = documentFingerprint(screen) !== publishedFingerprint;

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
      markPublished(payload.id);
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
      <div className="flex rounded-lg border p-0.5">
        <Button size="icon-sm" variant="ghost" disabled={!canUndo} title="Undo (Ctrl+Z)" onClick={undo}>
          <Undo2 className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" onClick={redo}>
          <Redo2 className="size-3.5" />
        </Button>
      </div>
      <div className="flex items-center rounded-lg border p-0.5">
        <Button size="icon-sm" variant="ghost" title="Zoom out" onClick={() => setCanvasZoom(canvasZoom - 0.1)}>
          <Minus className="size-3.5" />
        </Button>
        <button type="button" className="min-w-10 px-1 text-[11px]" onClick={() => setCanvasZoom(1)}>
          {Math.round(canvasZoom * 100)}%
        </button>
        <Button size="icon-sm" variant="ghost" title="Zoom in" onClick={() => setCanvasZoom(canvasZoom + 0.1)}>
          <Plus className="size-3.5" />
        </Button>
      </div>
      <div className="ml-auto flex rounded-lg border p-0.5">
        {(["design", "prototype"] as WorkspaceMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setWorkspaceMode(mode)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium capitalize",
              workspaceMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {mode === "design" ? "Design" : "Prototype"}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={liveData} onCheckedChange={setLiveData} />
        Live API
      </label>
      {workspaceMode === "design" ? (
        <>
          <div className="flex rounded-lg border p-0.5">
            {(["preview", "blueprint"] as CanvasViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={playMode}
                title={mode === "blueprint" ? "Blueprint wireframe" : "Rendered preview"}
                onClick={() => setCanvasViewMode(mode)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium capitalize",
                  canvasViewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {mode === "blueprint" ? <LayoutGrid className="size-3" /> : null}
                {mode}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant={snapEnabled ? "default" : "outline"}
            disabled={playMode}
            title="Snap to sibling edges while resizing or moving"
            onClick={() => setSnapEnabled(!snapEnabled)}
          >
            <Magnet className="size-3.5" />
            Snap
          </Button>
          <select
          className="h-8 rounded-lg border bg-background px-2 text-xs"
          value={canvasState}
          disabled={playMode}
          onChange={(e) => setCanvasState(e.target.value as CanvasState)}
          title="Force a canvas UI state while designing"
        >
          <option value="auto">Canvas: ready</option>
          <option value="loading">Canvas: loading</option>
          <option value="error">Canvas: error</option>
          <option value="empty">Canvas: empty</option>
          <option value="invalid">Canvas: invalid</option>
        </select>
        </>
      ) : null}
      <Button
        size="sm"
        variant={playMode ? "default" : "outline"}
        title="Run the designed screens on the phone"
        onClick={() => setPlayMode(!playMode)}
      >
        {playMode ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
        {playMode ? "Stop" : "Play phone"}
      </Button>
      <Button size="sm" variant="ghost" onClick={reset}>
        <RotateCcw className="size-3.5" />
        US sample
      </Button>
      <Link href="/screens" className="text-xs font-medium text-muted-foreground hover:text-foreground">
        Library
      </Link>
      <HowItWorks />
      <Button size="sm" onClick={() => void publish()} disabled={publishing || !dirty}>
        <Upload className="size-3.5" />
        {publishing ? "Publishing…" : dirty ? "Publish" : "Published"}
      </Button>
      {publishedId ? (
        <Link
          href={`/device/${publishedId}`}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {dirty ? "Open last publish" : "Open device runtime"}
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
          <DialogTitle>Design → prototype → native devices</DialogTitle>
          <DialogDescription>
            One JSON document drives the designer, the web phone, and native Compose on Android and iOS.
            JetForgeScreen never uses a WebView.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm leading-6">
          <li>
            <strong>1. Design.</strong> Place Material 3 components on the phone the way you would frames
            in Figma. Upload image/icon placeholders from this device; bind them so API fields replace the art.
          </li>
          <li>
            <strong>2. Request.</strong> Each screen can fire a configured API: method, header key-values,
            query, JSON or form body, with <code>{"{{forms.*}}"}</code> interpolation.
          </li>
          <li>
            <strong>3. Prototype.</strong> Open the Prototype board to see every screen and route. Drag a
            hotspot onto another artboard to wire tap, or set double-tap / long-press / swipe in Touch.
          </li>
          <li>
            <strong>4. Publish.</strong> Native JetForgeScreen fetches the document, calls the same request,
            and binds the JSON onto the designed tree.
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
