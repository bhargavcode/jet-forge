import { NextResponse } from "next/server";
import type { DataSource } from "@/lib/schema";
import { resolveRequestBody, resolveRequestHeaders, resolveRequestUrl } from "@/lib/requests";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    dataSources?: DataSource[];
    scope?: Record<string, unknown>;
  };
  const sources = body.dataSources ?? [];
  const scope = (body.scope ?? {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const origin = new URL(request.url).origin;

  await Promise.all(
    sources.map(async (source) => {
      try {
        if (source.simulateFailure) {
          throw new Error(source.name ? `${source.name} failed` : "Simulated API failure");
        }
        const url = resolveRequestUrl(source, scope, origin);
        const extra = resolveRequestBody(source, scope);
        const headers = { ...resolveRequestHeaders(source, scope), ...extra.headers };
        if (extra.body instanceof FormData) {
          delete headers["Content-Type"];
        }
        const res = await fetch(url, {
          method: source.method,
          headers,
          body: extra.body,
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const text = await res.text();
        data[source.id] = text ? JSON.parse(text) : {};
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
