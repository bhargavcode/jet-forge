import { promises as fs } from "fs";
import path from "path";
import type { PublishedScreenSummary, ScreenDocument } from "@/lib/schema";
import { createStarterScreen } from "@/lib/starter-screen";
import { normalizeDocument } from "@/lib/document";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "screens.json");

async function readAll(): Promise<Record<string, ScreenDocument>> {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw) as Record<string, ScreenDocument>;
  } catch {
    return {};
  }
}

async function writeAll(screens: Record<string, ScreenDocument>) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(screens, null, 2), "utf8");
}

export async function saveScreen(document: ScreenDocument): Promise<ScreenDocument> {
  const screens = await readAll();
  const published: ScreenDocument = {
    ...normalizeDocument(document),
    publishedAt: new Date().toISOString(),
  };
  screens[published.id] = published;
  await writeAll(screens);
  return published;
}

export async function getScreen(id: string): Promise<ScreenDocument | null> {
  const screens = await readAll();
  if (screens[id]) return normalizeDocument(screens[id]);
  if (id === "us-briefing" || id === "aurora-market") return createStarterScreen();
  return null;
}

export async function listScreens(): Promise<PublishedScreenSummary[]> {
  const screens = await readAll();
  return Object.values(screens)
    .map((screen) => ({
      id: screen.id,
      name: screen.name,
      publishedAt: screen.publishedAt ?? "",
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
