import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";

type AnyHandler = (event: { stopPropagation: () => void }) => void;

export function isolateDragListeners(listeners: object | undefined) {
  if (!listeners) return {};
  const src = listeners as Record<string, AnyHandler | undefined>;
  return {
    ...src,
    onPointerDown: (event: ReactPointerEvent) => {
      event.stopPropagation();
      src.onPointerDown?.(event);
    },
    onMouseDown: (event: ReactMouseEvent) => {
      event.stopPropagation();
      src.onMouseDown?.(event);
    },
    onTouchStart: (event: ReactTouchEvent) => {
      event.stopPropagation();
      src.onTouchStart?.(event);
    },
  };
}
