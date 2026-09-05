import type { AssetRef, ScreenDocument } from "./schema";

export function resolveMediaUrl(url: string | undefined | null, baseUrl?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  if (!baseUrl) return url;
  return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

export function assetById(document: ScreenDocument, assetId?: string | null): AssetRef | undefined {
  if (!assetId) return undefined;
  return document.assets?.find((asset) => asset.id === assetId);
}

export function resolveAssetUrl(
  document: ScreenDocument,
  args: { url?: string | null; assetId?: string | null },
  baseUrl?: string,
): string | undefined {
  const fromAsset = assetById(document, args.assetId)?.url;
  return resolveMediaUrl(fromAsset ?? args.url ?? undefined, baseUrl);
}

export const COLOR_TOKEN_LABELS: Record<string, string> = {
  primary: "Primary",
  onPrimary: "On primary",
  primaryContainer: "Primary container",
  onPrimaryContainer: "On primary container",
  secondary: "Secondary",
  onSecondary: "On secondary",
  secondaryContainer: "Secondary container",
  onSecondaryContainer: "On secondary container",
  tertiary: "Tertiary",
  surface: "Surface",
  onSurface: "On surface",
  onSurfaceVariant: "On surface variant",
  surfaceContainer: "Surface container",
  surfaceContainerHigh: "Surface container high",
  outline: "Outline",
  error: "Error",
};
