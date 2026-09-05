"use client";

import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useState } from "react";
import { Move } from "lucide-react";
import { computeSnap, type SnapResult } from "@/lib/snap";
import type { UiNode } from "@/lib/schema";
import { useDesigner } from "@/lib/store";

type ResizeHandle = "se" | "e" | "s";

export function SelectionChrome({
  node,
  shellRef,
}: {
  node: UiNode;
  shellRef: RefObject<HTMLElement | null>;
}) {
  const patchNode = useDesigner((s) => s.patchNode);
  const setSnapGuides = useDesigner((s) => s.setSnapGuides);
  const snapEnabled = useDesigner((s) => s.snapEnabled);
  const [live, setLive] = useState<{ w: number; h: number } | null>(null);

  const shell = shellRef.current;
  const measuredW = shell ? Math.round(shell.offsetWidth) : 0;
  const measuredH = shell ? Math.round(shell.offsetHeight) : 0;
  const w = live?.w ?? node.modifiers.widthDp ?? measuredW;
  const h = live?.h ?? node.modifiers.heightDp ?? measuredH;

  function screenContext() {
    const screen = shellRef.current?.closest(".phone-screen");
    const parentRect = screen?.getBoundingClientRect();
    const siblings = screen
      ? Array.from(screen.querySelectorAll<HTMLElement>("[data-node-id]"))
          .filter((el) => el !== shellRef.current)
          .map((el) => el.getBoundingClientRect())
      : [];
    return { parentRect, siblings };
  }

  function applySnap(moving: DOMRect): SnapResult {
    if (!snapEnabled) {
      setSnapGuides(null);
      return { guides: null };
    }
    const { parentRect, siblings } = screenContext();
    return computeSnap(moving, siblings, undefined, parentRect);
  }

  function startResize(handle: ResizeHandle, event: ReactPointerEvent) {
    event.stopPropagation();
    event.preventDefault();
    const bounds = shellRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const rect = bounds;
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = node.modifiers.widthDp ?? rect.width;
    const startH = node.modifiers.heightDp ?? rect.height;

    function move(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let nextW = Math.max(24, Math.round(startW + (handle !== "s" ? dx : 0)));
      let nextH = Math.max(24, Math.round(startH + (handle !== "e" ? dy : 0)));
      const moving = new DOMRect(rect.left, rect.top, nextW, nextH);
      const snap = applySnap(moving);
      if (snap.snapW != null) nextW = snap.snapW;
      if (snap.snapH != null) nextH = snap.snapH;
      if (snap.guides) setSnapGuides(snap.guides);
      patchNode(node.id, {
        modifiers: {
          ...node.modifiers,
          widthMode: "fixed",
          heightMode: "fixed",
          widthDp: nextW,
          heightDp: nextH,
          fillMaxWidth: false,
          fillMaxHeight: false,
          fillMaxSize: false,
        },
      });
      setLive({ w: nextW, h: nextH });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setSnapGuides(null);
      setLive(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startMove(event: ReactPointerEvent) {
    event.stopPropagation();
    event.preventDefault();
    const bounds = shellRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const rect = bounds;
    const startX = event.clientX;
    const startY = event.clientY;
    const baseOffsetX = node.modifiers.offsetXDp ?? 0;
    const baseOffsetY = node.modifiers.offsetYDp ?? 0;

    function move(ev: PointerEvent) {
      const dx = Math.round(ev.clientX - startX);
      const dy = Math.round(ev.clientY - startY);
      let nextX = baseOffsetX + dx;
      let nextY = baseOffsetY + dy;
      const moving = new DOMRect(rect.left + dx, rect.top + dy, rect.width, rect.height);
      const snap = applySnap(moving);
      if (snap.snapLeft != null) nextX = Math.round(baseOffsetX + (snap.snapLeft - rect.left));
      if (snap.snapTop != null) nextY = Math.round(baseOffsetY + (snap.snapTop - rect.top));
      patchNode(node.id, {
        modifiers: {
          ...node.modifiers,
          offsetXDp: Math.round(nextX),
          offsetYDp: Math.round(nextY),
        },
      });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setSnapGuides(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <>
      <div
        data-chrome="metrics"
        className="pointer-events-none absolute -top-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1C1B1F]/92 px-2 py-0.5 font-mono text-[10px] text-white shadow-md"
      >
        {w}×{h} dp
      </div>

      <button
        type="button"
        data-chrome="move"
        title="Drag to move (updates offset)"
        className="absolute top-1/2 left-1/2 z-50 flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full border border-white/80 bg-[#6750A4]/90 text-white shadow"
        onPointerDown={startMove}
      >
        <Move className="size-3.5" />
      </button>

      <div
        data-chrome="frame"
        className="pointer-events-none absolute inset-0 z-30 rounded-sm border-2 border-[#6750A4]/50"
      />

      <button
        type="button"
        data-chrome="resize-se"
        title="Resize width & height"
        className="absolute -bottom-1.5 -right-1.5 z-50 size-3 cursor-se-resize rounded-sm border border-white bg-[#6750A4] shadow"
        onPointerDown={(e) => startResize("se", e)}
      />
      <button
        type="button"
        data-chrome="resize-e"
        title="Resize width"
        className="absolute top-1/2 -right-1.5 z-50 size-3 -translate-y-1/2 cursor-e-resize rounded-sm border border-white bg-[#6750A4] shadow"
        onPointerDown={(e) => startResize("e", e)}
      />
      <button
        type="button"
        data-chrome="resize-s"
        title="Resize height"
        className="absolute -bottom-1.5 left-1/2 z-50 size-3 -translate-x-1/2 cursor-s-resize rounded-sm border border-white bg-[#6750A4] shadow"
        onPointerDown={(e) => startResize("s", e)}
      />
    </>
  );
}
