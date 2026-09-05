"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Hand, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesigner } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PreviewConfigBar, usePreviewDeviceSize } from "@/components/designer/PreviewConfigBar";

export function CanvasStage({ children }: { children: ReactNode }) {
  const zoom = useDesigner((s) => s.canvasZoom);
  const canvasPan = useDesigner((s) => s.canvasPan);
  const setCanvasZoom = useDesigner((s) => s.setCanvasZoom);
  const setCanvasPan = useDesigner((s) => s.setCanvasPan);
  const panCanvasBy = useDesigner((s) => s.panCanvasBy);
  const canvasWire = useDesigner((s) => s.canvasWire);
  const updateWire = useDesigner((s) => s.updateWire);
  const cancelWire = useDesigner((s) => s.cancelWire);
  const completeWire = useDesigner((s) => s.completeWire);
  const screen = useDesigner((s) => s.screen);
  const playMode = useDesigner((s) => s.playMode);
  const snapGuides = useDesigner((s) => s.snapGuides);
  const device = usePreviewDeviceSize();
  const hostRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const panDrag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      const next = Math.min(el.clientWidth / (device.width + 48), el.clientHeight / (device.height + 120), 1.15);
      setFit(Number.isFinite(next) && next > 0 ? next : 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [device.width, device.height]);

  const scale = fit * zoom;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (event.target as HTMLElement | null)?.isContentEditable) return;
      event.preventDefault();
      setSpaceHeld(true);
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") setSpaceHeld(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

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

  function beginPan(event: React.PointerEvent) {
    panDrag.current = {
      x: event.clientX,
      y: event.clientY,
      panX: canvasPan.x,
      panY: canvasPan.y,
    };
    setPanning(true);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  function movePan(event: React.PointerEvent) {
    if (!panDrag.current) return;
    setCanvasPan({
      x: panDrag.current.panX + (event.clientX - panDrag.current.x),
      y: panDrag.current.panY + (event.clientY - panDrag.current.y),
    });
  }

  function endPan() {
    panDrag.current = null;
    setPanning(false);
  }

  return (
    <div
      ref={hostRef}
      className={cn(
        "relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden",
        (spaceHeld || panning) && "cursor-grab",
        panning && "cursor-grabbing",
      )}
      onWheel={(event) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setCanvasZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
          return;
        }
        event.preventDefault();
        panCanvasBy(-event.deltaX, -event.deltaY);
      }}
      onPointerDown={(event) => {
        if (canvasWire) return;
        const middle = event.button === 1;
        const spaceDrag = spaceHeld && event.button === 0;
        const emptyBg =
          event.button === 0 &&
          !spaceHeld &&
          (event.target === hostRef.current || (event.target as HTMLElement).dataset?.canvasPan === "1");
        if (middle || spaceDrag || emptyBg) {
          event.preventDefault();
          beginPan(event);
        }
      }}
      onPointerMove={movePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
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
      <div data-canvas-pan="1" className="absolute inset-0 z-0" aria-hidden />
      <div
        className="relative z-10 flex flex-col items-center justify-center gap-2"
        style={{ transform: `translate(${canvasPan.x}px, ${canvasPan.y}px)` }}
      >
        {!playMode ? <PreviewConfigBar className="max-w-[min(100%,420px)]" /> : null}
        <div
          className="flex items-center justify-center"
          style={{ width: device.width * scale, height: device.height * scale }}
        >
          <div style={{ zoom: scale, width: device.width, height: device.height }}>{children}</div>
        </div>
      </div>
      <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm">
        <Button size="icon-sm" variant="ghost" title="Reset pan — Space+drag, middle-click, or scroll to pan" onClick={() => setCanvasPan({ x: 0, y: 0 })}>
          <Hand className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" title="Zoom out" onClick={() => setCanvasZoom(zoom - 0.1)}>
          <Minus className="size-3.5" />
        </Button>
        <button
          type="button"
          className="min-w-12 text-center text-[11px] font-medium"
          title="Reset zoom & pan"
          onClick={() => {
            setCanvasZoom(1);
            setCanvasPan({ x: 0, y: 0 });
          }}
        >
          {Math.round(scale * 100)}%
        </button>
        <Button size="icon-sm" variant="ghost" title="Zoom in" onClick={() => setCanvasZoom(zoom + 0.1)}>
          <Plus className="size-3.5" />
        </Button>
      </div>
      {snapGuides && !playMode ? (
        <svg className="pointer-events-none fixed inset-0 z-30 h-screen w-screen">
          {snapGuides.vertical.map((x) => (
            <line key={`snap-v-${x}`} x1={x} y1={0} x2={x} y2={10000} stroke="#E91E63" strokeWidth="1" strokeDasharray="4 3" />
          ))}
          {snapGuides.horizontal.map((y) => (
            <line key={`snap-h-${y}`} x1={0} y1={y} x2={10000} y2={y} stroke="#E91E63" strokeWidth="1" strokeDasharray="4 3" />
          ))}
        </svg>
      ) : null}
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
            {screen.screens.map((screenItem) => (
              <button
                key={screenItem.id}
                type="button"
                data-wire-screen={screenItem.id}
                className="rounded-md px-2 py-1 text-[11px] font-medium hover:bg-primary hover:text-primary-foreground"
              >
                {screenItem.name}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
