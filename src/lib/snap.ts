export interface SnapGuideLines {
  vertical: number[];
  horizontal: number[];
}

export interface SnapResult {
  snapW?: number;
  snapH?: number;
  snapLeft?: number;
  snapTop?: number;
  guides: SnapGuideLines | null;
}

const THRESHOLD = 6;

function edges(rect: DOMRect) {
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
  };
}

/** Snap a moving rect's size/position to sibling widget edges (screen coordinates). */
export function computeSnap(
  moving: DOMRect,
  siblings: DOMRect[],
  threshold = THRESHOLD,
  parent?: DOMRect,
): SnapResult {
  const pool = parent ? [...siblings, parent] : siblings;
  const m = edges(moving);
  const vertical: number[] = [];
  const horizontal: number[] = [];
  let snapW: number | undefined;
  let snapH: number | undefined;
  let snapLeft: number | undefined;
  let snapTop: number | undefined;

  for (const sib of pool) {
    const s = edges(sib);
    const xPairs: [number, number, "w" | "pos" | "left" | "right"][] = [
      [m.right, s.left, "w"],
      [m.right, s.right, "w"],
      [m.left, s.left, "left"],
      [m.left, s.right, "left"],
      [m.right, s.left, "right"],
      [m.right, s.right, "right"],
      [m.cx, s.cx, "pos"],
    ];
    for (const [a, b, kind] of xPairs) {
      if (Math.abs(a - b) <= threshold) {
        vertical.push(b);
        if (kind === "w") snapW = Math.max(24, Math.round(b - moving.left));
        if (kind === "left") snapLeft = Math.round(b);
        if (kind === "right") snapLeft = Math.round(b - moving.width);
      }
    }
    const yPairs: [number, number, "h" | "pos" | "top" | "bottom"][] = [
      [m.bottom, s.top, "h"],
      [m.bottom, s.bottom, "h"],
      [m.top, s.top, "top"],
      [m.top, s.bottom, "top"],
      [m.bottom, s.top, "bottom"],
      [m.bottom, s.bottom, "bottom"],
      [m.cy, s.cy, "pos"],
    ];
    for (const [a, b, kind] of yPairs) {
      if (Math.abs(a - b) <= threshold) {
        horizontal.push(b);
        if (kind === "h") snapH = Math.max(24, Math.round(b - moving.top));
        if (kind === "top") snapTop = Math.round(b);
        if (kind === "bottom") snapTop = Math.round(b - moving.height);
      }
    }
  }

  const guides =
    vertical.length || horizontal.length
      ? { vertical: [...new Set(vertical)], horizontal: [...new Set(horizontal)] }
      : null;

  return { snapW, snapH, snapLeft, snapTop, guides };
}
