import { NextResponse } from "next/server";
import type { DataSource } from "@/lib/schema";
import { interpolate } from "@/lib/bindings";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    dataSources?: DataSource[];
    scope?: Record<string, unknown>;
  };
  const sources = body.dataSources ?? [];
  const scope = body.scope ?? {};
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    sources.map(async (source) => {
      try {
        if (source.simulateFailure) {
          throw new Error(source.name ? `${source.name} failed` : "Simulated API failure");
        }
        const rawUrl = interpolate(source.url, scope);
        const url = rawUrl.startsWith("http") ? rawUrl : new URL(rawUrl, request.url).toString();
        const res = await fetch(url, {
          method: source.method,
          headers: {
            Accept: "application/json",
            ...(source.method === "POST" ? { "Content-Type": "application/json" } : {}),
            ...source.headers,
          },
          body: source.method === "POST" ? (source.body ? interpolate(source.body, scope) : source.body) : undefined,
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        data[source.id] = await res.json();
      } catch (error) {
        if (source.fallbackToMock && source.mock !== undefined) {
          data[source.id] = source.mock;
        } else {
          errors[source.id] = error instanceof Error ? error.message : "Request failed";
        }
      }
    }),
  );

  return NextResponse.json({ data, errors });
}
