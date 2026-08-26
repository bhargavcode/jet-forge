"use client";

import type { ReactNode } from "react";
import { BINDABLE_PROPS } from "@/lib/catalog";
import { flattenSources } from "@/lib/bindings";
import type {
  ActionType,
  ColorToken,
  EnterAnimationType,
  IconName,
  Interaction,
  TextStyle,
  TouchEvent,
  UiNode,
  VisibleWhen,
} from "@/lib/schema";
import { TOUCH_EVENTS } from "@/lib/schema";
import { interactionsOf } from "@/lib/interactions";
import { AssetUpload } from "./AssetUpload";
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

const ANIMATIONS: EnterAnimationType[] = ["none", "fade", "slideUp", "slideLeft", "scale"];
const VISIBILITY: VisibleWhen[] = ["always", "ready", "loading", "error", "empty", "invalid"];
const ACTIONS: ActionType[] = ["none", "navigate", "back", "submitForm", "retry", "openUrl", "callApi"];

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

  const bindable = BINDABLE_PROPS[node.type] ?? [];

  return (
    <Tabs defaultValue="props" className="flex h-full flex-col">
      <div className="border-b px-3 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="truncate text-sm font-semibold">{node.type}</div>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {node.id}
          </Badge>
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
      <ScrollArea className="flex-1">
        <TabsContent value="props" className="space-y-4 p-3">
          <TypeFields node={node} setProp={setProp} />
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
        </TabsContent>
        <TabsContent value="action" className="space-y-4 p-3">
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
        <TabsContent value="bind" className="space-y-4 p-3">
          {bindable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This component has no bindable properties. Use a list binding on LazyColumn to repeat children over an API array.
            </p>
          ) : (
            bindable.map((field) => (
              <Field key={field.key} label={`${field.label} path`}>
                <Input
                  list="binding-paths"
                  placeholder="catalog.storeName or item.title"
                  value={node.bindings?.[field.key] ?? ""}
                  onChange={(e) => setBinding(field.key, e.target.value)}
                />
              </Field>
            ))
          )}
          <datalist id="binding-paths">
            {paths.map((path) => (
              <option key={path} value={path} />
            ))}
            <option value="item.title" />
            <option value="item.subtitle" />
            <option value="item.price" />
            <option value="item.accent" />
            <option value="item.image" />
          </datalist>
          <p className="text-xs leading-5 text-muted-foreground">
            Paths are dotted JSON, rooted at each data source id. Inside a bound list, use <code>item.*</code> for the current row.
          </p>
        </TabsContent>
        <TabsContent value="motion" className="space-y-4 p-3">
          <Field label="Enter animation">
            <Select
              value={node.animation?.type ?? "none"}
              onValueChange={(value) => {
                if (!value) return;
                patchNode(node.id, {
                  animation: {
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
              max={800}
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
                  },
                });
              }}
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
