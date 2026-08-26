"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { RuntimeHost } from "@/components/runtime/RuntimeHost";
import { collectWires, hotspotNodes, interactionsOf } from "@/lib/interactions";
import { useDesigner } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Interaction, ScreenDef, UiNode } from "@/lib/schema";

const FRAME_W = 188;
const FRAME_H = 420;
const COL_GAP = 232;

function defaultX(index: number) {
  return 56 + index * (FRAME_W + COL_GAP);
}

function needsSpread(screens: ScreenDef[]) {
  if (screens.length < 2) return screens.some((screen) => screen.flowX == null);
  if (screens.some((screen) => screen.flowX == null || screen.flowY == null)) return true;
  let clustered = 0;
  for (let i = 0; i < screens.length; i++) {
    for (let j = i + 1; j < screens.length; j++) {
      const dx = Math.abs((screens[i].flowX ?? 0) - (screens[j].flowX ?? 0));
      const dy = Math.abs((screens[i].flowY ?? 0) - (screens[j].flowY ?? 0));
      if (dx < 24 && dy < 24) clustered += 1;
    }
  }
  return clustered >= screens.length - 1;
}

export function FlowBoard() {
  const document = useDesigner((s) => s.screen);
  const currentScreenId = useDesigner((s) => s.currentScreenId);
  const selectedId = useDesigner((s) => s.selectedId);
  const setCurrentScreen = useDesigner((s) => s.setCurrentScreen);
  const previewData = useDesigner((s) => s.previewData);
  const previewErrors = useDesigner((s) => s.previewErrors);
  const liveData = useDesigner((s) => s.liveData);
  const select = useDesigner((s) => s.select);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const pending = useRef<{ id: string; x: number; y: number; sx: number; sy: number } | null>(null);
  const [wire, setWire] = useState<{
    fromScreenId: string;
    fromNodeId: string;
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const wires = collectWires(document);

  useEffect(() => {
    if (!needsSpread(document.screens)) return;
    useDesigner.setState({
      screen: {
        ...document,
        screens: document.screens.map((screen, index) => ({
          ...screen,
          flowX: defaultX(index),
          flowY: 48,
        })),
      },
    });
  }, [document]);

  const canvas = useMemo(() => {
    const maxX = Math.max(960, ...document.screens.map((screen, index) => (screen.flowX ?? defaultX(index)) + FRAME_W + 80));
    const maxY = Math.max(640, ...document.screens.map((screen) => (screen.flowY ?? 48) + FRAME_H + 80));
    return { width: maxX, height: maxY };
  }, [document.screens]);

  function point(event: ReactPointerEvent) {
    const root = boardRef.current;
    if (!root) return { x: event.clientX, y: event.clientY };
    return { x: event.clientX - root.getBoundingClientRect().left + root.scrollLeft, y: event.clientY - root.getBoundingClientRect().top + root.scrollTop };
  }

  function patchScreenById(id: string, flowX: number, flowY: number) {
    const screens = document.screens.map((screen) =>
      screen.id === id ? { ...screen, flowX, flowY } : screen,
    );
    useDesigner.setState({ screen: { ...document, screens } });
  }

  function onMove(event: ReactPointerEvent) {
    const p = point(event);
    if (pending.current && !drag) {
      const dist = Math.hypot(p.x - pending.current.sx, p.y - pending.current.sy);
      if (dist > 8) {
        setDrag({
          id: pending.current.id,
          dx: pending.current.sx - pending.current.x,
          dy: pending.current.sy - pending.current.y,
        });
      }
    }
    if (drag) {
      patchScreenById(drag.id, Math.max(16, p.x - drag.dx), Math.max(16, p.y - drag.dy));
    }
    if (wire) setWire({ ...wire, x: p.x, y: p.y });
  }

  function finishWire(targetScreenId: string) {
    if (!wire || wire.fromScreenId === targetScreenId) {
      setWire(null);
      return;
    }
    const from = document.screens.find((screen) => screen.id === wire.fromScreenId);
    if (!from) {
      setWire(null);
      return;
    }
    const node = findIn(from.root, wire.fromNodeId);
    if (!node) {
      setWire(null);
      return;
    }
    useDesigner.getState().setCurrentScreen(from.id);
    const list = [...interactionsOf(node)];
    const tapIndex = list.findIndex((item) => item.event === "tap");
    const next: Interaction = {
      event: "tap",
      action: {
        type: "navigate",
        screenId: targetScreenId,
        params: node.itemBinding ? { article: "item" } : undefined,
      },
    };
    if (tapIndex >= 0) list[tapIndex] = next;
    else list.push(next);
    useDesigner.getState().patchNode(node.id, { interactions: list, onClick: next.action });
    setWire(null);
  }

  return (
    <div
      ref={boardRef}
      className="relative h-full min-h-0 w-full overflow-auto bg-[radial-gradient(circle_at_top,_#ece8f3,_#d8d3e0_70%)]"
      onPointerMove={onMove}
      onPointerUp={() => {
        pending.current = null;
        setDrag(null);
        if (wire) setWire(null);
      }}
    >
      <div className="relative" style={{ width: canvas.width, height: canvas.height, minHeight: "100%" }}>
        <svg className="pointer-events-none absolute inset-0" width={canvas.width} height={canvas.height}>
          {wires.map((item) => {
            const fromIndex = document.screens.findIndex((screen) => screen.id === item.fromScreenId);
            const toIndex = document.screens.findIndex((screen) => screen.id === item.toScreenId);
            const from = document.screens[fromIndex];
            const to = document.screens[toIndex];
            if (!from || !to) return null;
            const x1 = (from.flowX ?? defaultX(fromIndex)) + FRAME_W;
            const y1 = (from.flowY ?? 48) + 180;
            const x2 = to.flowX ?? defaultX(toIndex);
            const y2 = (to.flowY ?? 48) + 180;
            const mid = (x1 + x2) / 2;
            return (
              <g key={`${item.fromNodeId}-${item.event}-${item.toScreenId}`}>
                <path
                  d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#6750A4"
                  strokeWidth="2"
                />
                <circle cx={x2} cy={y2} r="4" fill="#6750A4" />
                <text x={mid} y={(y1 + y2) / 2 - 10} textAnchor="middle" fontSize="11" fill="#6750A4">
                  {item.event} · {item.fromNodeType}
                </text>
              </g>
            );
          })}
          {wire ? (
            <path
              d={`M ${wire.ox} ${wire.oy} L ${wire.x} ${wire.y}`}
              fill="none"
              stroke="#6750A4"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          ) : null}
        </svg>
        {document.screens.map((screen, index) => {
          const x = screen.flowX ?? defaultX(index);
          const y = screen.flowY ?? 48;
          const hotspots = hotspotNodes(screen.root).slice(0, 5);
          return (
            <div
              key={screen.id}
              className={cn(
                "absolute w-[188px] rounded-2xl border bg-background/95 p-2 shadow-lg",
                screen.id === currentScreenId && "ring-2 ring-primary",
              )}
              style={{ left: x, top: y }}
              onPointerDown={(event) => {
                if ((event.target as HTMLElement).dataset.handle) return;
                setCurrentScreen(screen.id);
                const p = point(event);
                pending.current = { id: screen.id, x, y, sx: p.x, sy: p.y };
                (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
              }}
              onPointerUp={() => {
                if (wire) finishWire(screen.id);
              }}
            >
              <div className="flex items-baseline justify-between gap-2 px-1">
                <div className="truncate text-sm font-semibold">{screen.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{screen.route}</div>
              </div>
              <div className="relative mt-2 overflow-hidden rounded-[18px] border bg-black/80">
                <div className="h-[333px] w-[162px] overflow-hidden">
                  <div className="origin-top-left scale-[0.45]">
                    <RuntimeHost
                      document={document}
                      mode="edit"
                      editScreenId={screen.id}
                      liveData={liveData}
                      previewData={previewData}
                      previewErrors={previewErrors}
                    >
                      <PhoneFrame document={document} selectedId={null} interactive={false} />
                    </RuntimeHost>
                  </div>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {hotspots.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-md bg-muted px-2 py-1 text-left text-[11px]",
                      selectedId === node.id && "bg-primary text-primary-foreground",
                    )}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      select(node.id);
                      setCurrentScreen(screen.id);
                      const p = point(event);
                      setWire({
                        fromScreenId: screen.id,
                        fromNodeId: node.id,
                        ox: x + FRAME_W,
                        oy: y + 180,
                        x: p.x,
                        y: p.y,
                      });
                    }}
                  >
                    <span>{node.type}</span>
                    <span data-handle="1" className="size-2 rounded-full bg-primary" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <p className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-muted-foreground">
          All screens sit on this board. Drag a hotspot onto another artboard to wire tap → navigate.
        </p>
      </div>
    </div>
  );
}

function findIn(root: UiNode, id: string): UiNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findIn(child, id);
    if (found) return found;
  }
  return null;
}
