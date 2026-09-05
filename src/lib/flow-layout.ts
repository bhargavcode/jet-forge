import type { ScreenDef } from "./schema";

/** Flow-board card width (matches FlowBoard `w-[188px]`). */
export const FLOW_FRAME_W = 188;

/** Approximate card height including header, phone, and hotspot rows. */
export const FLOW_FRAME_H = 420;

export const FLOW_ROW_GAP = 48;
export const FLOW_ORIGIN_X = 56;
export const FLOW_ORIGIN_Y = 48;
export const FLOW_COLUMNS = 3;

/** Horizontal distance between card origins (56 → 476 → 896). */
export const FLOW_COL_STEP = 420;
export const FLOW_ROW_STEP = FLOW_FRAME_H + FLOW_ROW_GAP;

/** Card chrome offsets (px from card top-left). */
const CARD_PAD = 8;
const HEADER_H = 24;
const SECTION_GAP = 8;
const PHONE_H = 333;
const HOTSPOT_H = 28;
const HOTSPOT_GAP = 4;

export function flowPosition(index: number, columns = FLOW_COLUMNS): { flowX: number; flowY: number } {
  const col = index % columns;
  const row = Math.floor(index / columns);
  return {
    flowX: FLOW_ORIGIN_X + col * FLOW_COL_STEP,
    flowY: FLOW_ORIGIN_Y + row * FLOW_ROW_STEP,
  };
}

export function defaultFlowX(index: number) {
  return flowPosition(index).flowX;
}

export function defaultFlowY(index: number) {
  return flowPosition(index).flowY;
}

/** Right-edge anchor for a hotspot row on a screen card. */
export function flowWireOrigin(screenX: number, screenY: number, hotspotIndex: number) {
  const rowTop =
    CARD_PAD + HEADER_H + SECTION_GAP + PHONE_H + SECTION_GAP + hotspotIndex * (HOTSPOT_H + HOTSPOT_GAP);
  return {
    x: screenX + FLOW_FRAME_W - 10,
    y: screenY + rowTop + HOTSPOT_H / 2,
  };
}

/** Left-edge anchor on the target screen (center of phone preview). */
export function flowWireTarget(screenX: number, screenY: number) {
  return {
    x: screenX + 6,
    y: screenY + CARD_PAD + HEADER_H + SECTION_GAP + PHONE_H / 2,
  };
}

export function needsFlowSpread(screens: ScreenDef[]) {
  if (screens.length === 0) return false;
  if (screens.some((screen) => screen.flowX == null || screen.flowY == null)) return true;

  let clustered = 0;
  for (let i = 0; i < screens.length; i++) {
    for (let j = i + 1; j < screens.length; j++) {
      const dx = Math.abs((screens[i].flowX ?? 0) - (screens[j].flowX ?? 0));
      const dy = Math.abs((screens[i].flowY ?? 0) - (screens[j].flowY ?? 0));
      if (dx < 24 && dy < 24) clustered += 1;
    }
  }
  if (clustered >= screens.length - 1) return true;

  // Legacy grids used 280px columns starting at x=48 — relayout to the 420px rhythm.
  return screens.some((screen, index) => {
    const x = screen.flowX ?? 0;
    return x === 48 + (index % FLOW_COLUMNS) * 280;
  });
}

export function spreadFlowScreens(screens: ScreenDef[]): ScreenDef[] {
  return screens.map((screen, index) => {
    const pos = flowPosition(index);
    return { ...screen, flowX: pos.flowX, flowY: pos.flowY };
  });
}

export function flowCanvasSize(screens: ScreenDef[]) {
  const maxX = Math.max(
    960,
    ...screens.map((screen, index) => (screen.flowX ?? defaultFlowX(index)) + FLOW_FRAME_W + 80),
  );
  const maxY = Math.max(
    640,
    ...screens.map((screen, index) => (screen.flowY ?? defaultFlowY(index)) + FLOW_FRAME_H + 80),
  );
  return { width: maxX, height: maxY };
}
