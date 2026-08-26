import type { KotlinDataModel, KotlinModelField } from "./schema";
import type { ModelField } from "./model";

const CLASS_RE = /data\s+class\s+([A-Za-z_]\w*)\s*\(([\s\S]*?)\)/;
const FIELD_RE = /(?:val|var)\s+([A-Za-z_]\w*)\s*:\s*([\w.<>,?\s]+)/g;

export function parseKotlinDataClass(source: string): { name: string; fields: KotlinModelField[] } | null {
  const match = source.match(CLASS_RE);
  if (!match) return null;
  const fields: KotlinModelField[] = [];
  const body = match[2] ?? "";
  for (const field of body.matchAll(FIELD_RE)) {
    const raw = field[2].replace(/\s+/g, "");
    fields.push({
      name: field[1],
      type: raw.replace(/\?$/, ""),
      nullable: raw.endsWith("?"),
    });
  }
  return { name: match[1], fields };
}

export function kotlinSource(name: string, fields: KotlinModelField[]): string {
  const inner = fields
    .map((field) => `    val ${field.name}: ${field.type}${field.nullable ? "?" : ""}`)
    .join(",\n");
  return `data class ${name}(\n${inner}\n)`;
}

function kotlinType(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    const inner = value.length ? kotlinType(key.replace(/s$/, "") || "Item", value[0]) : "Any";
    return `List<${inner}>`;
  }
  if (typeof value === "boolean") return "Boolean";
  if (typeof value === "number") return Number.isInteger(value) ? "Int" : "Double";
  if (value && typeof value === "object") {
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    return name.endsWith("s") ? name.slice(0, -1) : name;
  }
  return "String";
}

export function inferKotlinModel(
  name: string,
  payload: unknown,
  extra: { sourceId?: string; listPath?: string } = {},
): KotlinDataModel {
  let sample = payload;
  let listPath = extra.listPath;
  if (sample && typeof sample === "object" && !Array.isArray(sample)) {
    const record = sample as Record<string, unknown>;
    for (const key of ["articles", "items", "results", "data"]) {
      if (Array.isArray(record[key]) && record[key].length > 0) {
        sample = record[key][0];
        listPath = listPath ?? (extra.sourceId ? `${extra.sourceId}.${key}` : key);
        break;
      }
    }
  }
  if (Array.isArray(sample)) sample = sample[0];
  const fields: KotlinModelField[] = [];
  if (sample && typeof sample === "object") {
    for (const [key, value] of Object.entries(sample as Record<string, unknown>)) {
      if (value && typeof value === "object" && !Array.isArray(value)) continue;
      fields.push({ name: key, type: kotlinType(key, value) });
    }
  }
  if (fields.length === 0) fields.push({ name: "id", type: "String" });
  return {
    id: `model_${name.toLowerCase()}`,
    name,
    kotlin: kotlinSource(name, fields),
    fields,
    sourceId: extra.sourceId,
    listPath,
  };
}

export function bindPathsForModel(model: KotlinDataModel): ModelField[] {
  const prefix = model.listPath ? "item" : (model.sourceId ?? model.name.toLowerCase());
  return model.fields.map((field) => {
    const type = field.type.toLowerCase();
    const kind =
      type.includes("list") ? "array" : type.includes("bool") ? "boolean" : type.includes("int") || type.includes("double") ? "number" : /url|href/.test(field.name) ? "url" : /image|photo|thumb/.test(field.name) ? "image" : "string";
    return {
      path: `${prefix}.${field.name}`,
      kind,
      sample: field.type,
      sourceId: model.sourceId ?? model.id,
    } satisfies ModelField;
  });
}

export const SAMPLE_ARTICLE_KOTLIN = `data class Article(
    val id: String,
    val title: String,
    val description: String,
    val source: String,
    val image: String,
    val url: String,
    val accent: String
)`;

export const SAMPLE_NEWS_KOTLIN = `data class NewsResponse(
    val country: String,
    val status: String,
    val articles: List<Article>
)`;
