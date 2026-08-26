import type { ClickAction, DataSource, UiNode, ValidationRule, VisibleWhen } from "./schema";
import { getByPath, interpolate, type BindingScope } from "./bindings";
import { walk } from "./tree";

export type UiRuntimeState = Exclude<VisibleWhen, "always">;

export function validateValue(value: string, rule?: ValidationRule): string | null {
  if (!rule) return null;
  const trimmed = value.trim();
  if (rule.required && !trimmed) return rule.message || "This field is required.";
  if (rule.minLength && trimmed.length < rule.minLength) {
    return rule.message || `Enter at least ${rule.minLength} characters.`;
  }
  if (rule.maxLength && trimmed.length > rule.maxLength) {
    return rule.message || `Use at most ${rule.maxLength} characters.`;
  }
  if (rule.pattern) {
    try {
      if (!new RegExp(rule.pattern).test(trimmed)) return rule.message || "That value is not valid.";
    } catch {
      return rule.message || "That value is not valid.";
    }
  }
  return null;
}

export function collectFormFields(root: UiNode) {
  const fields: { node: UiNode; formId: string; name: string; rule?: ValidationRule }[] = [];
  walk(root, (node) => {
    if (node.formField) {
      fields.push({
        node,
        formId: node.formField.formId,
        name: node.formField.name,
        rule: node.formField.validation,
      });
    }
  });
  return fields;
}

export function validateForm(
  root: UiNode,
  formId: string,
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of collectFormFields(root)) {
    if (field.formId !== formId) continue;
    const message = validateValue(values[field.name] ?? "", field.rule);
    if (message) errors[field.name] = message;
  }
  return errors;
}

export function resolveActionParams(action: ClickAction, scope: BindingScope): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, path] of Object.entries(action.params ?? {})) {
    params[key] = getByPath(scope, path) ?? interpolate(path, scope);
  }
  return params;
}

export function sourcesForScreen(
  dataSources: { id: string }[],
  screen: { dataSourceIds?: string[]; emptyPath?: string },
): string[] {
  if (screen.dataSourceIds && screen.dataSourceIds.length > 0) {
    return screen.dataSourceIds;
  }
  if (screen.emptyPath) {
    const id = screen.emptyPath.split(".")[0];
    if (id && dataSources.some((source) => source.id === id)) return [id];
  }
  return [];
}

export function screenErrors(
  errors: Record<string, string>,
  sourceIds: string[],
): Record<string, string> {
  if (sourceIds.length === 0) return {};
  const next: Record<string, string> = {};
  for (const id of sourceIds) {
    if (errors[id]) next[id] = errors[id];
  }
  return next;
}

export function interpolateSource(source: DataSource, scope: BindingScope): DataSource {
  return {
    ...source,
    url: interpolate(source.url, scope),
    body: source.body ? interpolate(source.body, scope) : source.body,
  };
}

export function mergeBindingData(base: BindingScope, overlay: BindingScope): BindingScope {
  const next: BindingScope = { ...base, ...overlay };
  for (const [key, mock] of Object.entries(base)) {
    const live = overlay[key];
    if (live == null) {
      next[key] = mock;
      continue;
    }
    if (
      mock &&
      live &&
      typeof mock === "object" &&
      typeof live === "object" &&
      !Array.isArray(mock) &&
      !Array.isArray(live)
    ) {
      const merged = { ...(mock as BindingScope), ...(live as BindingScope) };
      const mockArticles = (mock as BindingScope).articles;
      const liveArticles = (live as BindingScope).articles;
      if (Array.isArray(mockArticles) && !Array.isArray(liveArticles)) {
        merged.articles = mockArticles;
      }
      next[key] = merged;
    }
  }
  return next;
}

export function resolveList(scope: BindingScope, path: string): unknown[] {
  const direct = getByPath(scope, path);
  if (Array.isArray(direct)) return direct;
  const sourceId = path.split(".")[0];
  const source = scope[sourceId];
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const record = source as BindingScope;
    for (const key of ["articles", "items", "results"]) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  return [];
}

export function computeUiState(args: {
  loading: boolean;
  errors: Record<string, string>;
  data: BindingScope;
  emptyPath?: string;
}): UiRuntimeState {
  if (args.loading) return "loading";
  if (Object.keys(args.errors).length > 0) return "error";
  if (args.emptyPath) {
    const list = resolveList(args.data, args.emptyPath);
    if (list.length === 0) return "empty";
  }
  return "ready";
}

export function isNodeVisible(
  visibleWhen: VisibleWhen | undefined,
  state: VisibleWhen | UiRuntimeState,
  hasFormError = false,
  visibleIf?: { path: string; op?: string; value?: string },
  scope?: BindingScope,
) {
  if (visibleIf?.path && scope) {
    const raw = getByPath(scope, visibleIf.path);
    const op = visibleIf.op ?? "truthy";
    const text = raw == null ? "" : typeof raw === "object" ? JSON.stringify(raw) : String(raw);
    const empty = raw == null || text === "" || (Array.isArray(raw) && raw.length === 0);
    let pass = true;
    if (op === "truthy") pass = !empty && raw !== false && raw !== 0;
    else if (op === "falsy") pass = empty || raw === false || raw === 0;
    else if (op === "empty") pass = empty;
    else if (op === "notEmpty") pass = !empty;
    else if (op === "equals") pass = text === (visibleIf.value ?? "");
    else if (op === "notEquals") pass = text !== (visibleIf.value ?? "");
    if (!pass) return false;
  }
  const when = visibleWhen ?? "always";
  if (when === "always") return true;
  if (when === "invalid") return hasFormError;
  return when === state;
}

export function buildFormScope(
  values: Record<string, Record<string, string>>,
  errors: Record<string, Record<string, string>>,
): BindingScope {
  const forms: BindingScope = {};
  const ids = new Set([...Object.keys(values), ...Object.keys(errors)]);
  for (const id of ids) {
    forms[id] = {
      ...(values[id] ?? {}),
      errors: errors[id] ?? {},
    };
  }
  return forms;
}
