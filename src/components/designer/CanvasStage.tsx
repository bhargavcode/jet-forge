"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesigner } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CanvasStage({ children }: { children: ReactNode }) {
  const zoom = useDesigner((s) => s.canvasZoom);
  const setCanvasZoom = useDesigner((s) => s.setCanvasZoom);
  const canvasWire = useDesigner((s) => s.canvasWire);
  const updateWire = useDesigner((s) => s.updateWire);
  const cancelWire = useDesigner((s) => s.cancelWire);
  const completeWire = useDesigner((s) => s.completeWire);
  const screens = useDesigner((s) => s.screen.screens);
  const playMode = useDesigner((s) => s.playMode);
  const hostRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const next = Math.min(w / 400, h / 800, 1.15);
      setFit(Number.isFinite(next) && next > 0 ? next : 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = fit * zoom;

  useEffect(() => {
    if (!canvasWire) return;
    function move(event: PointerEvent) {
      updateWire(event.clientX, event.clientY);
    }
    function up(event: PointerEvent) {
      const hit = (event.target as HTMLElement | null)?.closest("[data-node-id], [data-wire-screen]");
      if (hit instanceof HTMLElement && hit.dataset.wireScreen) {
        const message = completeWire({ screenId: hit.dataset.wireScreen, nodeId: hit.dataset.wireNode });
        if (message) toast.message(message);
      } else {
        cancelWire();
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [canvasWire, updateWire, cancelWire, completeWire]);

  return (
    <div
      ref={hostRef}
      className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden"
      onWheel={(event) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        setCanvasZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
      }}
      onTouchStart={(event) => {
        if (event.touches.length !== 2) return;
        const [a, b] = [event.touches[0], event.touches[1]];
        pinch.current = {
          dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          zoom,
        };
      }}
      onTouchMove={(event) => {
        if (event.touches.length !== 2 || !pinch.current) return;
        event.preventDefault();
        const [a, b] = [event.touches[0], event.touches[1]];
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        setCanvasZoom(pinch.current.zoom * (dist / pinch.current.dist));
      }}
      onTouchEnd={() => {
        pinch.current = null;
      }}
    >
        <div
          className="flex items-center justify-center"
          style={{
            width: 360 * scale,
            height: 740 * scale,
          }}
        >
          <div style={{ zoom: scale, width: 360, height: 740 }}>{children}</div>
        </div>
      <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm">
        <Button size="icon-sm" variant="ghost" title="Zoom out" onClick={() => setCanvasZoom(zoom - 0.1)}>
          <Minus className="size-3.5" />
        </Button>
        <button type="button" className="min-w-12 text-center text-[11px] font-medium" onClick={() => setCanvasZoom(1)}>
          {Math.round(scale * 100)}%
        </button>
        <Button size="icon-sm" variant="ghost" title="Zoom in" onClick={() => setCanvasZoom(zoom + 0.1)}>
          <Plus className="size-3.5" />
        </Button>
      </div>
      {canvasWire && !playMode ? (
        <>
          <svg className="pointer-events-none fixed inset-0 z-30 h-screen w-screen">
            <path
              d={`M ${canvasWire.ox} ${canvasWire.oy} C ${(canvasWire.ox + canvasWire.x) / 2} ${canvasWire.oy}, ${(canvasWire.ox + canvasWire.x) / 2} ${canvasWire.y}, ${canvasWire.x} ${canvasWire.y}`}
              fill="none"
              stroke="#6750A4"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>
          <div className="absolute top-3 left-1/2 z-30 flex -translate-x-1/2 flex-wrap gap-1 rounded-lg border bg-background/95 p-1 shadow">
            {screens.map((screen) => (
              <button
                key={screen.id}
                type="button"
                data-wire-screen={screen.id}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {screen.name}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
