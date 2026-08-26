"use client";

import { cn } from "@/lib/utils";

export function VerticalResize({
  onDelta,
  className,
}: {
  onDelta: (dx: number) => void;
  className?: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={(event) => {
        event.preventDefault();
        let last = event.clientX;
        function move(next: PointerEvent) {
          onDelta(next.clientX - last);
          last = next.clientX;
        }
        function up() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
      className={cn("z-20 w-1.5 shrink-0 cursor-col-resize bg-border/70 hover:bg-primary/60", className)}
    />
  );
}

export function HorizontalResize({
  onDelta,
  className,
}: {
  onDelta: (dy: number) => void;
  className?: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      onPointerDown={(event) => {
        event.preventDefault();
        let last = event.clientY;
        function move(next: PointerEvent) {
          onDelta(next.clientY - last);
          last = next.clientY;
        }
        function up() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
      className={cn("z-20 h-1.5 shrink-0 cursor-row-resize bg-border/70 hover:bg-primary/60", className)}
    />
  );
}
