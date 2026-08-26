import { corsHeaders, listScreens, saveScreen } from "@/lib/server/screens";
import type { ScreenDocument } from "@/lib/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET() {
  const screens = await listScreens();
  return NextResponse.json({ screens }, { headers: corsHeaders });
}

export async function POST(request: Request) {
  const document = (await request.json()) as ScreenDocument;
  if (!document?.id || !document?.root) {
    return NextResponse.json({ error: "Invalid screen document" }, { status: 400, headers: corsHeaders });
  }
  const saved = await saveScreen(document);
  return NextResponse.json(
    {
      id: saved.id,
      publishedAt: saved.publishedAt,
      devicePath: `/device/${saved.id}`,
      fetchUrl: `/api/screens/${saved.id}`,
    },
    { headers: corsHeaders },
  );
}
