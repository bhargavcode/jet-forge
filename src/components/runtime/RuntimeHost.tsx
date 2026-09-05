"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BindingScope } from "@/lib/bindings";
import { interpolate } from "@/lib/bindings";
import { currentScreen } from "@/lib/document";
import {
  buildFormScope,
  computeUiState,
  interpolateSource,
  mergeBindingData,
  resolveActionParams,
  screenErrors,
  sourcesForScreen,
  validateForm,
} from "@/lib/runtime";
import { RuntimeContext, type RuntimeApi } from "@/lib/runtime-context";
import type { CanvasState, ClickAction, ScreenDocument, VisibleWhen } from "@/lib/schema";

const RuntimeScopeContext = createContext<BindingScope>({});

export function useRuntimeScope() {
  return useContext(RuntimeScopeContext);
}

export function RuntimeHost({
  document,
  mode,
  canvasState = "auto",
  editScreenId,
  liveData,
  previewData,
  previewErrors,
  children,
}: {
  document: ScreenDocument;
  mode: "edit" | "play" | "device";
  canvasState?: CanvasState;
  editScreenId?: string;
  liveData?: boolean;
  previewData?: BindingScope;
  previewErrors?: Record<string, string>;
  children: ReactNode;
}) {
  const enabled = mode !== "edit";
  const [screenId, setScreenId] = useState(document.startScreenId);
  const [, setHistory] = useState<string[]>([]);
  const [route, setRoute] = useState<BindingScope>({});
  const [data, setData] = useState<BindingScope>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(enabled);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [formErrors, setFormErrors] = useState<Record<string, Record<string, string>>>({});

  const activeScreenId = enabled ? screenId : (editScreenId ?? document.startScreenId);
  const activeScreen = currentScreen(document, activeScreenId);

  const documentRef = useRef(document);
  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  const mocks = useMemo(
    () => Object.fromEntries(document.dataSources.map((source) => [source.id, source.mock ?? {}])),
    [document.dataSources],
  );

  const fetchScreen = useCallback(
    async (id: string, nextRoute: BindingScope, nextForms: Record<string, Record<string, string>>) => {
      const current = documentRef.current;
      const target = currentScreen(current, id);
      const ids = sourcesForScreen(current.dataSources, target, target.root);
      const sources = current.dataSources.filter((source) => ids.includes(source.id));
      const mockMap = Object.fromEntries(current.dataSources.map((source) => [source.id, source.mock ?? {}]));
      if (sources.length === 0) {
        setData(mockMap);
        setErrors({});
        setLoading(false);
        return;
      }
      setLoading(true);
      const scope: BindingScope = {
        ...mockMap,
        route: nextRoute,
        forms: buildFormScope(nextForms, {}),
      };
      try {
        const res = await fetch("/api/bind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataSources: sources.map((source) => interpolateSource(source, scope)),
            scope,
          }),
        });
        const payload = (await res.json()) as { data: BindingScope; errors: Record<string, string> };
        setData(mergeBindingData(mockMap, payload.data ?? {}));
        setErrors(payload.errors ?? {});
      } catch (error) {
        setData(mockMap);
        setErrors({
          [ids[0] ?? "app"]: error instanceof Error ? error.message : "Request failed",
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    void fetchScreen(document.startScreenId, {}, {});
  }, [enabled, document.id, document.startScreenId, fetchScreen]);

  const editData = useMemo(
    () => mergeBindingData(mocks, liveData ? (previewData ?? {}) : {}),
    [liveData, mocks, previewData],
  );

  const runtimeData = enabled ? mergeBindingData(mocks, data) : editData;
  const sourceIds = sourcesForScreen(document.dataSources, activeScreen);
  const runtimeErrors = screenErrors(enabled ? errors : (previewErrors ?? {}), sourceIds);

  const computed = computeUiState({
    loading: enabled ? loading : false,
    errors: runtimeErrors,
    data: runtimeData,
    emptyPath: activeScreen.emptyPath,
  });

  const uiState: VisibleWhen = !enabled
    ? canvasState === "auto"
      ? computed
      : canvasState === "invalid"
        ? "ready"
        : canvasState
    : computed;

  const hasFormError = enabled
    ? Object.values(formErrors).some((group) => Object.keys(group).length > 0)
    : canvasState === "invalid";

  const scope: BindingScope = {
    ...runtimeData,
    route,
    forms: buildFormScope(formValues, formErrors),
    errors: runtimeErrors,
  };

  const dispatch = useCallback(
    (action: ClickAction, actionScope: BindingScope) => {
      if (!action || action.type === "none") return;
      if (action.type === "back") {
        setHistory((stack) => {
          const next = [...stack];
          const previous = next.pop();
          if (previous) {
            setScreenId(previous);
            void fetchScreen(previous, route, formValues);
          }
          return next;
        });
        return;
      }
      if (action.type === "retry") {
        void fetchScreen(activeScreenId, route, formValues);
        return;
      }
      if (action.type === "openUrl") {
        const url = interpolate(action.url ?? "", actionScope);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      if (action.type === "callApi") {
        void fetchScreen(activeScreenId, route, formValues);
        return;
      }
      if (action.type === "submitForm" && action.formId) {
        const found = validateForm(activeScreen.root, action.formId, formValues[action.formId] ?? {});
        setFormErrors((current) => ({ ...current, [action.formId!]: found }));
        if (Object.keys(found).length > 0) return;
        if (action.screenId) {
          setHistory((stack) => [...stack, activeScreenId]);
          setScreenId(action.screenId);
          void fetchScreen(action.screenId, route, formValues);
        } else {
          void fetchScreen(activeScreenId, route, formValues);
        }
        return;
      }
      if (action.type === "focusNode" && action.nodeId) {
        window.document.querySelector(`[data-node-id="${action.nodeId}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
      if (action.type === "navigate" && action.screenId) {
        const params = resolveActionParams(action, actionScope);
        const nextRoute = { ...route, ...params };
        setHistory((stack) => [...stack, activeScreenId]);
        setRoute(nextRoute);
        setScreenId(action.screenId);
        setFormErrors({});
        void fetchScreen(action.screenId, nextRoute, formValues);
        if (action.nodeId) {
          requestAnimationFrame(() => {
            window.document
              .querySelector(`[data-node-id="${action.nodeId}"]`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        }
      }
    },
    [activeScreen.root, activeScreenId, fetchScreen, formValues, route],
  );

  const api: RuntimeApi = {
    enabled,
    editMode: mode === "edit",
    screenId: activeScreenId,
    uiState,
    hasFormError,
    formValues,
    formErrors,
    setFormValue: (formId, name, value) => {
      setFormValues((current) => ({
        ...current,
        [formId]: { ...(current[formId] ?? {}), [name]: value },
      }));
      setFormErrors((current) => {
        const group = { ...(current[formId] ?? {}) };
        delete group[name];
        return { ...current, [formId]: group };
      });
    },
    dispatch,
  };

  return (
    <RuntimeContext.Provider value={api}>
      <RuntimeScopeContext.Provider value={scope}>{children}</RuntimeScopeContext.Provider>
    </RuntimeContext.Provider>
  );
}

export function useActiveRoot(document: ScreenDocument, editScreenId?: string, play?: boolean) {
  const runtime = useContext(RuntimeContext);
  const id = play || runtime?.enabled ? runtime?.screenId : editScreenId;
  return currentScreen(document, id).root;
}
