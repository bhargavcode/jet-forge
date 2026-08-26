import { corsHeaders, getScreen } from "@/lib/server/screens";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const screen = await getScreen(id);
  if (!screen) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404, headers: corsHeaders });
  }
  return NextResponse.json(screen, { headers: corsHeaders });
}
