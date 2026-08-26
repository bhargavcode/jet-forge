import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/server/screens";

export const dynamic = "force-dynamic";

const filesDir = path.join(process.cwd(), "data", "assets", "files");

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const safe = path.basename(id);
  const filePath = path.join(filesDir, safe);
  try {
    const bytes = await fs.readFile(filePath);
    const ext = path.extname(safe).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".svg"
            ? "image/svg+xml"
            : "image/jpeg";
    return new NextResponse(bytes, {
      headers: { ...corsHeaders, "Content-Type": type, "Cache-Control": "public, max-age=31536000" },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404, headers: corsHeaders });
  }
}
