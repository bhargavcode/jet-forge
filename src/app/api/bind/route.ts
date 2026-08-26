import { NextResponse } from "next/server";
import type { DataSource } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { dataSources?: DataSource[] };
  const sources = body.dataSources ?? [];
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    sources.map(async (source) => {
      try {
        const url = source.url.startsWith("http")
          ? source.url
          : new URL(source.url, request.url).toString();
        const res = await fetch(url, {
          method: source.method,
          headers: {
            Accept: "application/json",
            ...(source.method === "POST" ? { "Content-Type": "application/json" } : {}),
            ...source.headers,
          },
          body: source.method === "POST" ? source.body : undefined,
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        data[source.id] = await res.json();
      } catch (error) {
        errors[source.id] = error instanceof Error ? error.message : "Request failed";
        if (source.mock !== undefined) data[source.id] = source.mock;
      }
    }),
  );

  return NextResponse.json({ data, errors });
}
