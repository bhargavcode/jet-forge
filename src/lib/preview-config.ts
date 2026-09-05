export type PreviewDevicePreset = "phoneCompact" | "phone" | "phoneLarge" | "tablet" | "fold";

export type PreviewUiMode = "follow" | "light" | "dark";

export interface PreviewConfig {
  device: PreviewDevicePreset;
  fontScale: number;
  uiMode: PreviewUiMode;
  rtl: boolean;
}

export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  device: "phone",
  fontScale: 1,
  uiMode: "follow",
  rtl: false,
};

export interface PreviewDeviceSpec {
  id: PreviewDevicePreset;
  label: string;
  width: number;
  height: number;
  hint: string;
}

export const PREVIEW_DEVICES: PreviewDeviceSpec[] = [
  { id: "phoneCompact", label: "Small phone", width: 320, height: 640, hint: "320×640" },
  { id: "phone", label: "Phone", width: 360, height: 740, hint: "360×740" },
  { id: "phoneLarge", label: "Large phone", width: 412, height: 892, hint: "412×892 · Pixel class" },
  { id: "tablet", label: "Tablet", width: 600, height: 960, hint: "600×960 · 7″ class" },
  { id: "fold", label: "Fold open", width: 840, height: 900, hint: "840×900 · inner display" },
];

export const PREVIEW_FONT_SCALES = [
  { value: 0.85, label: "85%" },
  { value: 1, label: "100%" },
  { value: 1.15, label: "115%" },
  { value: 1.3, label: "130%" },
  { value: 1.5, label: "150%" },
  { value: 2, label: "200%" },
] as const;

export function previewDevice(id: PreviewDevicePreset): PreviewDeviceSpec {
  return PREVIEW_DEVICES.find((item) => item.id === id) ?? PREVIEW_DEVICES[1];
}

export function resolvePreviewUiMode(config: PreviewUiMode, documentMode: "light" | "dark"): "light" | "dark" {
  return config === "follow" ? documentMode : config;
}
