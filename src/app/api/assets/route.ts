import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { AssetRef } from "@/lib/schema";
import { corsHeaders } from "@/lib/server/screens";

export const dynamic = "force-dynamic";

const assetsDir = path.join(process.cwd(), "data", "assets");
const filesDir = path.join(assetsDir, "files");
const indexFile = path.join(assetsDir, "index.json");

async function readIndex(): Promise<AssetRef[]> {
  try {
    return JSON.parse(await fs.readFile(indexFile, "utf8")) as AssetRef[];
  } catch {
    return [];
  }
}

async function writeIndex(assets: AssetRef[]) {
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(indexFile, JSON.stringify(assets, null, 2), "utf8");
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json({ assets: await readIndex() }, { headers: corsHeaders });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image or icon file." }, { status: 400, headers: corsHeaders });
  }
  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files can be uploaded." }, { status: 400, headers: corsHeaders });
  }
  const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("svg") ? "svg" : "jpg";
  await fs.mkdir(filesDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(filesDir, `${id}.${ext}`), bytes);
  const kind = form.get("kind") === "icon" ? "icon" : "image";
  const asset: AssetRef = {
    id,
    name: file.name || `${kind}.${ext}`,
    kind,
    mime,
    url: `/api/assets/${id}.${ext}`,
  };
  const assets = await readIndex();
  assets.unshift(asset);
  await writeIndex(assets.slice(0, 80));
  return NextResponse.json(asset, { headers: corsHeaders });
}
