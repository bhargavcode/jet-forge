"use client";

import type { ReactNode } from "react";
import { BINDABLE_PROPS } from "@/lib/catalog";
import { flattenSources } from "@/lib/bindings";
import { bindableComposeProps } from "@/lib/model";
import { bindPathsForModel } from "@/lib/kotlin-model";
import type {
  ActionType,
  AnimationEasing,
  AnimationRepeat,
  ColorToken,
  DrawableType,
  EnterAnimationType,
  IconName,
  Interaction,
  TextStyle,
  TouchEvent,
  UiNode,
  VisibleWhen,
} from "@/lib/schema";
import type { VisibleIfOp } from "@/lib/schema";
import { TOUCH_EVENTS } from "@/lib/schema";
import { interactionsOf } from "@/lib/interactions";
import { AssetUpload } from "./AssetUpload";
import { ModelBrowser } from "./ModelBrowser";
import { useDesigner } from "@/lib/store";
import { currentRoot } from "@/lib/document";
import { findNode } from "@/lib/tree";
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

export function Inspector() {
  const screen = useDesigner((s) => s.screen);
  const currentScreenId = useDesigner((s) => s.currentScreenId);
  const selectedId = useDesigner((s) => s.selectedId);
  const patchNode = useDesigner((s) => s.patchNode);
  const deleteSelected = useDesigner((s) => s.deleteSelected);
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
        <div className="mb-2 flex gap-1">
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
          <ComposeLayout node={node} patchNode={patchNode} />
          <DrawableFields node={node} patchNode={patchNode} />
          <Field label="Fill width">
            <Switch
              checked={Boolean(node.modifiers.fillMaxWidth)}
              onCheckedChange={(checked) =>
                patchNode(node.id, { modifiers: { ...node.modifiers, fillMaxWidth: Boolean(checked) } })
              }
            />
          </Field>
          <Field label="Padding">
            <Input
              type="number"
              value={node.modifiers.padding?.all ?? node.modifiers.padding?.start ?? 0}
              onChange={(e) =>
                patchNode(node.id, {
                  modifiers: { ...node.modifiers, padding: { all: Number(e.target.value) } },
                })
              }
            />
          </Field>
          {node.type === "LazyColumn" || node.type === "Column" || node.type === "Row" ? (
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
        <Field label="Text">
          <Input value={String(node.props.text ?? "")} onChange={(e) => setProp("text", e.target.value)} />
        </Field>
        <Field label="Typography">
          <Select value={String(node.props.style ?? "bodyLarge")} onValueChange={(v) => v && setProp("style", v)}>
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
        <Field label="Color token">
          <Select value={String(node.props.color ?? "onSurface")} onValueChange={(v) => v && setProp("color", v)}>
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
        <Field label="Align">
          <Select value={String(node.props.textAlign ?? "start")} onValueChange={(v) => v && setProp("textAlign", v)}>
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
        <Field label="Max lines">
          <Input type="number" value={Number(node.props.maxLines ?? 0)} onChange={(e) => setProp("maxLines", Number(e.target.value))} />
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
      </>
    );
  }

  if (
    node.type === "FilledButton" ||
    node.type === "OutlinedButton" ||
    node.type === "TextButton" ||
    node.type === "Chip"
  ) {
    return (
      <Field label="Label">
        <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
      </Field>
    );
  }

  if (node.type === "TopAppBar") {
    return (
      <>
        <Field label="Title">
          <Input value={String(node.props.title ?? "")} onChange={(e) => setProp("title", e.target.value)} />
        </Field>
        <Field label="Navigation icon">
          <Select
            value={String(node.props.navigationIcon ?? "menu")}
            onValueChange={(v) => v && setProp("navigationIcon", v)}
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
      </>
    );
  }

  if (node.type === "TextField") {
    return (
      <>
        <Field label="Label">
          <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
        </Field>
        <Field label="Placeholder">
          <Input
            value={String(node.props.placeholder ?? "")}
            onChange={(e) => setProp("placeholder", e.target.value)}
          />
        </Field>
      </>
    );
  }

  if (node.type === "ListItem") {
    return (
      <>
        <Field label="Headline">
          <Input value={String(node.props.headline ?? "")} onChange={(e) => setProp("headline", e.target.value)} />
        </Field>
        <Field label="Supporting">
          <Input
            value={String(node.props.supporting ?? "")}
            onChange={(e) => setProp("supporting", e.target.value)}
          />
        </Field>
      </>
    );
  }

  if (node.type === "Icon" || node.type === "FAB" || node.type === "NavigationBarItem") {
    return (
      <>
        {node.type !== "Icon" && node.type !== "FAB" ? (
          <Field label="Label">
            <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
          </Field>
        ) : null}
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
        {node.type === "NavigationBarItem" ? (
          <Field label="Selected">
            <Switch
              checked={Boolean(node.props.selected)}
              onCheckedChange={(checked) => setProp("selected", Boolean(checked))}
            />
          </Field>
        ) : null}
        {node.type === "Icon" ? (
          <Field label="Custom icon from device">
            <AssetUpload
              kind="icon"
              currentUrl={String(node.props.url ?? "")}
              onPicked={(url) => setProp("url", url)}
            />
          </Field>
        ) : null}
      </>
    );
  }

  if (node.type === "Switch" || node.type === "Checkbox") {
    return (
      <>
        <Field label="Label">
          <Input value={String(node.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} />
        </Field>
        <Field label="Checked">
          <Switch checked={Boolean(node.props.checked)} onCheckedChange={(checked) => setProp("checked", Boolean(checked))} />
        </Field>
      </>
    );
  }

  if (node.type === "Card") {
    return (
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
    );
  }

  if (node.type === "Image") {
    return (
      <>
        <Field label="Placeholder (device upload)">
          <AssetUpload kind="image" currentUrl={String(node.props.url ?? "")} onPicked={(url) => setProp("url", url)} />
        </Field>
        <Field label="Placeholder URL">
          <Input value={String(node.props.url ?? "")} onChange={(e) => setProp("url", e.target.value)} />
        </Field>
        <Field label="Content scale">
          <Select value={String(node.props.contentScale ?? "crop")} onValueChange={(v) => v && setProp("contentScale", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crop">crop (ContentScale.Crop)</SelectItem>
              <SelectItem value="fit">fit (ContentScale.Fit)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <p className="text-xs text-muted-foreground">
          This file is the empty-state art. Bind Image URL to an API field (item.image) and the live response replaces it.
        </p>
      </>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Layout containers expose padding, list binding, and children. Drop Material components into this node on the canvas.
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

function ComposeLayout({
  node,
  patchNode,
}: {
  node: UiNode;
  patchNode: (id: string, patch: Partial<UiNode>) => void;
}) {
  const m = node.modifiers;
  return (
    <div className="space-y-3 rounded-lg border p-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Compose modifiers
      </div>
      <Field label="Width dp">
        <Input
          type="number"
          value={m.widthDp == null ? "" : String(m.widthDp)}
          placeholder="wrap"
          onChange={(e) =>
            patchNode(node.id, { modifiers: { ...m, widthDp: e.target.value === "" ? undefined : Number(e.target.value) } })
          }
        />
      </Field>
      <Field label="Height dp">
        <Input
          type="number"
          value={m.heightDp == null ? "" : String(m.heightDp)}
          placeholder="wrap"
          onChange={(e) =>
            patchNode(node.id, { modifiers: { ...m, heightDp: e.target.value === "" ? undefined : Number(e.target.value) } })
          }
        />
      </Field>
      <Field label="Fill height">
        <Switch
          checked={Boolean(m.fillMaxHeight)}
          onCheckedChange={(checked) => patchNode(node.id, { modifiers: { ...m, fillMaxHeight: Boolean(checked) } })}
        />
      </Field>
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
        <Input
          value={m.backgroundHex ?? ""}
          placeholder="#EADDFF"
          onChange={(e) =>
            patchNode(node.id, { modifiers: { ...m, backgroundHex: e.target.value || undefined } })
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
      <Field label="Weight (Row/Column)">
        <Input
          type="number"
          value={m.weight == null ? "" : String(m.weight)}
          placeholder="none"
          onChange={(e) =>
            patchNode(node.id, { modifiers: { ...m, weight: e.target.value === "" ? undefined : Number(e.target.value) } })
          }
        />
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
      <Field label="Background">
        <Select
          value={drawable.type}
          onValueChange={(value) =>
            value && patchNode(node.id, { drawable: { ...drawable, type: value as DrawableType } })
          }
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
            <Input
              value={drawable.colorHex ?? ""}
              placeholder="#EADDFF"
              onChange={(e) => patchNode(node.id, { drawable: { ...drawable, colorHex: e.target.value } })}
            />
          </Field>
        </>
      ) : null}
      {drawable.type === "gradient" ? (
        <>
          <Field label="Start">
            <Input
              value={drawable.startHex ?? "#6750A4"}
              onChange={(e) => patchNode(node.id, { drawable: { ...drawable, startHex: e.target.value } })}
            />
          </Field>
          <Field label="End">
            <Input
              value={drawable.endHex ?? "#1B4B8A"}
              onChange={(e) => patchNode(node.id, { drawable: { ...drawable, endHex: e.target.value } })}
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
