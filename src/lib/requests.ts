import type { BindingScope } from "./bindings";
import { interpolate } from "./bindings";
import type { DataSource, KeyValue } from "./schema";

function rowsToRecord(rows: KeyValue[] | undefined, scope: BindingScope): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows ?? []) {
    if (!row.key?.trim()) continue;
    out[row.key.trim()] = interpolate(row.value ?? "", scope);
  }
  return out;
}

export function resolveRequestUrl(source: DataSource, scope: BindingScope, origin: string): string {
  const raw = interpolate(source.url, scope);
  const absolute = raw.startsWith("http") ? raw : new URL(raw.startsWith("/") ? raw : `/${raw}`, origin).toString();
  const url = new URL(absolute);
  for (const [key, value] of Object.entries(rowsToRecord(source.queryRows, scope))) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function resolveRequestHeaders(source: DataSource, scope: BindingScope): Record<string, string> {
  return {
    Accept: "application/json",
    ...(source.headers ?? {}),
    ...rowsToRecord(source.headerRows, scope),
  };
}

export function resolveRequestBody(
  source: DataSource,
  scope: BindingScope,
): { headers: Record<string, string>; body?: string | FormData } {
  const mode = source.bodyMode ?? (source.method === "GET" || source.method === "DELETE" ? "none" : source.body ? "json" : "none");
  if (mode === "none" || source.method === "GET" || source.method === "DELETE") {
    return { headers: {} };
  }
  if (mode === "form") {
    const params = new URLSearchParams(rowsToRecord(source.formRows, scope));
    return {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    };
  }
  if (mode === "multipart") {
    const form = new FormData();
    for (const [key, value] of Object.entries(rowsToRecord(source.formRows, scope))) {
      form.append(key, value);
    }
    return { headers: {}, body: form };
  }
  return {
    headers: { "Content-Type": "application/json" },
    body: source.body ? interpolate(source.body, scope) : "{}",
  };
}
