"use client";

import { createContext, useContext } from "react";
import type { ClickAction, VisibleWhen } from "./schema";
import type { BindingScope } from "./bindings";

export interface RuntimeApi {
  enabled: boolean;
  editMode: boolean;
  screenId: string;
  uiState: VisibleWhen;
  hasFormError: boolean;
  formValues: Record<string, Record<string, string>>;
  formErrors: Record<string, Record<string, string>>;
  setFormValue: (formId: string, name: string, value: string) => void;
  dispatch: (action: ClickAction, scope: BindingScope) => void;
}

export const RuntimeContext = createContext<RuntimeApi | null>(null);

export function useRuntime() {
  return useContext(RuntimeContext);
}
