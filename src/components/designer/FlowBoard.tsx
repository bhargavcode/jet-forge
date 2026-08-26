"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { collectWires, hotspotNodes, interactionsOf } from "@/lib/interactions";
import { useDesigner } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Interaction, UiNode } from "@/lib/schema";

export function FlowBoard() {
  const document = useDesigner((s) => s.screen);
  const currentScreenId = useDesigner((s) => s.currentScreenId);
  const selectedId = useDesigner((s) => s.selectedId);
  const setCurrentScreen = useDesigner((s) => s.setCurrentScreen);
  const patchScreenById = (id: string, flowX: number, flowY: number) => {
    const screens = document.screens.map((screen) =>
      screen.id === id ? { ...screen, flowX, flowY } : screen,
    );
    useDesigner.setState({ screen: { ...document, screens } });
  };
  const select = useDesigner((s) => s.select);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
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

  function point(event: ReactPointerEvent) {
    const rect = boardRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  }

  function startMove(id: string, event: ReactPointerEvent, x: number, y: number) {
    const p = point(event);
    setDrag({ id, dx: p.x - x, dy: p.y - y });
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onMove(event: ReactPointerEvent) {
    const p = point(event);
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
      action: { type: "navigate", screenId: targetScreenId, params: node.itemBinding ? { article: "item" } : undefined },
    };
    if (tapIndex >= 0) list[tapIndex] = next;
    else list.push(next);
    useDesigner.getState().patchNode(node.id, { interactions: list, onClick: next.action });
    setWire(null);
  }

  return (
    <div
      ref={boardRef}
      className="relative h-full min-h-[520px] w-full overflow-auto bg-[radial-gradient(circle_at_top,_#ece8f3,_#d8d3e0_70%)]"
      onPointerMove={onMove}
      onPointerUp={() => {
        setDrag(null);
        if (wire) setWire(null);
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {wires.map((item) => {
          const from = document.screens.find((screen) => screen.id === item.fromScreenId);
          const to = document.screens.find((screen) => screen.id === item.toScreenId);
          if (!from || !to) return null;
          const x1 = (from.flowX ?? 48) + 220;
          const y1 = (from.flowY ?? 48) + 48;
          const x2 = to.flowX ?? 48;
          const y2 = (to.flowY ?? 48) + 48;
          const mid = (x1 + x2) / 2;
          return (
            <g key={`${item.fromNodeId}-${item.event}-${item.toScreenId}`}>
              <path
                d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#6750A4"
                strokeWidth="2"
              />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" fontSize="11" fill="#6750A4">
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
      {document.screens.map((screen) => {
        const x = screen.flowX ?? 48;
        const y = screen.flowY ?? 48;
        const hotspots = hotspotNodes(screen.root).slice(0, 6);
        return (
          <div
            key={screen.id}
            className={cn(
              "absolute w-[220px] rounded-2xl border bg-background/95 p-3 shadow-lg",
              screen.id === currentScreenId && "ring-2 ring-primary",
            )}
            style={{ left: x, top: y }}
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).dataset.handle) return;
              setCurrentScreen(screen.id);
              startMove(screen.id, event, x, y);
            }}
            onPointerUp={() => {
              if (wire) finishWire(screen.id);
            }}
          >
            <div className="text-sm font-semibold">{screen.name}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{screen.route}</div>
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
                      ox: x + 220,
                      oy: y + 48,
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
        Drag a hotspot onto another artboard to wire a tap → navigate. Drag frames to rearrange.
      </p>
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
