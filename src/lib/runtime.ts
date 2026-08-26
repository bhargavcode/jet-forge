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

export function interpolateSource(source: DataSource, scope: BindingScope): DataSource {
  return {
    ...source,
    url: interpolate(source.url, scope),
    body: source.body ? interpolate(source.body, scope) : source.body,
  };
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
    const value = getByPath(args.data, args.emptyPath);
    if (Array.isArray(value) && value.length === 0) return "empty";
  }
  return "ready";
}

export function isNodeVisible(
  visibleWhen: VisibleWhen | undefined,
  state: VisibleWhen | UiRuntimeState,
  hasFormError = false,
) {
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
