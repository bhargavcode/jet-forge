import type { DataSource, UiNode } from "./schema";

export type BindingScope = Record<string, unknown>;

export function getByPath(root: unknown, path: string): unknown {
  if (!path) return undefined;
  const clean = path.replace(/^\{\{|\}\}$/g, "").trim();
  if (!clean) return undefined;
  const parts = clean.split(".").filter(Boolean);
  let current: unknown = root;
  for (const part of parts) {
    if (current == null) return undefined;
    if (Array.isArray(current)) {
      const index = Number(part);
      if (Number.isInteger(index)) {
        current = current[index];
        continue;
      }
    }
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function interpolate(template: string, scope: BindingScope): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, path: string) => {
    const value = getByPath(scope, path);
    if (value == null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

export function resolveProp(
  node: UiNode,
  key: string,
  scope: BindingScope,
): string | number | boolean | null {
  const binding = node.bindings?.[key];
  if (binding) {
    const value = getByPath(scope, binding);
    if (value != null) {
      if (typeof value === "object") return JSON.stringify(value);
      return value as string | number | boolean;
    }
  }
  const raw = node.props[key];
  if (typeof raw === "string" && raw.includes("{{")) {
    return interpolate(raw, scope);
  }
  return raw ?? null;
}

export function collectPaths(value: unknown, prefix = ""): string[] {
  if (value == null) return prefix ? [prefix] : [];
  if (Array.isArray(value)) {
    const paths = prefix ? [prefix] : [];
    if (value.length > 0) {
      paths.push(...collectPaths(value[0], prefix ? `${prefix}.0` : "0"));
      paths.push(...collectPaths(value[0], prefix ? `${prefix}.item` : "item"));
    }
    return paths;
  }
  if (typeof value === "object") {
    const paths = prefix ? [prefix] : [];
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const next = prefix ? `${prefix}.${key}` : key;
      paths.push(...collectPaths(child, next));
    }
    return paths;
  }
  return prefix ? [prefix] : [];
}

export function flattenSources(data: BindingScope): string[] {
  const paths: string[] = [];
  for (const key of Object.keys(data)) {
    paths.push(...collectPaths(data[key], key));
  }
  return [...new Set(paths)].slice(0, 80);
}

export async function fetchSources(
  sources: DataSource[],
  fetcher: typeof fetch = fetch,
): Promise<{ data: BindingScope; errors: Record<string, string> }> {
  const data: BindingScope = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    sources.map(async (source) => {
      try {
        const res = await fetcher(source.url, {
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
        if (source.mock !== undefined) {
          data[source.id] = source.mock;
        }
      }
    }),
  );

  return { data, errors };
}
