"use client";

import { BINDABLE_PROPS } from "@/lib/catalog";
import { flattenSources } from "@/lib/bindings";
import { bindableComposeProps } from "@/lib/model";
import { bindPathsForModel } from "@/lib/kotlin-model";
import type {
  ActionType,
  AlignmentName,
  AnimationEasing,
  AnimationRepeat,
  ColorToken,
  DrawableType,
  EnterAnimationType,
  IconName,
  Interaction,
  ModifierSpec,
  PaddingSpec,
  TextStyle,
  TouchEvent,
  SizeMode,
  UiNode,
  VisibleWhen,
} from "@/lib/schema";
import type { VisibleIfOp } from "@/lib/schema";
import {
  ALIGN_BY_VALUES,
  BOX_ALIGNMENTS,
  COLUMN_ALIGNMENTS,
  COLUMN_ARRANGEMENTS,
  ROW_ALIGNMENTS,
  ROW_ARRANGEMENTS,
  TOUCH_EVENTS,
} from "@/lib/schema";
import {
  boxAlignment,
  columnAlignment,
  columnArrangement,
  patchContainerProps,
  rowAlignment,
  rowArrangement,
} from "@/lib/compose-params";
import { interactionsOf } from "@/lib/interactions";
import {
  defaultTextToken,
  defaultTypeScale,
  isButtonType,
  isLabelType,
  textAlignValue,
} from "@/lib/widget-chrome";
import { AssetUpload } from "./AssetUpload";
import { ModelBrowser } from "./ModelBrowser";
import { useDesigner } from "@/lib/store";
import { currentRoot } from "@/lib/document";
import { findNode, findParent, isContainer } from "@/lib/tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ReactNode } from "react";

const TEXT_STYLES: TextStyle[] = [
  "displayLarge",
  "headlineMedium",
  "titleLarge",
  "titleMedium",
  "bodyLarge",
  "bodyMedium",
  "labelLarge",
  "labelMedium",
];

const COLORS: ColorToken[] = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "surface",
  "onSurface",
  "onSurfaceVariant",
  "error",
  "tertiary",
];

const ICONS: IconName[] = [
  "home",
  "search",
  "cart",
  "person",
  "add",
  "favorite",
  "star",
  "settings",
  "back",
  "menu",
  "notifications",
  "tune",
];

const ANIMATIONS: EnterAnimationType[] = [
  "none",
  "fade",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "slideOutUp",
  "slideOutLeft",
  "scale",
  "bounce",
  "bounceIn",
  "colorPulse",
  "elevationPulse",
  "cardSlide",
];
const EASINGS: AnimationEasing[] = ["standard", "emphasized", "bounce", "linear"];
const REPEATS: AnimationRepeat[] = ["none", "infinite"];
const DRAWABLES: DrawableType[] = ["none", "color", "gradient", "image"];
const VISIBILITY: VisibleWhen[] = ["always", "ready", "loading", "error", "empty", "invalid"];
const VISIBLE_IF_OPS: VisibleIfOp[] = ["truthy", "falsy", "equals", "notEquals", "empty", "notEmpty"];
const ACTIONS: ActionType[] = ["none", "navigate", "focusNode", "back", "submitForm", "retry", "openUrl", "callApi"];

function sliderNumber(value: number | readonly number[]) {
  return Array.isArray(value) ? Number(value[0]) : Number(value);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

type SpacingMode = "sides" | "all" | "horizontal" | "vertical" | "start" | "end" | "top" | "bottom";

const SPACING_MODES: { value: SpacingMode; label: string }[] = [
  { value: "sides", label: "Start / End / Top / Bottom" },
  { value: "all", label: "All" },
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
];

function spacingFallback(spec?: PaddingSpec) {
  return spec?.all ?? spec?.start ?? spec?.end ?? spec?.top ?? spec?.bottom ?? 0;
}

function inferSpacingMode(spec?: PaddingSpec): SpacingMode {
  if (!spec) return "all";
  if (spec.all != null) return "all";
  const { start, end, top, bottom } = spec;
  const set = [start, end, top, bottom].filter((v) => v != null).length;
  if (start != null && end != null && start === end && top == null && bottom == null) return "horizontal";
  if (top != null && bottom != null && top === bottom && start == null && end == null) return "vertical";
  if (set === 1 && start != null) return "start";
  if (set === 1 && end != null) return "end";
  if (set === 1 && top != null) return "top";
  if (set === 1 && bottom != null) return "bottom";
  if (set > 0) return "sides";
  return "all";
}

function spacingForMode(mode: SpacingMode, spec?: PaddingSpec): PaddingSpec {
  const v = spacingFallback(spec);
  switch (mode) {
    case "all":
      return { all: v };
    case "horizontal":
      return { start: spec?.start ?? v, end: spec?.end ?? spec?.start ?? v };
    case "vertical":
      return { top: spec?.top ?? v, bottom: spec?.bottom ?? spec?.top ?? v };
    case "start":
      return { start: spec?.start ?? v };
    case "end":
      return { end: spec?.end ?? v };
    case "top":
      return { top: spec?.top ?? v };
    case "bottom":
      return { bottom: spec?.bottom ?? v };
    case "sides":
      return {
        start: spec?.start ?? spec?.all ?? 0,
        end: spec?.end ?? spec?.all ?? 0,
        top: spec?.top ?? spec?.all ?? 0,
        bottom: spec?.bottom ?? spec?.all ?? 0,
      };
  }
}

function parseDp(raw: string): number {
  if (raw.trim() === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function SpacingEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: PaddingSpec;
  onChange: (next: PaddingSpec) => void;
}) {
  const mode = inferSpacingMode(value);

  const setMode = (next: SpacingMode) => onChange(spacingForMode(next, value));

  const setSide = (side: keyof PaddingSpec, raw: string) => {
    const n = parseDp(raw);
    if (mode === "all") {
      onChange({ all: n });
      return;
    }
    if (mode === "horizontal") {
      onChange({ start: n, end: n });
      return;
    }
    if (mode === "vertical") {
      onChange({ top: n, bottom: n });
      return;
    }
    if (mode === "sides") {
      onChange({
        start: value?.start ?? 0,
        end: value?.end ?? 0,
        top: value?.top ?? 0,
        bottom: value?.bottom ?? 0,
        [side]: n,
      });
      return;
    }
    onChange({ [side]: n });
  };

  const singleValue =
    mode === "all"
      ? (value?.all ?? 0)
      : mode === "horizontal"
        ? (value?.start ?? 0)
        : mode === "vertical"
          ? (value?.top ?? 0)
          : mode === "start"
            ? (value?.start ?? 0)
            : mode === "end"
              ? (value?.end ?? 0)
              : mode === "top"
                ? (value?.top ?? 0)
                : (value?.bottom ?? 0);

  return (
    <div className="space-y-2 rounded-md border border-border/70 p-2">
      <Field label={label}>
        <Select value={mode} onValueChange={(next) => next && setMode(next as SpacingMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPACING_MODES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {mode === "sides" ? (
        <div className="grid grid-cols-2 gap-2">
          {([
            ["start", "Start"],
            ["end", "End"],
            ["top", "Top"],
            ["bottom", "Bottom"],
          ] as const).map(([side, sideLabel]) => (
            <Field key={side} label={sideLabel}>
              <Input
                type="number"
                min={0}
                value={value?.[side] ?? 0}
                onChange={(e) => setSide(side, e.target.value)}
              />
            </Field>
          ))}
        </div>
      ) : (
        <Field
          label={
            mode === "all"
              ? "All (dp)"
              : mode === "horizontal"
                ? "Horizontal (dp)"
                : mode === "vertical"
                  ? "Vertical (dp)"
                  : `${mode[0]!.toUpperCase()}${mode.slice(1)} (dp)`
          }
        >
          <Input
            type="number"
            min={0}
            value={singleValue}
            onChange={(e) =>
              setSide(
                mode === "all"
                  ? "all"
                  : mode === "horizontal"
                    ? "start"
                    : mode === "vertical"
                      ? "top"
                      : mode,
                e.target.value,
              )
            }
          />
        </Field>
      )}
    </div>
  );
}

export function Inspector() {
  const screen = useDesigner((s) => s.screen);
  const currentScreenId = useDesigner((s) => s.currentScreenId);
  const selectedId = useDesigner((s) => s.selectedId);
  const patchNode = useDesigner((s) => s.patchNode);
  const deleteSelected = useDesigner((s) => s.deleteSelected);
  const duplicateSelected = useDesigner((s) => s.duplicateSelected);
  const createComponentFromSelection = useDesigner((s) => s.createComponentFromSelection);
  const clearSelectedWiring = useDesigner((s) => s.clearSelectedWiring);
  const setActiveModelId = useDesigner((s) => s.setActiveModelId);
  const previewData = useDesigner((s) => s.previewData);
  const root = currentRoot(screen, currentScreenId);
  const node = selectedId ? findNode(root, selectedId) : null;
  const paths = flattenSources(previewData);

  if (!node) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a component to edit Material props, API bindings, touch routes, form validation, and enter motion.
      </div>
    );
  }

  const setProp = (key: string, value: string | number | boolean) => {
    patchNode(node.id, { props: { ...node.props, [key]: value } });
  };

  const setBinding = (key: string, value: string) => {
    const next = { ...node.bindings, [key]: value };
    if (!value) delete next[key];
    patchNode(node.id, { bindings: next });
  };

  const bindable = BINDABLE_PROPS[node.type] ?? bindableComposeProps(node.type).map((item) => ({
    key: item.key,
    label: item.label,
  }));

  return (
    <Tabs defaultValue="props" className="flex h-full min-h-0 flex-col gap-0 overflow-hidden bg-background">
      <div className="shrink-0 border-b px-3 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="truncate text-sm font-semibold">{node.type}</div>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {node.id}
          </Badge>
        </div>
        <div className="mb-2 flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const message = duplicateSelected();
              if (message) toast.message(message);
            }}
          >
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const message = createComponentFromSelection();
              if (message) toast.message(message);
            }}
          >
            Make component
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const message = clearSelectedWiring();
              if (message) toast.message(message);
            }}
          >
            Clear binds
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              const message = deleteSelected();
              if (message) toast.message(message);
            }}
          >
            Remove widget
          </Button>
        </div>
        <TabsList className="w-full">
          <TabsTrigger value="props" className="flex-1">
            Props
          </TabsTrigger>
          <TabsTrigger value="bind" className="flex-1">
            Bind
          </TabsTrigger>
          <TabsTrigger value="action" className="flex-1">
            Touch
          </TabsTrigger>
          <TabsTrigger value="motion" className="flex-1">
            Motion
          </TabsTrigger>
        </TabsList>
      </div>
      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        <TabsContent value="props" className="mt-0 space-y-4 p-3">
          <TypeFields node={node} setProp={setProp} />
          <ContainerAlignmentFields node={node} patchNode={patchNode} />
          <ScopeModifierFields node={node} parent={findParent(root, node.id)} patchNode={patchNode} />
          <NodeApiFields node={node} dataSources={screen.dataSources} patchNode={patchNode} />
          <ComposeLayout node={node} patchNode={patchNode} isContainer={isContainer(node.type)} />
          <DrawableFields node={node} patchNode={patchNode} />
          {node.type === "LazyColumn" ||
          node.type === "LazyRow" ||
          node.type === "LazyVerticalGrid" ||
          node.type === "Column" ||
          node.type === "Row" ? (
            <Field label="Item binding (list path)">
              <Input
                placeholder="news.articles"
                value={node.itemBinding ?? ""}
                onChange={(e) => patchNode(node.id, { itemBinding: e.target.value })}
              />
            </Field>
          ) : null}
          <Field label="Show when">
            <Select
              value={node.visibleWhen ?? "always"}
              onValueChange={(value) => value && patchNode(node.id, { visibleWhen: value as VisibleWhen })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Visible if API path">
            <Input
              list="binding-paths"
              placeholder="news.status or item.title"
              value={node.visibleIf?.path ?? ""}
              onChange={(e) =>
                patchNode(node.id, {
                  visibleIf: e.target.value
                    ? { path: e.target.value, op: node.visibleIf?.op ?? "truthy", value: node.visibleIf?.value }
                    : undefined,
                })
              }
            />
          </Field>
          {node.visibleIf?.path ? (
            <>
              <Field label="Compare">
                <Select
                  value={node.visibleIf.op ?? "truthy"}
                  onValueChange={(value) =>
                    value &&
                    patchNode(node.id, {
                      visibleIf: { ...node.visibleIf!, op: value as VisibleIfOp },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBLE_IF_OPS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {node.visibleIf.op === "equals" || node.visibleIf.op === "notEquals" ? (
                <Field label="Equals value">
                  <Input
                    value={node.visibleIf.value ?? ""}
                    onChange={(e) =>
                      patchNode(node.id, { visibleIf: { ...node.visibleIf!, value: e.target.value } })
                    }
                  />
                </Field>
              ) : null}
            </>
          ) : null}
        </TabsContent>
        <TabsContent value="action" className="mt-0 space-y-4 p-3">
          <p className="text-xs leading-5 text-muted-foreground">
            Wire gestures to screens the way Figma prototypes do. Tap, double-tap, long-press, and swipes publish into the native runtime.
          </p>
          {interactionsOf(node).map((item, index) => (
            <InteractionEditor
              key={`${item.event}-${index}`}
              item={item}
              screens={screen.screens}
              dataSources={screen.dataSources}
              onChange={(nextItem) => {
                const list = [...interactionsOf(node)];
                list[index] = nextItem;
                const tap = list.find((row) => row.event === "tap")?.action;
                patchNode(node.id, { interactions: list, onClick: tap ?? { type: "none" } });
              }}
              onRemove={() => {
                const list = interactionsOf(node).filter((_, i) => i !== index);
                const tap = list.find((row) => row.event === "tap")?.action;
                patchNode(node.id, { interactions: list, onClick: tap ?? { type: "none" } });
              }}
            />
          ))}
          <button
            type="button"
            className="text-xs font-medium text-primary"
            onClick={() => {
              const list: Interaction[] = [...interactionsOf(node), { event: "tap", action: { type: "none" } }];
              patchNode(node.id, { interactions: list });
            }}
          >
            + Add gesture
          </button>
          {node.type === "TextField" ? (
            <>
              <Field label="Form id">
                <Input
                  value={node.formField?.formId ?? ""}
                  onChange={(e) =>
                    patchNode(node.id, {
                      formField: node.formField ? { ...node.formField, formId: e.target.value } : { formId: e.target.value, name: "query" },
                    })
                  }
                />
              </Field>
              <Field label="Field name">
                <Input
                  value={node.formField?.name ?? ""}
                  onChange={(e) =>
                    patchNode(node.id, {
                      formField: {
                        formId: node.formField?.formId || "search",
                        name: e.target.value,
                        validation: node.formField?.validation,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Required">
                <Switch
                  checked={Boolean(node.formField?.validation?.required)}
                  onCheckedChange={(checked) =>
                    patchNode(node.id, {
                      formField: {
                        formId: node.formField?.formId || "search",
                        name: node.formField?.name || "query",
                        validation: {
                          message: node.formField?.validation?.message || "This field is required.",
                          minLength: node.formField?.validation?.minLength,
                          required: Boolean(checked),
                        },
                      },
                    })
                  }
                />
              </Field>
              <Field label="Min length">
                <Input
                  type="number"
                  value={node.formField?.validation?.minLength ?? 0}
                  onChange={(e) =>
                    patchNode(node.id, {
                      formField: {
                        formId: node.formField?.formId || "search",
                        name: node.formField?.name || "query",
                        validation: {
                          required: node.formField?.validation?.required,
                          message: node.formField?.validation?.message || "Enter a longer value.",
                          minLength: Number(e.target.value),
                        },
                      },
                    })
                  }
                />
              </Field>
            </>
          ) : null}
        </TabsContent>
        <TabsContent value="bind" className="mt-0 space-y-4 p-3">
          {(screen.dataModels ?? []).length ? (
            <Field label="Kotlin data model">
              <Select
                value={screen.activeModelId ?? "none"}
                onValueChange={(value) => setActiveModelId(value === "none" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Response JSON</SelectItem>
                  {(screen.dataModels ?? []).map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          {bindable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This component has no bindable properties. Use a list binding on LazyColumn to repeat children over an API array.
            </p>
          ) : (
            bindable.map((field) => (
              <Field key={field.key} label={`${field.label} path`}>
                <Input
                  list="binding-paths"
                  placeholder="news.articles.0.title or item.title"
                  value={field.key === "itemBinding" ? (node.itemBinding ?? "") : (node.bindings?.[field.key] ?? "")}
                  onChange={(e) => {
                    if (field.key === "itemBinding") patchNode(node.id, { itemBinding: e.target.value });
                    else setBinding(field.key, e.target.value);
                  }}
                />
              </Field>
            ))
          )}
          <ModelBrowser
            data={previewData}
            nodeType={node.type}
            bindings={node.bindings}
            itemBinding={node.itemBinding}
            modelFieldsExtra={
              (screen.dataModels ?? []).find((item) => item.id === screen.activeModelId)
                ? bindPathsForModel(
                    (screen.dataModels ?? []).find((item) => item.id === screen.activeModelId)!,
                  )
                : []
            }
            onPick={(path, key) => {
              if (key === "itemBinding") {
                patchNode(node.id, { itemBinding: path });
              } else {
                setBinding(key, path);
              }
              toast.success(`Bound ${key} → ${path}`);
            }}
          />
          <datalist id="binding-paths">
            {paths.map((path) => (
              <option key={path} value={path} />
            ))}
            <option value="item.title" />
            <option value="item.description" />
            <option value="item.image" />
            <option value="item.accent" />
            <option value="item.url" />
          </datalist>
          <p className="text-xs leading-5 text-muted-foreground">
            Click a field from the live/mock JSON to bind it. Compose properties sit next to network paths so you can map <code>Text(text)</code> to <code>item.title</code> without guessing.
          </p>
        </TabsContent>
        <TabsContent value="motion" className="mt-0 space-y-4 p-3">
          <Field label="Enter animation">
            <Select
              value={node.animation?.type ?? "none"}
              onValueChange={(value) => {
                if (!value) return;
                patchNode(node.id, {
                  animation: {
                    ...node.animation,
                    type: value as EnterAnimationType,
                    durationMs: node.animation?.durationMs ?? 280,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs: node.animation?.staggerMs ?? 40,
                  },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANIMATIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={`Duration ${node.animation?.durationMs ?? 280}ms`}>
            <Slider
              min={80}
              max={2000}
              step={20}
              value={[node.animation?.durationMs ?? 280]}
              onValueChange={(value) => {
                const durationMs = sliderNumber(value);
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "fade",
                    durationMs,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs: node.animation?.staggerMs ?? 40,
                  },
                });
              }}
            />
          </Field>
          <Field label={`Delay ${node.animation?.delayMs ?? 0}ms`}>
            <Slider
              min={0}
              max={600}
              step={20}
              value={[node.animation?.delayMs ?? 0]}
              onValueChange={(value) => {
                const delayMs = sliderNumber(value);
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "fade",
                    durationMs: node.animation?.durationMs ?? 280,
                    delayMs,
                    staggerMs: node.animation?.staggerMs ?? 40,
                  },
                });
              }}
            />
          </Field>
          <Field label={`List stagger ${node.animation?.staggerMs ?? 0}ms`}>
            <Slider
              min={0}
              max={160}
              step={10}
              value={[node.animation?.staggerMs ?? 0]}
              onValueChange={(value) => {
                const staggerMs = sliderNumber(value);
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "slideUp",
                    durationMs: node.animation?.durationMs ?? 280,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs,
                    easing: node.animation?.easing,
                    repeat: node.animation?.repeat,
                    colorFrom: node.animation?.colorFrom,
                    colorTo: node.animation?.colorTo,
                    moveXDp: node.animation?.moveXDp,
                    moveYDp: node.animation?.moveYDp,
                  },
                });
              }}
            />
          </Field>
          <Field label="Easing">
            <Select
              value={node.animation?.easing ?? "standard"}
              onValueChange={(value) =>
                value &&
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "fade",
                    durationMs: node.animation?.durationMs ?? 280,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs: node.animation?.staggerMs ?? 40,
                    easing: value as AnimationEasing,
                    repeat: node.animation?.repeat,
                    colorFrom: node.animation?.colorFrom,
                    colorTo: node.animation?.colorTo,
                    moveXDp: node.animation?.moveXDp,
                    moveYDp: node.animation?.moveYDp,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EASINGS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Repeat">
            <Select
              value={node.animation?.repeat ?? "none"}
              onValueChange={(value) =>
                value &&
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "colorPulse",
                    durationMs: node.animation?.durationMs ?? 280,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs: node.animation?.staggerMs ?? 40,
                    easing: node.animation?.easing,
                    repeat: value as AnimationRepeat,
                    colorFrom: node.animation?.colorFrom,
                    colorTo: node.animation?.colorTo,
                    moveXDp: node.animation?.moveXDp,
                    moveYDp: node.animation?.moveYDp,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPEATS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Color pulse from">
            <Input
              value={node.animation?.colorFrom ?? ""}
              placeholder="#FFFFFF"
              onChange={(e) =>
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "colorPulse",
                    durationMs: node.animation?.durationMs ?? 900,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs: node.animation?.staggerMs ?? 0,
                    easing: node.animation?.easing,
                    repeat: node.animation?.repeat ?? "infinite",
                    colorFrom: e.target.value,
                    colorTo: node.animation?.colorTo,
                    moveXDp: node.animation?.moveXDp,
                    moveYDp: node.animation?.moveYDp,
                  },
                })
              }
            />
          </Field>
          <Field label="Color pulse to">
            <Input
              value={node.animation?.colorTo ?? ""}
              placeholder="#E8DEF8"
              onChange={(e) =>
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "colorPulse",
                    durationMs: node.animation?.durationMs ?? 900,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs: node.animation?.staggerMs ?? 0,
                    easing: node.animation?.easing,
                    repeat: node.animation?.repeat ?? "infinite",
                    colorFrom: node.animation?.colorFrom,
                    colorTo: e.target.value,
                    moveXDp: node.animation?.moveXDp,
                    moveYDp: node.animation?.moveYDp,
                  },
                })
              }
            />
          </Field>
          <Field label="Card / slide offset X">
            <Input
              type="number"
              value={node.animation?.moveXDp ?? 36}
              onChange={(e) =>
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "cardSlide",
                    durationMs: node.animation?.durationMs ?? 420,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs: node.animation?.staggerMs ?? 40,
                    easing: "bounce",
                    repeat: node.animation?.repeat,
                    moveXDp: Number(e.target.value),
                    moveYDp: node.animation?.moveYDp,
                    colorFrom: node.animation?.colorFrom,
                    colorTo: node.animation?.colorTo,
                  },
                })
              }
            />
          </Field>
          <Field label="Card / slide offset Y">
            <Input
              type="number"
              value={node.animation?.moveYDp ?? 12}
              onChange={(e) =>
                patchNode(node.id, {
                  animation: {
                    type: node.animation?.type ?? "cardSlide",
                    durationMs: node.animation?.durationMs ?? 420,
                    delayMs: node.animation?.delayMs ?? 0,
                    staggerMs: node.animation?.staggerMs ?? 40,
                    easing: "bounce",
                    repeat: node.animation?.repeat,
                    moveXDp: node.animation?.moveXDp,
                    moveYDp: Number(e.target.value),
                    colorFrom: node.animation?.colorFrom,
                    colorTo: node.animation?.colorTo,
                  },
                })
              }
            />
          </Field>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border p-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function ColorInput({
  value,
  onChange,
  placeholder = "#6750A4",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : /^#[0-9a-f]{3}$/i.test(value) ? value : placeholder;
  const normalized = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  return (
    <div className="flex gap-2">
      <input
        type="color"
        aria-label="Pick color"
        className="h-9 w-10 shrink-0 cursor-pointer rounded border bg-transparent p-1"
        value={normalized}
        onChange={(e) => onChange(e.target.value)}
      />
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextChromeFields({
  node,
  setProp,
  contentKey = "label",
  contentLabel = "Text",
  showContent = true,
}: {
  node: UiNode;
  setProp: (key: string, value: string | number | boolean) => void;
  contentKey?: string;
  contentLabel?: string;
  showContent?: boolean;
}) {
  return (
    <Section title="Text">
      {showContent ? (
        <Field label={contentLabel}>
          <Input value={String(node.props[contentKey] ?? "")} onChange={(e) => setProp(contentKey, e.target.value)} />
        </Field>
      ) : null}
      <Field label="Typography">
        <Select
          value={String(node.props.style ?? defaultTypeScale(node.type))}
          onValueChange={(v) => v && setProp("style", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_STYLES.map((style) => (
              <SelectItem key={style} value={style}>
                {style}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Text color token">
        <Select
          value={String(node.props.color ?? defaultTextToken(node.type))}
          onValueChange={(v) => v && setProp("color", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Text color hex">
        <ColorInput
          value={String(node.props.colorHex ?? "")}
          placeholder="#FFFFFF"
          onChange={(value) => setProp("colorHex", value)}
        />
      </Field>
      <Field label="Align">
        <Select value={textAlignValue(node)} onValueChange={(v) => v && setProp("textAlign", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">start</SelectItem>
            <SelectItem value="center">center</SelectItem>
            <SelectItem value="end">end</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Weight">
        <Select value={String(node.props.weight ?? "400")} onValueChange={(v) => v && setProp("weight", Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="400">400</SelectItem>
            <SelectItem value="500">500</SelectItem>
            <SelectItem value="700">700</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Font size dp">
        <Input
          type="number"
          placeholder="from role"
          value={node.props.fontSizeDp == null ? "" : String(node.props.fontSizeDp)}
          onChange={(e) => setProp("fontSizeDp", e.target.value === "" ? 0 : Number(e.target.value))}
        />
      </Field>
      <Field label="Max lines">
        <Input
          type="number"
          value={Number(node.props.maxLines ?? 0)}
          onChange={(e) => setProp("maxLines", Number(e.target.value))}
        />
      </Field>
      <Field label="Overflow">
        <Select value={String(node.props.overflow ?? "clip")} onValueChange={(v) => v && setProp("overflow", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clip">clip</SelectItem>
            <SelectItem value="ellipsis">ellipsis</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </Section>
  );
}

function ButtonChromeFields({
  node,
  setProp,
}: {
  node: UiNode;
  setProp: (key: string, value: string | number | boolean) => void;
}) {
  return (
    <Section title={node.type === "Chip" ? "Chip" : "Button"}>
      <Field label="Enabled">
        <Switch checked={node.props.enabled !== false} onCheckedChange={(checked) => setProp("enabled", Boolean(checked))} />
      </Field>
      <Field label="Leading icon">
        <Select
          value={String(node.props.icon ?? "none")}
          onValueChange={(v) => v && setProp("icon", v === "none" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">none</SelectItem>
            {ICONS.map((icon) => (
              <SelectItem key={icon} value={icon}>
                {icon}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {node.type === "FilledButton" || node.type === "TonalButton" || node.type === "ElevatedButton" ? (
        <Field label="Container color token">
          <Select
            value={String(
              node.props.containerColorToken ??
                (node.type === "TonalButton"
                  ? "secondaryContainer"
                  : node.type === "ElevatedButton"
                    ? "surfaceContainer"
                    : "primary"),
            )}
            onValueChange={(v) => v && setProp("containerColorToken", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      <Field label="Content color token">
        <Select
          value={String(
            node.props.contentColorToken ??
              (node.type === "FilledButton"
                ? "onPrimary"
                : node.type === "TonalButton"
                  ? "onSecondaryContainer"
                  : "primary"),
          )}
          onValueChange={(v) => v && setProp("contentColorToken", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {node.type === "Chip" ? (
        <>
          <Field label="Chip variant">
            <Select
              value={String(node.props.chipVariant ?? "assist")}
              onValueChange={(v) => v && setProp("chipVariant", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assist">Assist</SelectItem>
                <SelectItem value="filter">Filter</SelectItem>
                <SelectItem value="input">Input</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {(node.props.chipVariant === "filter" || node.props.chipVariant === "input") && (
            <Field label="Selected">
              <Switch
                checked={Boolean(node.props.selected)}
                onCheckedChange={(checked) => setProp("selected", Boolean(checked))}
              />
            </Field>
          )}
        </>
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">
        Container fill, gradient, and image live in Drawable. Shape, size, elevation, and padding are Compose modifiers.
      </p>
    </Section>
  );
}

function TypeFields({
  node,
  setProp,
}: {
  node: UiNode;
  setProp: (key: string, value: string | number | boolean) => void;
}) {
  if (node.type === "Text") {
    return (
      <>
        <TextChromeFields node={node} setProp={setProp} contentKey="text" contentLabel="Text" />
        <Section title="Text (Compose)">
          <Field label="Soft wrap">
            <Switch
              checked={node.props.softWrap !== false}
              onCheckedChange={(checked) => setProp("softWrap", Boolean(checked))}
            />
          </Field>
          <Field label="Letter spacing">
            <Input
              type="number"
              step={0.1}
              value={node.props.letterSpacing == null ? "" : String(node.props.letterSpacing)}
              onChange={(e) => setProp("letterSpacing", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </Field>
          <Field label="Line height dp">
            <Input
              type="number"
              value={node.props.lineHeightDp == null ? "" : String(node.props.lineHeightDp)}
              onChange={(e) => setProp("lineHeightDp", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </Field>
        </Section>
      </>
    );
  }

  if (isButtonType(node.type)) {
    return (
      <>
        <TextChromeFields node={node} setProp={setProp} contentKey="label" contentLabel="Label" />
        <ButtonChromeFields node={node} setProp={setProp} />
        <Section title="Button (Material3)">
          <Field label="Content description">
            <Input
              value={String(node.props.contentDescription ?? "")}
              onChange={(e) => setProp("contentDescription", e.target.value)}
            />
          </Field>
        </Section>
      </>
    );
  }

  if (node.type === "TopAppBar") {
    return (
      <>
        <TextChromeFields node={node} setProp={setProp} contentKey="title" contentLabel="Title" />
        <Section title="TopAppBar">
          <Field label="Navigation icon">
            <Select
              value={String(node.props.navigationIcon ?? "menu")}
              onValueChange={(v) => v && setProp("navigationIcon", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                {ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Action icon">
            <Select
              value={String(node.props.actionIcon ?? "notifications")}
              onValueChange={(v) => v && setProp("actionIcon", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                {ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Style">
            <Select value={String(node.props.barStyle ?? "small")} onValueChange={(v) => v && setProp("barStyle", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="center">CenterAligned</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {(node.props.barStyle === "medium" || node.props.barStyle === "large") && (
            <Field label="Scroll behavior">
              <Select
                value={String(node.props.scrollBehavior ?? "pinned")}
                onValueChange={(v) => v && setProp("scrollBehavior", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pinned">Pinned</SelectItem>
                  <SelectItem value="enterAlways">EnterAlways</SelectItem>
                  <SelectItem value="exitUntilCollapsed">ExitUntilCollapsed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </Section>
      </>
    );
  }

  if (node.type === "TextField") {
    return (
      <>
        <Section title="TextField (Material3)">
          <Field label="Label">
            <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
          </Field>
          <Field label="Placeholder">
            <Input
              value={String(node.props.placeholder ?? "")}
              onChange={(e) => setProp("placeholder", e.target.value)}
            />
          </Field>
          <Field label="Value">
            <Input value={String(node.props.value ?? "")} onChange={(e) => setProp("value", e.target.value)} />
          </Field>
          <Field label="Supporting text">
            <Input
              value={String(node.props.supportingText ?? "")}
              onChange={(e) => setProp("supportingText", e.target.value)}
            />
          </Field>
          <Field label="Variant">
            <Select value={String(node.props.variant ?? "outlined")} onValueChange={(v) => v && setProp("variant", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outlined">Outlined</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Single line">
            <Switch
              checked={node.props.singleLine !== false}
              onCheckedChange={(checked) => setProp("singleLine", Boolean(checked))}
            />
          </Field>
          <Field label="Max lines">
            <Input
              type="number"
              value={Number(node.props.maxLines ?? 1)}
              onChange={(e) => setProp("maxLines", Number(e.target.value))}
            />
          </Field>
          <Field label="Enabled">
            <Switch
              checked={node.props.enabled !== false}
              onCheckedChange={(checked) => setProp("enabled", Boolean(checked))}
            />
          </Field>
          <Field label="Read only">
            <Switch
              checked={Boolean(node.props.readOnly)}
              onCheckedChange={(checked) => setProp("readOnly", Boolean(checked))}
            />
          </Field>
          <Field label="Is error">
            <Switch
              checked={Boolean(node.props.isError)}
              onCheckedChange={(checked) => setProp("isError", Boolean(checked))}
            />
          </Field>
          <Field label="Leading icon">
            <Select
              value={String(node.props.leadingIcon ?? "none")}
              onValueChange={(v) => v && setProp("leadingIcon", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                {ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Trailing icon">
            <Select
              value={String(node.props.trailingIcon ?? "none")}
              onValueChange={(v) => v && setProp("trailingIcon", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                {ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Label color token">
            <Select
              value={String(node.props.labelColor ?? "onSurfaceVariant")}
              onValueChange={(v) => v && setProp("labelColor", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>
        <TextChromeFields node={node} setProp={setProp} showContent={false} />
      </>
    );
  }

  if (node.type === "ListItem") {
    return (
      <>
        <TextChromeFields node={node} setProp={setProp} contentKey="headline" contentLabel="Headline" />
        <Section title="ListItem">
          <Field label="Supporting">
            <Input
              value={String(node.props.supporting ?? "")}
              onChange={(e) => setProp("supporting", e.target.value)}
            />
          </Field>
          <Field label="Overline">
            <Input value={String(node.props.overline ?? "")} onChange={(e) => setProp("overline", e.target.value)} />
          </Field>
          <Field label="Leading icon">
            <Select
              value={String(node.props.leadingIcon ?? "star")}
              onValueChange={(v) => v && setProp("leadingIcon", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                {ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Trailing icon">
            <Select
              value={String(node.props.trailingIcon ?? "none")}
              onValueChange={(v) => v && setProp("trailingIcon", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                {ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>
      </>
    );
  }

  if (node.type === "Icon" || node.type === "FAB" || node.type === "IconButton" || node.type === "NavigationBarItem" || node.type === "NavigationRailItem") {
    return (
      <>
        <Section title={node.type}>
          {node.type === "NavigationBarItem" || node.type === "NavigationRailItem" ? (
            <Field label="Label">
              <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
            </Field>
          ) : null}
          {node.type !== "Icon" ? (
            <Field label="Icon">
              <Select
                value={String(node.props.name ?? node.props.icon ?? "star")}
                onValueChange={(v) => v && setProp(node.type === "Icon" ? "name" : "icon", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <Field label="Icon">
              <Select
                value={String(node.props.name ?? node.props.icon ?? "star")}
                onValueChange={(v) => v && setProp("name", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {node.type === "Icon" ? (
            <>
              <Field label="Size dp">
                <Input
                  type="number"
                  value={Number(node.props.size ?? 24)}
                  onChange={(e) => setProp("size", Number(e.target.value))}
                />
              </Field>
              <Field label="Tint token">
                <Select
                  value={String(node.props.color ?? "onSurface")}
                  onValueChange={(v) => v && setProp("color", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Custom icon from device">
                <AssetUpload
                  kind="icon"
                  currentUrl={String(node.props.url ?? "")}
                  onPicked={(url) => setProp("url", url)}
                />
              </Field>
            </>
          ) : null}
          {node.type === "FAB" ? (
            <>
              <Field label="Size">
                <Select value={String(node.props.fabSize ?? "default")} onValueChange={(v) => v && setProp("fabSize", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extended">Extended</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Extended label">
                <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
              </Field>
              <Field label="Content description">
                <Input
                  value={String(node.props.contentDescription ?? "")}
                  onChange={(e) => setProp("contentDescription", e.target.value)}
                />
              </Field>
            </>
          ) : null}
          {node.type === "IconButton" ? (
            <>
              <Field label="Variant">
                <Select
                  value={String(node.props.iconButtonVariant ?? "standard")}
                  onValueChange={(v) => v && setProp("iconButtonVariant", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                    <SelectItem value="filledTonal">Filled tonal</SelectItem>
                    <SelectItem value="outlined">Outlined</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Size">
                <Select
                  value={String(node.props.iconButtonSize ?? "default")}
                  onValueChange={(v) => v && setProp("iconButtonSize", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Enabled">
                <Switch
                  checked={node.props.enabled !== false}
                  onCheckedChange={(checked) => setProp("enabled", Boolean(checked))}
                />
              </Field>
              <Field label="Content description">
                <Input
                  value={String(node.props.contentDescription ?? "")}
                  onChange={(e) => setProp("contentDescription", e.target.value)}
                />
              </Field>
            </>
          ) : null}
          {(node.type === "NavigationBarItem" || node.type === "NavigationRailItem") ? (
            <Field label="Selected">
              <Switch
                checked={Boolean(node.props.selected)}
                onCheckedChange={(checked) => setProp("selected", Boolean(checked))}
              />
            </Field>
          ) : null}
        </Section>
      </>
    );
  }

  if (node.type === "Slider") {
    return (
      <Section title="Slider (Material3)">
        <Field label="Value (0–1)">
          <Input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={Number(node.props.value ?? 0.5)}
            onChange={(e) => setProp("value", Number(e.target.value))}
          />
        </Field>
        <Field label="Min">
          <Input
            type="number"
            value={Number(node.props.valueMin ?? 0)}
            onChange={(e) => setProp("valueMin", Number(e.target.value))}
          />
        </Field>
        <Field label="Max">
          <Input
            type="number"
            value={Number(node.props.valueMax ?? 100)}
            onChange={(e) => setProp("valueMax", Number(e.target.value))}
          />
        </Field>
        <Field label="Enabled">
          <Switch
            checked={node.props.enabled !== false}
            onCheckedChange={(checked) => setProp("enabled", Boolean(checked))}
          />
        </Field>
      </Section>
    );
  }

  if (node.type === "RadioButton") {
    return (
      <Section title="RadioButton">
        <Field label="Label">
          <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
        </Field>
        <Field label="Selected">
          <Switch
            checked={Boolean(node.props.selected)}
            onCheckedChange={(checked) => setProp("selected", Boolean(checked))}
          />
        </Field>
        <Field label="Enabled">
          <Switch
            checked={node.props.enabled !== false}
            onCheckedChange={(checked) => setProp("enabled", Boolean(checked))}
          />
        </Field>
      </Section>
    );
  }

  if (node.type === "Switch" || node.type === "Checkbox") {
    return (
      <>
        <TextChromeFields node={node} setProp={setProp} contentKey="label" contentLabel="Label" />
        <Section title={node.type}>
          <Field label="Checked">
            <Switch
              checked={Boolean(node.props.checked)}
              onCheckedChange={(checked) => setProp("checked", Boolean(checked))}
            />
          </Field>
          <Field label="Enabled">
            <Switch
              checked={node.props.enabled !== false}
              onCheckedChange={(checked) => setProp("enabled", Boolean(checked))}
            />
          </Field>
        </Section>
      </>
    );
  }

  if (node.type === "Card") {
    return (
      <Section title="Card">
        <Field label="Variant">
          <Select value={String(node.props.variant ?? "elevated")} onValueChange={(v) => v && setProp("variant", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elevated">elevated</SelectItem>
              <SelectItem value="outlined">outlined</SelectItem>
              <SelectItem value="filled">filled</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Enabled">
          <Switch
            checked={node.props.enabled !== false}
            onCheckedChange={(checked) => setProp("enabled", Boolean(checked))}
          />
        </Field>
      </Section>
    );
  }

  if (node.type === "Image") {
    return (
      <Section title="Image (Compose)">
        <Field label="Placeholder (device upload)">
          <AssetUpload kind="image" currentUrl={String(node.props.url ?? "")} onPicked={(url) => setProp("url", url)} />
        </Field>
        <Field label="URL">
          <Input value={String(node.props.url ?? "")} onChange={(e) => setProp("url", e.target.value)} />
        </Field>
        <Field label="Content description / alt">
          <Input value={String(node.props.alt ?? "")} onChange={(e) => setProp("alt", e.target.value)} />
        </Field>
        <Field label="Accent (placeholder)">
          <ColorInput
            value={String(node.props.accent ?? "#6750A4")}
            onChange={(value) => setProp("accent", value)}
          />
        </Field>
        <Field label="Content scale">
          <Select value={String(node.props.contentScale ?? "crop")} onValueChange={(v) => v && setProp("contentScale", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crop">Crop</SelectItem>
              <SelectItem value="fit">Fit</SelectItem>
              <SelectItem value="fillBounds">FillBounds</SelectItem>
              <SelectItem value="inside">Inside</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Alpha">
          <Input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={node.props.imageAlpha == null ? "" : String(node.props.imageAlpha)}
            onChange={(e) => setProp("imageAlpha", e.target.value === "" ? 1 : Number(e.target.value))}
          />
        </Field>
      </Section>
    );
  }

  if (node.type === "Surface") {
    return (
      <Section title="Surface">
        <Field label="Tonal elevation">
          <Input
            type="number"
            min={0}
            max={5}
            value={Number(node.props.tonalElevation ?? 1)}
            onChange={(e) => setProp("tonalElevation", Number(e.target.value))}
          />
        </Field>
      </Section>
    );
  }

  if (node.type === "HorizontalPager") {
    return (
      <Section title="HorizontalPager">
        <Field label="Current page">
          <Input
            type="number"
            min={0}
            value={Number(node.props.currentPage ?? 0)}
            onChange={(e) => setProp("currentPage", Number(e.target.value))}
          />
        </Field>
      </Section>
    );
  }

  if (node.type === "Tab" || node.type === "SegmentedButtonItem" || node.type === "DropdownMenuItem") {
    return (
      <Section title={node.type}>
        <Field label="Label">
          <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
        </Field>
        {(node.type === "Tab" || node.type === "SegmentedButtonItem") && (
          <Field label="Selected">
            <Switch
              checked={Boolean(node.props.selected)}
              onCheckedChange={(checked) => setProp("selected", Boolean(checked))}
            />
          </Field>
        )}
      </Section>
    );
  }

  if (node.type === "NavigationDrawer" || node.type === "BottomSheet" || node.type === "DropdownMenu") {
    return (
      <Section title={node.type}>
        <Field label={node.type === "DropdownMenu" ? "Trigger label" : "Title"}>
          <Input
            value={String(node.props.title ?? node.props.label ?? "")}
            onChange={(e) => setProp(node.type === "DropdownMenu" ? "label" : "title", e.target.value)}
          />
        </Field>
      </Section>
    );
  }

  if (node.type === "ExposedDropdownMenu") {
    return (
      <Section title="ExposedDropdownMenu">
        <Field label="Label">
          <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
        </Field>
        <Field label="Selected value">
          <Input value={String(node.props.value ?? "")} onChange={(e) => setProp("value", e.target.value)} />
        </Field>
        <Field label="Expanded (preview)">
          <Switch
            checked={node.props.expanded !== false}
            onCheckedChange={(checked) => setProp("expanded", Boolean(checked))}
          />
        </Field>
        <Field label="Enabled">
          <Switch
            checked={node.props.enabled !== false}
            onCheckedChange={(checked) => setProp("enabled", Boolean(checked))}
          />
        </Field>
        <p className="text-xs text-muted-foreground">Add DropdownMenuItem children for options.</p>
      </Section>
    );
  }

  if (node.type === "PullRefresh") {
    return (
      <Section title="PullRefresh">
        <Field label="Refreshing">
          <Switch
            checked={Boolean(node.props.refreshing)}
            onCheckedChange={(checked) => setProp("refreshing", Boolean(checked))}
          />
        </Field>
        <p className="text-xs text-muted-foreground">Wrap scrollable content (e.g. LazyColumn) as children.</p>
      </Section>
    );
  }

  if (node.type === "SearchBar") {
    return (
      <Section title="SearchBar">
        <Field label="Query">
          <Input value={String(node.props.query ?? "")} onChange={(e) => setProp("query", e.target.value)} />
        </Field>
        <Field label="Placeholder">
          <Input value={String(node.props.placeholder ?? "")} onChange={(e) => setProp("placeholder", e.target.value)} />
        </Field>
        <Field label="Active">
          <Switch checked={Boolean(node.props.active)} onCheckedChange={(checked) => setProp("active", Boolean(checked))} />
        </Field>
      </Section>
    );
  }

  if (node.type === "DatePicker") {
    return (
      <Section title="DatePicker">
        <Field label="Date (ISO)">
          <Input value={String(node.props.date ?? "")} onChange={(e) => setProp("date", e.target.value)} />
        </Field>
        <Field label="Enabled">
          <Switch checked={node.props.enabled !== false} onCheckedChange={(checked) => setProp("enabled", Boolean(checked))} />
        </Field>
      </Section>
    );
  }

  if (node.type === "TimePicker") {
    return (
      <Section title="TimePicker">
        <Field label="Time (HH:mm)">
          <Input value={String(node.props.time ?? "")} onChange={(e) => setProp("time", e.target.value)} />
        </Field>
        <Field label="Enabled">
          <Switch checked={node.props.enabled !== false} onCheckedChange={(checked) => setProp("enabled", Boolean(checked))} />
        </Field>
      </Section>
    );
  }

  if (node.type === "Dialog") {
    return (
      <Section title="AlertDialog">
        <Field label="Title">
          <Input value={String(node.props.title ?? "")} onChange={(e) => setProp("title", e.target.value)} />
        </Field>
        <Field label="Message">
          <Input value={String(node.props.message ?? "")} onChange={(e) => setProp("message", e.target.value)} />
        </Field>
        <Field label="Confirm label">
          <Input value={String(node.props.confirmLabel ?? "OK")} onChange={(e) => setProp("confirmLabel", e.target.value)} />
        </Field>
        <Field label="Dismiss label">
          <Input value={String(node.props.dismissLabel ?? "Cancel")} onChange={(e) => setProp("dismissLabel", e.target.value)} />
        </Field>
      </Section>
    );
  }

  if (node.type === "Snackbar") {
    return (
      <Section title="Snackbar">
        <Field label="Message">
          <Input value={String(node.props.message ?? "")} onChange={(e) => setProp("message", e.target.value)} />
        </Field>
        <Field label="Action label">
          <Input value={String(node.props.actionLabel ?? "")} onChange={(e) => setProp("actionLabel", e.target.value)} />
        </Field>
      </Section>
    );
  }

  if (node.type === "Badge") {
    return (
      <Section title="Badge">
        <Field label="Count">
          <Input
            type="number"
            min={0}
            value={Number(node.props.count ?? 0)}
            onChange={(e) => setProp("count", Number(e.target.value))}
          />
        </Field>
        <Field label="Label (optional)">
          <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
        </Field>
      </Section>
    );
  }

  if (node.type === "Tooltip") {
    return (
      <Section title="Tooltip">
        <Field label="Text">
          <Input value={String(node.props.text ?? "")} onChange={(e) => setProp("text", e.target.value)} />
        </Field>
      </Section>
    );
  }

  if (node.type === "LinearProgressIndicator") {
    return (
      <Section title="LinearProgressIndicator">
        <Field label="Indeterminate">
          <Switch
            checked={Boolean(node.props.indeterminate)}
            onCheckedChange={(checked) => setProp("indeterminate", Boolean(checked))}
          />
        </Field>
        {!node.props.indeterminate ? (
          <Field label="Progress (0–1)">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={Number(node.props.progress ?? 0.65)}
              onChange={(e) => setProp("progress", Number(e.target.value))}
            />
          </Field>
        ) : null}
        <Field label="Color token">
          <Select value={String(node.props.color ?? "primary")} onValueChange={(v) => v && setProp("color", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>
    );
  }

  if (node.type === "Column" || node.type === "Row" || node.type === "LazyColumn" || node.type === "LazyRow" || node.type === "LazyVerticalGrid" || node.type === "Box") {
    return null;
  }

  if (node.type === "Spacer") {
    return (
      <Section title="Spacer">
        <Field label="Height dp">
          <Input
            type="number"
            value={Number(node.props.height ?? 16)}
            onChange={(e) => setProp("height", Number(e.target.value))}
          />
        </Field>
        <Field label="Width dp">
          <Input
            type="number"
            value={node.props.width == null ? "" : String(node.props.width)}
            onChange={(e) => setProp("width", e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </Field>
      </Section>
    );
  }

  if (node.type === "CircularProgress") {
    return (
      <Section title="CircularProgressIndicator">
        <Field label="Size dp">
          <Input
            type="number"
            value={Number(node.props.size ?? 40)}
            onChange={(e) => setProp("size", Number(e.target.value))}
          />
        </Field>
        <Field label="Stroke width dp">
          <Input
            type="number"
            value={Number(node.props.strokeWidthDp ?? 4)}
            onChange={(e) => setProp("strokeWidthDp", Number(e.target.value))}
          />
        </Field>
        <Field label="Color token">
          <Select value={String(node.props.color ?? "primary")} onValueChange={(v) => v && setProp("color", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>
    );
  }

  if (node.type === "Divider") {
    return (
      <Section title="HorizontalDivider">
        <Field label="Thickness dp">
          <Input
            type="number"
            value={Number(node.props.thicknessDp ?? 1)}
            onChange={(e) => setProp("thicknessDp", Number(e.target.value))}
          />
        </Field>
        <Field label="Color token">
          <Select value={String(node.props.color ?? "outline")} onValueChange={(v) => v && setProp("color", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>
    );
  }

  if (node.type === "NavigationBar") {
    return (
      <Section title="NavigationBar">
        <p className="text-xs text-muted-foreground">
          Add NavigationBarItem children. Each item has label, icon, and selected state.
        </p>
      </Section>
    );
  }

  if (node.type === "Scaffold") {
    return (
      <Section title="Scaffold">
        <p className="text-xs text-muted-foreground">
          Slots: topBar, rail, content, bottomBar, fab. Drop widgets into each slot on the canvas.
        </p>
      </Section>
    );
  }

  if (isLabelType(node.type)) {
    return <TextChromeFields node={node} setProp={setProp} />;
  }

  return (
    <p className="text-sm text-muted-foreground">
      Select a Material / Compose widget to edit its Attributes — matching Android Studio style properties.
    </p>
  );
}


function InteractionEditor({
  item,
  screens,
  dataSources,
  onChange,
  onRemove,
}: {
  item: Interaction;
  screens: { id: string; name: string; route: string }[];
  dataSources: { id: string }[];
  onChange: (item: Interaction) => void;
  onRemove: () => void;
}) {
  const action = item.action;
  return (
    <div className="space-y-2 rounded-lg border p-2">
      <div className="flex gap-2">
        <Select
          value={item.event}
          onValueChange={(value) => value && onChange({ ...item, event: value as TouchEvent })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOUCH_EVENTS.map((event) => (
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={action.type}
          onValueChange={(value) => value && onChange({ ...item, action: { ...action, type: value as ActionType } })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="icon-sm" variant="ghost" onClick={onRemove}>
          ×
        </Button>
      </div>
      {action.type === "focusNode" ? (
        <Input
          className="h-8"
          placeholder="Target view id"
          value={action.nodeId ?? ""}
          onChange={(e) => onChange({ ...item, action: { ...action, nodeId: e.target.value } })}
        />
      ) : null}
      {action.type === "navigate" || action.type === "submitForm" ? (
        <Select
          value={action.screenId ?? ""}
          onValueChange={(value) => value && onChange({ ...item, action: { ...action, screenId: value } })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Open screen" />
          </SelectTrigger>
          <SelectContent>
            {screens.map((screen) => (
              <SelectItem key={screen.id} value={screen.id}>
                {screen.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {action.type === "navigate" ? (
        <Input
          className="h-8"
          placeholder="Focus view id (optional)"
          value={action.nodeId ?? ""}
          onChange={(e) => onChange({ ...item, action: { ...action, nodeId: e.target.value } })}
        />
      ) : null}
      {action.type === "navigate" ? (
        <Input
          className="h-8"
          placeholder="Pass item as route.article"
          value={action.params?.article ?? ""}
          onChange={(e) =>
            onChange({ ...item, action: { ...action, params: { ...(action.params ?? {}), article: e.target.value } } })
          }
        />
      ) : null}
      {action.type === "openUrl" ? (
        <Input
          className="h-8"
          placeholder="{{route.article.url}}"
          value={action.url ?? ""}
          onChange={(e) => onChange({ ...item, action: { ...action, url: e.target.value } })}
        />
      ) : null}
      {action.type === "submitForm" ? (
        <Input
          className="h-8"
          placeholder="form id"
          value={action.formId ?? ""}
          onChange={(e) => onChange({ ...item, action: { ...action, formId: e.target.value } })}
        />
      ) : null}
      {action.type === "retry" || action.type === "callApi" ? (
        <Select
          value={action.dataSourceId ?? ""}
          onValueChange={(value) => value && onChange({ ...item, action: { ...action, dataSourceId: value } })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="API id" />
          </SelectTrigger>
          <SelectContent>
            {dataSources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

function setNodeProps(
  node: UiNode,
  patchNode: (id: string, patch: Partial<UiNode>) => void,
  next: Record<string, string | number | boolean | null>,
) {
  patchNode(node.id, { props: patchContainerProps(node, next) });
}

function ContainerAlignmentFields({
  node,
  patchNode,
}: {
  node: UiNode;
  patchNode: (id: string, patch: Partial<UiNode>) => void;
}) {
  if (
    node.type !== "Column" &&
    node.type !== "Row" &&
    node.type !== "LazyColumn" &&
    node.type !== "LazyRow" &&
    node.type !== "LazyVerticalGrid" &&
    node.type !== "Box"
  ) {
    return null;
  }
  const isColumn = node.type === "Column" || node.type === "LazyColumn" || node.type === "LazyVerticalGrid";
  const isBox = node.type === "Box";
  return (
    <div className="space-y-3 rounded-lg border p-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {node.type} parameters
      </div>
      <p className="text-[11px] leading-5 text-muted-foreground">
        Matches Jetpack Compose: <code className="font-mono">modifier</code>, arrangement, alignment, and{" "}
        <code className="font-mono">content</code> (children below).
      </p>
      {!isBox ? (
        <>
          <Field label={isColumn ? "verticalArrangement" : "horizontalArrangement"}>
            <Select
              value={isColumn ? columnArrangement(node.props) : rowArrangement(node.props)}
              onValueChange={(value) => {
                if (!value) return;
                setNodeProps(
                  node,
                  patchNode,
                  isColumn ? { verticalArrangement: value } : { horizontalArrangement: value },
                );
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(isColumn ? COLUMN_ARRANGEMENTS : ROW_ARRANGEMENTS).map((value) => (
                  <SelectItem key={value} value={value}>
                    Arrangement.{value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={isColumn ? "horizontalAlignment" : "verticalAlignment"}>
            <Select
              value={isColumn ? columnAlignment(node.props) : rowAlignment(node.props)}
              onValueChange={(value) => {
                if (!value) return;
                setNodeProps(
                  node,
                  patchNode,
                  isColumn ? { horizontalAlignment: value } : { verticalAlignment: value },
                );
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(isColumn ? COLUMN_ALIGNMENTS : ROW_ALIGNMENTS).map((value) => (
                  <SelectItem key={value} value={value}>
                    Alignment.{value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Arrangement.spacedBy (dp)">
            <Input
              type="number"
              value={Number(node.props.spacedBy ?? 8)}
              onChange={(e) => setNodeProps(node, patchNode, { spacedBy: Number(e.target.value) })}
            />
          </Field>
          <Field label="spacedBy alignment">
            <Select
              value={String(node.props.spacedByAlignment ?? (isColumn ? "Top" : "Start"))}
              onValueChange={(value) => value && setNodeProps(node, patchNode, { spacedByAlignment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(isColumn ? COLUMN_ALIGNMENTS : ROW_ALIGNMENTS).map((value) => (
                  <SelectItem key={value} value={value}>
                    Alignment.{value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {node.type === "LazyVerticalGrid" ? (
            <Field label="Columns">
              <Input
                type="number"
                min={1}
                max={6}
                value={Number(node.props.columns ?? 2)}
                onChange={(e) => setNodeProps(node, patchNode, { columns: Number(e.target.value) })}
              />
            </Field>
          ) : null}
        </>
      ) : (
        <Field label="contentAlignment">
          <Select
            value={boxAlignment(node.props)}
            onValueChange={(value) => value && setNodeProps(node, patchNode, { contentAlignment: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOX_ALIGNMENTS.map((value) => (
                <SelectItem key={value} value={value}>
                  Alignment.{value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    </div>
  );
}

function ScopeModifierFields({
  node,
  parent,
  patchNode,
}: {
  node: UiNode;
  parent: UiNode | null;
  patchNode: (id: string, patch: Partial<UiNode>) => void;
}) {
  if (!parent) return null;
  const isColumn = parent.type === "Column" || parent.type === "LazyColumn" || parent.type === "LazyVerticalGrid";
  const isRow = parent.type === "Row" || parent.type === "LazyRow";
  const isBox = parent.type === "Box";
  if (!isColumn && !isRow && !isBox) return null;
  const m = node.modifiers;
  const alignOptions = isColumn ? COLUMN_ALIGNMENTS : isRow ? ROW_ALIGNMENTS : BOX_ALIGNMENTS;
  const setMod = (patch: Partial<ModifierSpec>) => patchNode(node.id, { modifiers: { ...m, ...patch } });
  return (
    <div className="space-y-3 rounded-lg border p-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {parent.type}Scope modifiers
      </div>
      <p className="text-[11px] leading-5 text-muted-foreground">
        Child-level Compose modifiers for a {parent.type} parent: weight, align
        {isRow ? ", alignBy, alignByBaseline" : ""}.
      </p>
      {(isColumn || isRow) && (
        <>
          <Field label="Modifier.weight">
            <Input
              type="number"
              min={0}
              step={0.1}
              value={m.weight == null ? "" : String(m.weight)}
              placeholder="none"
              onChange={(e) =>
                setMod({ weight: e.target.value === "" ? undefined : Number(e.target.value) })
              }
            />
          </Field>
          {m.weight != null ? (
            <Field label="weight fill">
              <Switch checked={m.weightFill !== false} onCheckedChange={(checked) => setMod({ weightFill: Boolean(checked) })} />
            </Field>
          ) : null}
        </>
      )}
      <Field label="Modifier.align">
        <Select
          value={m.align ?? "none"}
          onValueChange={(value) => setMod({ align: value === "none" ? undefined : (value as AlignmentName) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">none</SelectItem>
            {alignOptions.map((value) => (
              <SelectItem key={value} value={value}>
                Alignment.{value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {isRow ? (
        <>
          <Field label="Modifier.alignBy">
            <Select
              value={m.alignBy ?? "none"}
              onValueChange={(value) =>
                setMod({ alignBy: value === "none" ? undefined : (value as NonNullable<ModifierSpec["alignBy"]>) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                {ALIGN_BY_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Modifier.alignByBaseline">
            <Switch
              checked={Boolean(m.alignByBaseline)}
              onCheckedChange={(checked) => setMod({ alignByBaseline: Boolean(checked) })}
            />
          </Field>
        </>
      ) : null}
    </div>
  );
}

function NodeApiFields({
  node,
  dataSources,
  patchNode,
}: {
  node: UiNode;
  dataSources: { id: string; name: string }[];
  patchNode: (id: string, patch: Partial<UiNode>) => void;
}) {
  if (dataSources.length === 0) return null;
  const selected = new Set(node.dataSourceIds ?? []);
  return (
    <div className="space-y-3 rounded-lg border p-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Component APIs
      </div>
      <p className="text-[11px] text-muted-foreground">
        Fetch these APIs when this widget is on screen. Screen-level APIs still apply.
      </p>
      {dataSources.map((source) => (
        <label key={source.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.has(source.id)}
            onChange={(event) => {
              const next = new Set(selected);
              if (event.target.checked) next.add(source.id);
              else next.delete(source.id);
              patchNode(node.id, { dataSourceIds: [...next] });
            }}
          />
          <span>{source.name}</span>
        </label>
      ))}
    </div>
  );
}

function ComposeLayout({
  node,
  patchNode,
  isContainer,
}: {
  node: UiNode;
  patchNode: (id: string, patch: Partial<UiNode>) => void;
  isContainer: boolean;
}) {
  const m = node.modifiers;
  const widthMode: SizeMode =
    m.widthMode ?? (m.fillMaxWidth ? "fill" : m.widthDp != null ? "fixed" : "wrap");
  const heightMode: SizeMode =
    m.heightMode ?? (m.fillMaxHeight ? "fill" : m.heightDp != null ? "fixed" : "wrap");

  const setWidthMode = (mode: SizeMode) => {
    patchNode(node.id, {
      modifiers: {
        ...m,
        widthMode: mode,
        fillMaxWidth: mode === "fill",
        widthDp: mode === "fixed" ? m.widthDp ?? 120 : undefined,
      },
    });
  };
  const setHeightMode = (mode: SizeMode) => {
    patchNode(node.id, {
      modifiers: {
        ...m,
        heightMode: mode,
        fillMaxHeight: mode === "fill",
        heightDp: mode === "fixed" ? m.heightDp ?? 48 : undefined,
      },
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Compose modifiers
      </div>
      <Field label="Width">
        <Select value={widthMode} onValueChange={(value) => value && setWidthMode(value as SizeMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wrap">Wrap content</SelectItem>
            <SelectItem value="fill">Fill parent</SelectItem>
            <SelectItem value="fixed">Fixed dp</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {widthMode === "fixed" ? (
        <Field label="Width dp">
          <Input
            type="number"
            value={m.widthDp == null ? "" : String(m.widthDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, widthDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
        </Field>
      ) : null}
      <Field label="Height">
        <Select value={heightMode} onValueChange={(value) => value && setHeightMode(value as SizeMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wrap">Wrap content</SelectItem>
            <SelectItem value="fill">Fill parent</SelectItem>
            <SelectItem value="fixed">Fixed dp</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {heightMode === "fixed" ? (
        <Field label="Height dp">
          <Input
            type="number"
            value={m.heightDp == null ? "" : String(m.heightDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, heightDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
        </Field>
      ) : null}
      <Field label="fillMaxWidth fraction">
        <Input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={m.fillMaxWidthFraction == null ? "" : String(m.fillMaxWidthFraction)}
          placeholder="1"
          onChange={(e) =>
            patchNode(node.id, {
              modifiers: {
                ...m,
                fillMaxWidthFraction: e.target.value === "" ? undefined : Number(e.target.value),
              },
            })
          }
        />
      </Field>
      <Field label="fillMaxHeight fraction">
        <Input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={m.fillMaxHeightFraction == null ? "" : String(m.fillMaxHeightFraction)}
          placeholder="1"
          onChange={(e) =>
            patchNode(node.id, {
              modifiers: {
                ...m,
                fillMaxHeightFraction: e.target.value === "" ? undefined : Number(e.target.value),
              },
            })
          }
        />
      </Field>
      <Field label="fillMaxSize">
        <Switch
          checked={Boolean(m.fillMaxSize)}
          onCheckedChange={(checked) =>
            patchNode(node.id, {
              modifiers: {
                ...m,
                fillMaxSize: Boolean(checked),
                fillMaxWidth: Boolean(checked) || m.fillMaxWidth,
                fillMaxHeight: Boolean(checked) || m.fillMaxHeight,
              },
            })
          }
        />
      </Field>
      {m.fillMaxSize ? (
        <Field label="fillMaxSize fraction">
          <Input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={m.fillMaxSizeFraction == null ? "" : String(m.fillMaxSizeFraction)}
            placeholder="1"
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: {
                  ...m,
                  fillMaxSizeFraction: e.target.value === "" ? undefined : Number(e.target.value),
                },
              })
            }
          />
        </Field>
      ) : null}
      <Field label="Modifier.size (dp)">
        <Input
          type="number"
          value={m.sizeDp == null ? "" : String(m.sizeDp)}
          placeholder="none"
          onChange={(e) =>
            patchNode(node.id, {
              modifiers: { ...m, sizeDp: e.target.value === "" ? undefined : Number(e.target.value) },
            })
          }
        />
      </Field>
      <Field label="widthIn min / max">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="min"
            value={m.minWidthDp == null ? "" : String(m.minWidthDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, minWidthDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
          <Input
            type="number"
            placeholder="max"
            value={m.maxWidthDp == null ? "" : String(m.maxWidthDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, maxWidthDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
        </div>
      </Field>
      <Field label="heightIn min / max">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="min"
            value={m.minHeightDp == null ? "" : String(m.minHeightDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, minHeightDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
          <Input
            type="number"
            placeholder="max"
            value={m.maxHeightDp == null ? "" : String(m.maxHeightDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, maxHeightDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
        </div>
      </Field>
      <Field label="requiredWidth / Height">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="width"
            value={m.requiredWidthDp == null ? "" : String(m.requiredWidthDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, requiredWidthDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
          <Input
            type="number"
            placeholder="height"
            value={m.requiredHeightDp == null ? "" : String(m.requiredHeightDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, requiredHeightDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
        </div>
      </Field>
      <Field label="requiredSize (dp)">
        <Input
          type="number"
          value={m.requiredSizeDp == null ? "" : String(m.requiredSizeDp)}
          placeholder="none"
          onChange={(e) =>
            patchNode(node.id, {
              modifiers: { ...m, requiredSizeDp: e.target.value === "" ? undefined : Number(e.target.value) },
            })
          }
        />
      </Field>
      <Field label="defaultMinSize W / H">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="minW"
            value={m.defaultMinWidthDp == null ? "" : String(m.defaultMinWidthDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, defaultMinWidthDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
          <Input
            type="number"
            placeholder="minH"
            value={m.defaultMinHeightDp == null ? "" : String(m.defaultMinHeightDp)}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, defaultMinHeightDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
        </div>
      </Field>
      <Field label="aspectRatio">
        <Input
          type="number"
          min={0}
          step={0.1}
          value={m.aspectRatio == null ? "" : String(m.aspectRatio)}
          placeholder="none"
          onChange={(e) =>
            patchNode(node.id, {
              modifiers: { ...m, aspectRatio: e.target.value === "" ? undefined : Number(e.target.value) },
            })
          }
        />
      </Field>
      {m.aspectRatio != null ? (
        <Field label="matchHeightConstraintsFirst">
          <Switch
            checked={Boolean(m.aspectRatioMatchHeightFirst)}
            onCheckedChange={(checked) =>
              patchNode(node.id, { modifiers: { ...m, aspectRatioMatchHeightFirst: Boolean(checked) } })
            }
          />
        </Field>
      ) : null}
      <Field label="wrapContentSize">
        <Switch
          checked={Boolean(m.wrapContentSize)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, wrapContentSize: Boolean(checked) } })}
        />
      </Field>
      <Field label="wrapContentWidth">
        <Switch
          checked={Boolean(m.wrapContentWidth)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, wrapContentWidth: Boolean(checked) } })}
        />
      </Field>
      <Field label="wrapContentHeight">
        <Switch
          checked={Boolean(m.wrapContentHeight)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, wrapContentHeight: Boolean(checked) } })}
        />
      </Field>
      {(m.wrapContentSize || m.wrapContentWidth) && (
        <Field label="wrapContent unbounded">
          <Switch
            checked={Boolean(m.wrapContentSizeUnbounded || m.wrapContentWidthUnbounded)}
            onCheckedChange={(checked) =>
              patchNode(node.id, {
                modifiers: {
                  ...m,
                  wrapContentSizeUnbounded: Boolean(checked),
                  wrapContentWidthUnbounded: Boolean(checked),
                  wrapContentHeightUnbounded: Boolean(checked),
                },
              })
            }
          />
        </Field>
      )}
      <SpacingEditor
        label="Padding"
        value={m.padding}
        onChange={(padding) => patchNode(node.id, { modifiers: { ...m, padding } })}
      />
      <SpacingEditor
        label="Margin"
        value={m.margin}
        onChange={(margin) => patchNode(node.id, { modifiers: { ...m, margin } })}
      />
      <Field label={`Alpha ${m.alpha ?? 1}`}>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[m.alpha ?? 1]}
          onValueChange={(value) => patchNode(node.id, { modifiers: { ...m, alpha: sliderNumber(value) } })}
        />
      </Field>
      <Field label="Offset X / Y">
        <div className="flex gap-2">
          <Input
            type="number"
            value={m.offsetXDp ?? 0}
            onChange={(e) => patchNode(node.id, { modifiers: { ...m, offsetXDp: Number(e.target.value) } })}
          />
          <Input
            type="number"
            value={m.offsetYDp ?? 0}
            onChange={(e) => patchNode(node.id, { modifiers: { ...m, offsetYDp: Number(e.target.value) } })}
          />
        </div>
      </Field>
      <Field label="Rotation">
        <Input
          type="number"
          value={m.rotationDeg ?? 0}
          onChange={(e) => patchNode(node.id, { modifiers: { ...m, rotationDeg: Number(e.target.value) } })}
        />
      </Field>
      <Field label="Elevation dp">
        <Input
          type="number"
          value={m.elevationDp ?? 0}
          onChange={(e) => patchNode(node.id, { modifiers: { ...m, elevationDp: Number(e.target.value) } })}
        />
      </Field>
      <Field label="clipToBounds">
        <Switch
          checked={Boolean(m.clipToBounds)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, clipToBounds: Boolean(checked) } })}
        />
      </Field>
      <Field label="Clip">
        <Select
          value={m.clip ?? "none"}
          onValueChange={(value) => value && patchNode(node.id, { modifiers: { ...m, clip: value as NonNullable<typeof m.clip> } })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["none", "extraSmall", "small", "medium", "large", "full"].map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Surface color token">
        <Select
          value={m.backgroundToken ?? "none"}
          onValueChange={(value) =>
            patchNode(node.id, {
              modifiers: { ...m, backgroundToken: value === "none" ? undefined : (value as (typeof COLORS)[number]) },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">none</SelectItem>
            {COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Surface hex">
        <ColorInput
          value={m.backgroundHex ?? ""}
          placeholder="#EADDFF"
          onChange={(value) => patchNode(node.id, { modifiers: { ...m, backgroundHex: value || undefined } })}
        />
      </Field>
      <Field label="Clickable">
        <Switch
          checked={Boolean(m.clickable)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, clickable: Boolean(checked) } })}
        />
      </Field>
      {m.clickable ? (
        <Field label="Ripple">
          <Switch
            checked={m.rippleEnabled !== false}
            onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, rippleEnabled: Boolean(checked) } })}
          />
        </Field>
      ) : null}
      {isContainer ? (
        <>
          <Field label="Scroll axis">
            <Select
              value={m.verticalScroll ? "vertical" : m.horizontalScroll ? "horizontal" : (m.scrollAxis ?? "none")}
              onValueChange={(value) => {
                if (!value) return;
                patchNode(node.id, {
                  modifiers: {
                    ...m,
                    scrollAxis: value as NonNullable<typeof m.scrollAxis>,
                    verticalScroll: value === "vertical",
                    horizontalScroll: value === "horizontal",
                  },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="vertical">verticalScroll</SelectItem>
                <SelectItem value="horizontal">horizontalScroll</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {(m.verticalScroll || m.horizontalScroll || (m.scrollAxis && m.scrollAxis !== "none")) && (
            <>
              <Field label="scroll enabled">
                <Switch
                  checked={m.scrollEnabled !== false}
                  onCheckedChange={(checked) =>
                    patchNode(node.id, { modifiers: { ...m, scrollEnabled: Boolean(checked) } })
                  }
                />
              </Field>
              <Field label="reverseScrolling">
                <Switch
                  checked={Boolean(m.reverseScrolling)}
                  onCheckedChange={(checked) =>
                    patchNode(node.id, { modifiers: { ...m, reverseScrolling: Boolean(checked) } })
                  }
                />
              </Field>
            </>
          )}
        </>
      ) : null}
      <Field label="IME padding">
        <Switch
          checked={Boolean(m.imePadding)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, imePadding: Boolean(checked) } })}
        />
      </Field>
      <Field label="System bars padding">
        <Switch
          checked={Boolean(m.systemBarsPadding)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, systemBarsPadding: Boolean(checked) } })}
        />
      </Field>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        graphicsLayer
      </div>
      <Field label="scaleX / scaleY">
        <div className="flex gap-2">
          <Input
            type="number"
            step={0.05}
            value={m.graphicsScaleX ?? 1}
            onChange={(e) =>
              patchNode(node.id, { modifiers: { ...m, graphicsScaleX: Number(e.target.value) } })
            }
          />
          <Input
            type="number"
            step={0.05}
            value={m.graphicsScaleY ?? 1}
            onChange={(e) =>
              patchNode(node.id, { modifiers: { ...m, graphicsScaleY: Number(e.target.value) } })
            }
          />
        </div>
      </Field>
      <Field label="translationX / Y">
        <div className="flex gap-2">
          <Input
            type="number"
            value={m.graphicsTranslationX ?? 0}
            onChange={(e) =>
              patchNode(node.id, { modifiers: { ...m, graphicsTranslationX: Number(e.target.value) } })
            }
          />
          <Input
            type="number"
            value={m.graphicsTranslationY ?? 0}
            onChange={(e) =>
              patchNode(node.id, { modifiers: { ...m, graphicsTranslationY: Number(e.target.value) } })
            }
          />
        </div>
      </Field>
      <Field label="rotationX / Y / Z">
        <div className="flex gap-2">
          <Input
            type="number"
            value={m.graphicsRotationX ?? 0}
            onChange={(e) =>
              patchNode(node.id, { modifiers: { ...m, graphicsRotationX: Number(e.target.value) } })
            }
          />
          <Input
            type="number"
            value={m.graphicsRotationY ?? 0}
            onChange={(e) =>
              patchNode(node.id, { modifiers: { ...m, graphicsRotationY: Number(e.target.value) } })
            }
          />
          <Input
            type="number"
            value={m.graphicsRotationZ ?? m.rotationDeg ?? 0}
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, graphicsRotationZ: Number(e.target.value), rotationDeg: Number(e.target.value) },
              })
            }
          />
        </div>
      </Field>
      <Field label="shadowElevation">
        <Input
          type="number"
          value={m.graphicsShadowElevation ?? 0}
          onChange={(e) =>
            patchNode(node.id, { modifiers: { ...m, graphicsShadowElevation: Number(e.target.value) } })
          }
        />
      </Field>
      <Field label="graphicsLayer clip">
        <Switch
          checked={Boolean(m.graphicsClip)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, graphicsClip: Boolean(checked) } })}
        />
      </Field>
      <Field label="combinedClickable">
        <Switch
          checked={Boolean(m.combinedClickable)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, combinedClickable: Boolean(checked) } })}
        />
      </Field>
      <Field label="selectable">
        <Switch
          checked={Boolean(m.selectable)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, selectable: Boolean(checked) } })}
        />
      </Field>
      {m.selectable ? (
        <Field label="selected">
          <Switch
            checked={Boolean(m.selected)}
            onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, selected: Boolean(checked) } })}
          />
        </Field>
      ) : null}
      <Field label="toggleable">
        <Switch
          checked={Boolean(m.toggleable)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, toggleable: Boolean(checked) } })}
        />
      </Field>
      {m.toggleable ? (
        <Field label="toggled">
          <Switch
            checked={Boolean(m.toggled)}
            onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, toggled: Boolean(checked) } })}
          />
        </Field>
      ) : null}
      <Field label="onClickLabel">
        <Input
          value={m.onClickLabel ?? ""}
          placeholder="TalkBack label"
          onChange={(e) =>
            patchNode(node.id, { modifiers: { ...m, onClickLabel: e.target.value || undefined } })
          }
        />
      </Field>
      <Field label="semantics mergeDescendants">
        <Switch
          checked={Boolean(m.semanticsMergeDescendants)}
          onCheckedChange={(checked) =>
            patchNode(node.id, { modifiers: { ...m, semanticsMergeDescendants: Boolean(checked) } })
          }
        />
      </Field>
      <Field label="semantics contentDescription">
        <Input
          value={m.semanticsLabel ?? ""}
          placeholder="contentDescription"
          onChange={(e) =>
            patchNode(node.id, { modifiers: { ...m, semanticsLabel: e.target.value || undefined } })
          }
        />
      </Field>
      <Field label="Border width / token">
        <div className="flex gap-2">
          <Input
            type="number"
            value={m.borderWidthDp == null ? "" : String(m.borderWidthDp)}
            placeholder="0"
            onChange={(e) =>
              patchNode(node.id, {
                modifiers: { ...m, borderWidthDp: e.target.value === "" ? undefined : Number(e.target.value) },
              })
            }
          />
          <Select
            value={m.borderToken ?? "outline"}
            onValueChange={(value) =>
              value && patchNode(node.id, { modifiers: { ...m, borderToken: value as (typeof COLORS)[number] } })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Field>
    </div>
  );
}

function DrawableFields({
  node,
  patchNode,
}: {
  node: UiNode;
  patchNode: (id: string, patch: Partial<UiNode>) => void;
}) {
  const drawable = node.drawable ?? { type: "none" as const };
  return (
        <div className="space-y-3 rounded-lg border p-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Drawable</div>
      <p className="text-xs leading-5 text-muted-foreground">
        Paints the widget surface. On Button, Chip, and TextField this replaces the default Material fill so the gradient is visible.
      </p>
      <Field label="Background">
        <Select
          value={drawable.type}
          onValueChange={(value) => {
            if (!value) return;
            const type = value as DrawableType;
            if (type === "gradient") {
              patchNode(node.id, {
                drawable: {
                  ...drawable,
                  type,
                  startHex: drawable.startHex || "#6750A4",
                  endHex: drawable.endHex || "#1B4B8A",
                  angle: drawable.angle ?? 145,
                },
              });
              return;
            }
            if (type === "color") {
              patchNode(node.id, {
                drawable: {
                  ...drawable,
                  type,
                  colorToken: drawable.colorToken ?? "primary",
                  colorHex: drawable.colorHex || "#6750A4",
                },
              });
              return;
            }
            patchNode(node.id, { drawable: { ...drawable, type } });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DRAWABLES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {drawable.type === "color" ? (
        <>
          <Field label="Color token">
            <Select
              value={drawable.colorToken ?? "primaryContainer"}
              onValueChange={(value) =>
                value &&
                patchNode(node.id, {
                  drawable: { ...drawable, colorToken: value as (typeof COLORS)[number] },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Color hex">
            <ColorInput
              value={drawable.colorHex ?? ""}
              placeholder="#EADDFF"
              onChange={(value) => patchNode(node.id, { drawable: { ...drawable, colorHex: value } })}
            />
          </Field>
        </>
      ) : null}
      {drawable.type === "gradient" ? (
        <>
          <Field label="Start">
            <ColorInput
              value={drawable.startHex ?? "#6750A4"}
              onChange={(value) => patchNode(node.id, { drawable: { ...drawable, startHex: value } })}
            />
          </Field>
          <Field label="End">
            <ColorInput
              value={drawable.endHex ?? "#1B4B8A"}
              onChange={(value) => patchNode(node.id, { drawable: { ...drawable, endHex: value } })}
            />
          </Field>
          <Field label="Angle">
            <Input
              type="number"
              value={drawable.angle ?? 145}
              onChange={(e) => patchNode(node.id, { drawable: { ...drawable, angle: Number(e.target.value) } })}
            />
          </Field>
        </>
      ) : null}
      {drawable.type === "image" ? (
        <Field label="Drawable image">
          <AssetUpload
            kind="image"
            currentUrl={drawable.url ?? ""}
            onPicked={(url) => patchNode(node.id, { drawable: { ...drawable, type: "image", url } })}
          />
        </Field>
      ) : null}
    </div>
  );
}
