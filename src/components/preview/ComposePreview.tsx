"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Bell,
  GripVertical,
  Heart,
  Home,
  LoaderCircle,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  User,
  ArrowLeft,
} from "lucide-react";
import { resolveProp, type BindingScope } from "@/lib/bindings";
import { actionForEvent, gestureFromDelta, hasRuntimeGestures } from "@/lib/interactions";
import { isNodeVisible, resolveList } from "@/lib/runtime";
import { useRuntime } from "@/lib/runtime-context";
import type {
  ColorToken,
  EnterAnimation,
  IconName,
  ModifierSpec,
  NodeType,
  TextStyle,
  TouchEvent,
  UiNode,
} from "@/lib/schema";
import { useDesigner } from "@/lib/store";
import { isContainer } from "@/lib/tree";
import {
  contentJustify,
  cssTextAlign,
  defaultTextToken,
  defaultTypeScale,
  hasCustomSurface,
  isButtonType,
  isSurfaceType,
} from "@/lib/widget-chrome";
import { cn } from "@/lib/utils";

const ICONS: Record<IconName, typeof Home> = {
  home: Home,
  search: Search,
  cart: ShoppingBag,
  person: User,
  add: Plus,
  favorite: Heart,
  star: Star,
  settings: Settings,
  back: ArrowLeft,
  menu: Menu,
  notifications: Bell,
  tune: SlidersHorizontal,
};

const TYPE_SCALE: Record<TextStyle, string> = {
  displayLarge: "text-[32px] leading-10 tracking-tight font-normal",
  headlineMedium: "text-[24px] leading-8 font-normal",
  titleLarge: "text-[22px] leading-7 font-normal",
  titleMedium: "text-[16px] leading-6 font-medium tracking-[0.15px]",
  bodyLarge: "text-[16px] leading-6 font-normal tracking-[0.5px]",
  bodyMedium: "text-[14px] leading-5 font-normal tracking-[0.25px]",
  labelLarge: "text-[14px] leading-5 font-medium tracking-[0.1px]",
  labelMedium: "text-[12px] leading-4 font-medium tracking-[0.5px]",
};

const COLOR_VAR: Record<ColorToken, string> = {
  primary: "var(--md-primary)",
  onPrimary: "var(--md-on-primary)",
  primaryContainer: "var(--md-primary-container)",
  onPrimaryContainer: "var(--md-on-primary-container)",
  secondary: "var(--md-secondary)",
  onSecondary: "var(--md-on-secondary)",
  surface: "var(--md-surface)",
  onSurface: "var(--md-on-surface)",
  onSurfaceVariant: "var(--md-on-surface-variant)",
  surfaceContainer: "var(--md-surface-container)",
  surfaceContainerHigh: "var(--md-surface-container-high)",
  outline: "var(--md-outline)",
  error: "var(--md-error)",
  tertiary: "var(--md-tertiary)",
};

function dp(value?: number) {
  return value == null ? undefined : `${value}px`;
}

function paddingStyle(modifiers: ModifierSpec): CSSProperties {
  const p = modifiers.padding;
  if (!p) return {};
  if (p.all != null) return { padding: dp(p.all) };
  return {
    paddingLeft: dp(p.start),
    paddingRight: dp(p.end),
    paddingTop: dp(p.top),
    paddingBottom: dp(p.bottom),
  };
}

function clipClass(clip?: ModifierSpec["clip"]) {
  switch (clip) {
    case "extraSmall":
      return "rounded";
    case "small":
      return "rounded-lg";
    case "medium":
      return "rounded-xl";
    case "large":
      return "rounded-[16px]";
    case "full":
      return "rounded-full";
    default:
      return "";
  }
}

function modifierStyle(modifiers: ModifierSpec): CSSProperties {
  const background =
    modifiers.backgroundHex ||
    (modifiers.backgroundToken ? COLOR_VAR[modifiers.backgroundToken] : undefined);
  const borderColor = modifiers.borderToken ? COLOR_VAR[modifiers.borderToken] : undefined;
  return {
    width: modifiers.fillMaxWidth ? "100%" : modifiers.widthDp != null ? dp(modifiers.widthDp) : "fit-content",
    height: modifiers.fillMaxHeight ? "100%" : modifiers.heightDp != null ? dp(modifiers.heightDp) : "auto",
    maxWidth: modifiers.fillMaxWidth ? "100%" : undefined,
    flex: modifiers.weight ? modifiers.weight : undefined,
    opacity: modifiers.alpha == null ? undefined : modifiers.alpha,
    transform: [
      modifiers.offsetXDp || modifiers.offsetYDp
        ? `translate(${modifiers.offsetXDp ?? 0}px, ${modifiers.offsetYDp ?? 0}px)`
        : "",
      modifiers.rotationDeg ? `rotate(${modifiers.rotationDeg}deg)` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined,
    background,
    border:
      modifiers.borderWidthDp && borderColor
        ? `${modifiers.borderWidthDp}px solid ${borderColor}`
        : undefined,
    boxShadow:
      modifiers.elevationDp && modifiers.elevationDp > 0
        ? `0 ${Math.max(1, modifiers.elevationDp / 3)}px ${modifiers.elevationDp}px rgb(0 0 0 / 18%)`
        : undefined,
    ...paddingStyle(modifiers),
  };
}

function drawableStyle(node: UiNode): CSSProperties {
  const drawable = node.drawable;
  if (!drawable || drawable.type === "none") return {};
  if (drawable.type === "color") {
    return {
      background: drawable.colorHex || (drawable.colorToken ? COLOR_VAR[drawable.colorToken] : undefined),
    };
  }
  if (drawable.type === "gradient") {
    return {
      background: `linear-gradient(${drawable.angle ?? 145}deg, ${drawable.startHex ?? "#6750A4"}, ${drawable.endHex ?? "#1B4B8A"})`,
    };
  }
  if (drawable.type === "image" && drawable.url) {
    return {
      backgroundImage: `url(${drawable.url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {};
}

function animationClass(animation?: EnterAnimation) {
  if (!animation || animation.type === "none") return "";
  return cn(
    "m3-enter",
    `m3-enter-${animation.type}`,
    animation.easing === "emphasized" && "m3-ease-emphasized",
    animation.easing === "bounce" && "m3-ease-bounce",
    animation.easing === "linear" && "m3-ease-linear",
    animation.repeat === "infinite" && "m3-repeat-infinite",
  );
}

function animationStyle(animation?: EnterAnimation, index = 0): CSSProperties {
  if (!animation || animation.type === "none") return {};
  const delay = (animation.delayMs ?? 0) + index * (animation.staggerMs ?? 0);
  return {
    animationDuration: `${animation.durationMs || 280}ms`,
    animationDelay: `${delay}ms`,
    ["--m3-pulse-from" as string]: animation.colorFrom ?? undefined,
    ["--m3-pulse-to" as string]: animation.colorTo ?? undefined,
    ["--m3-move-x" as string]: `${animation.moveXDp ?? 36}px`,
    ["--m3-move-y" as string]: `${animation.moveYDp ?? 12}px`,
  };
}

function MaterialIcon({
  name,
  color,
  size = 24,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const Icon = ICONS[(name as IconName) || "star"] ?? Star;
  return <Icon size={size} color={color} strokeWidth={1.9} />;
}

function RippleButton({
  className,
  children,
  style,
}: {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div role="button" className={cn("m3-ripple relative overflow-hidden", className)} style={style}>
      {children}
    </div>
  );
}

function resolveTextColor(node: UiNode, fallback?: ColorToken) {
  if (typeof node.props.colorHex === "string" && node.props.colorHex) return String(node.props.colorHex);
  const token = (node.props.color as ColorToken) || fallback || defaultTextToken(node.type);
  return COLOR_VAR[token] ?? COLOR_VAR.onSurface;
}

function typeScaleClass(node: UiNode) {
  const style = (node.props.style as TextStyle) || defaultTypeScale(node.type);
  return TYPE_SCALE[style] ?? TYPE_SCALE.bodyLarge;
}

function maxLinesStyle(node: UiNode): CSSProperties {
  const maxLines = Number(node.props.maxLines ?? 0);
  return {
    fontWeight: Number(node.props.weight) || undefined,
    fontSize: node.props.fontSizeDp ? `${Number(node.props.fontSizeDp)}px` : undefined,
    display: maxLines ? "-webkit-box" : undefined,
    WebkitLineClamp: maxLines || undefined,
    WebkitBoxOrient: maxLines ? "vertical" : undefined,
    overflow: maxLines || node.props.overflow === "ellipsis" ? "hidden" : undefined,
    textOverflow: node.props.overflow === "ellipsis" || maxLines ? "ellipsis" : undefined,
  };
}

function paintedSurface(node: UiNode): CSSProperties {
  if (!hasCustomSurface(node)) return {};
  const drawable = drawableStyle(node);
  return {
    ...drawable,
    background: drawable.background || node.modifiers.backgroundHex || (node.modifiers.backgroundToken ? COLOR_VAR[node.modifiers.backgroundToken] : undefined),
  };
}

interface NodeProps {
  node: UiNode;
  scope: BindingScope;
  selectedId: string | null;
  onSelect?: (id: string) => void;
  droppable?: boolean;
  itemIndex?: number;
  interactive: boolean;
}

export function ComposeNode({
  node,
  scope,
  selectedId,
  onSelect,
  itemIndex = 0,
  interactive,
}: NodeProps) {
  const runtime = useRuntime();
  const selected = selectedId === node.id;
  if (runtime && !isNodeVisible(node.visibleWhen, runtime.uiState, runtime.hasFormError, node.visibleIf, scope)) {
    return null;
  }

  const runAction = Boolean(runtime?.enabled && hasRuntimeGestures(node));

  const wrap = (content: ReactNode, extraClass = "", extraStyle?: CSSProperties) => (
    <NodeShell
      node={node}
      scope={scope}
      selected={selected}
      interactive={interactive}
      onSelect={onSelect}
      runAction={runAction}
      itemIndex={itemIndex}
      extraClass={extraClass}
      extraStyle={extraStyle}
    >
      {content}
    </NodeShell>
  );

  const children = node.children ?? [];

  const renderChildren = (childScope: BindingScope, extraIndex = 0) =>
    children.map((child, index) => (
      <ComposeNode
        key={child.id}
        node={child}
        scope={childScope}
        selectedId={selectedId}
        onSelect={onSelect}
        itemIndex={extraIndex + index}
        interactive={interactive}
      />
    ));

  if (node.type === "Scaffold") {
    const topBar = children.find((c) => c.slot === "topBar" || c.type === "TopAppBar");
    const bottomBar = children.find((c) => c.slot === "bottomBar" || c.type === "NavigationBar");
    const fab = children.find((c) => c.slot === "fab" || c.type === "FAB");
    const content =
      children.find((c) => c.slot === "content") ??
      ({
        ...node,
        id: `${node.id}-content`,
        type: "Column" as NodeType,
        children: children.filter((c) => c !== topBar && c !== bottomBar && c !== fab),
        slot: undefined,
      } satisfies UiNode);

    return wrap(
      <div className="flex h-full min-h-0 flex-col bg-[var(--md-surface)]">
        {topBar ? (
          <ComposeNode
            node={topBar}
            scope={scope}
            selectedId={selectedId}
            onSelect={onSelect}
            interactive={interactive}
          />
        ) : interactive ? (
          <DropTarget id={`${node.id}::topBar`}>
            <SlotHint label="Top app bar" />
          </DropTarget>
        ) : null}
        <DropTarget id={`${node.id}::content`} className="relative min-h-0 flex-1 overflow-hidden">
          <ComposeNode
            node={content}
            scope={scope}
            selectedId={selectedId}
            onSelect={onSelect}
            interactive={interactive}
          />
          {fab ? (
            <div className="pointer-events-auto absolute right-4 bottom-5 z-10">
              <ComposeNode
                node={fab}
                scope={scope}
                selectedId={selectedId}
                onSelect={onSelect}
                interactive={interactive}
              />
            </div>
          ) : interactive ? (
            <DropTarget id={`${node.id}::fab`} className="absolute right-4 bottom-5">
              <SlotHint label="FAB" />
            </DropTarget>
          ) : null}
        </DropTarget>
        {bottomBar ? (
          <ComposeNode
            node={bottomBar}
            scope={scope}
            selectedId={selectedId}
            onSelect={onSelect}
            interactive={interactive}
          />
        ) : interactive ? (
          <DropTarget id={`${node.id}::bottomBar`}>
            <SlotHint label="Navigation bar" />
          </DropTarget>
        ) : null}
      </div>,
      "h-full",
    );
  }

  if (node.type === "LazyColumn" && node.itemBinding) {
    const list = resolveList(scope, node.itemBinding);
    const spacedBy = Number(node.props.spacedBy ?? 12);
    return wrap(
      <DropTarget id={node.id} disabled={!interactive} className="h-full overflow-y-auto">
        <div style={{ display: "flex", flexDirection: "column", gap: spacedBy }}>
        {list.length === 0 ? (
          interactive ? (
          <div className="rounded-xl border border-dashed border-[var(--md-outline-variant)] px-3 py-8 text-center text-[12px] text-[var(--md-on-surface-variant)]">
            No items from `{node.itemBinding}`
          </div>
          ) : null
        ) : (
          list.map((item, index) => (
            <div key={index} className="flex flex-col" style={{ gap: spacedBy }}>
              {children.map((child) => (
                <ComposeNode
                  key={`${child.id}-${index}`}
                  node={child}
                  scope={{ ...scope, item, itemIndex: index }}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  itemIndex={index}
                  interactive={interactive}
                />
              ))}
            </div>
          ))
        )}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "Column" || node.type === "LazyColumn") {
    const spacedBy = Number(node.props.spacedBy ?? 8);
    return wrap(
      <DropTarget
        id={node.id}
        disabled={!interactive}
        className={cn(
          node.modifiers.fillMaxHeight && "h-full min-h-0",
          node.type === "LazyColumn" && "h-full overflow-y-auto",
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: spacedBy }}>
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Column" /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "Row") {
    const spacedBy = Number(node.props.spacedBy ?? 8);
    return wrap(
      <DropTarget id={node.id} disabled={!interactive}>
        <div className="flex flex-row items-center" style={{ gap: spacedBy }}>
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Row" /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "Box") {
    return wrap(
      <DropTarget id={node.id} disabled={!interactive} className="relative">
        {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Box" /> : null}
      </DropTarget>,
    );
  }

  if (node.type === "Card") {
    const variant = String(node.props.variant ?? "elevated");
    return wrap(
      <div
        className={cn(
          "bg-[var(--md-surface-container-lowest)]",
          variant === "outlined" && "border border-[var(--md-outline-variant)]",
          variant !== "outlined" && "m3-elev-1",
          runAction && "cursor-pointer",
        )}
        style={paddingStyle(node.modifiers)}
      >
        <DropTarget id={node.id} disabled={!interactive}>
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Card" /> : null}
        </DropTarget>
      </div>,
      clipClass(node.modifiers.clip) || "rounded-xl",
      { padding: 0 },
    );
  }

  if (node.type === "TopAppBar") {
    const title = String(resolveProp(node, "title", scope) ?? "Title");
    const nav = String(node.props.navigationIcon ?? "menu");
    return wrap(
      <div className="flex h-16 items-center gap-3 bg-[var(--md-surface)] px-2">
        <span className="flex size-12 items-center justify-center text-[var(--md-on-surface)]">
          <MaterialIcon name={nav} />
        </span>
        <div
          className="min-w-0 flex-1 text-[22px] leading-7 text-[var(--md-on-surface)]"
          style={{ color: resolveTextColor(node, "onSurface"), textAlign: cssTextAlign(node), ...maxLinesStyle(node) }}
        >
          {title}
        </div>
        <span className="flex size-12 items-center justify-center text-[var(--md-on-surface-variant)]">
          <MaterialIcon name="notifications" />
        </span>
      </div>,
    );
  }

  if (node.type === "NavigationBar") {
    return wrap(
      <DropTarget id={node.id} disabled={!interactive}>
        <div className="flex h-[80px] items-start justify-around bg-[var(--md-surface-container)] pt-3">
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Nav items" /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "NavigationBarItem") {
    const selectedItem =
      (runtime?.enabled && actionForEvent(node, "tap")?.screenId
        ? runtime.screenId === actionForEvent(node, "tap")?.screenId
        : Boolean(node.props.selected));
    const label = String(node.props.label ?? "Item");
    const icon = String(node.props.icon ?? "home");
    return wrap(
      <div className="flex w-[64px] flex-col items-center gap-1">
        <div
          className={cn(
            "flex h-8 w-[56px] items-center justify-center rounded-full",
            selectedItem && "bg-[var(--md-secondary-container,#E8DEF8)] text-[var(--md-on-surface)]",
            !selectedItem && "text-[var(--md-on-surface-variant)]",
          )}
        >
          <MaterialIcon name={icon} size={22} />
        </div>
        <div
          className={cn(
            "text-[12px] font-medium tracking-[0.5px]",
            selectedItem ? "text-[var(--md-on-surface)]" : "text-[var(--md-on-surface-variant)]",
          )}
        >
          {label}
        </div>
      </div>,
      "w-auto",
    );
  }

  if (node.type === "FAB") {
    return wrap(
      <RippleButton className="flex size-14 items-center justify-center rounded-2xl bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] m3-elev-3">
        <MaterialIcon name={String(node.props.icon ?? "add")} color="currentColor" />
      </RippleButton>,
      "w-auto",
    );
  }

  if (node.type === "FilledButton" || node.type === "OutlinedButton" || node.type === "TextButton") {
    const label = String(resolveProp(node, "label", scope) ?? "Action");
    const filled = node.type === "FilledButton";
    const outlined = node.type === "OutlinedButton";
    const custom = hasCustomSurface(node);
    const icon = node.props.icon ? String(node.props.icon) : "";
    const enabled = node.props.enabled !== false;
    return wrap(
      <RippleButton
        className={cn(
          "flex min-h-10 min-w-[48px] items-center gap-2 rounded-full px-6",
          typeScaleClass(node),
          !custom && filled && "bg-[var(--md-primary)] text-[var(--md-on-primary)]",
          !custom && outlined && "border border-[var(--md-outline)] bg-transparent text-[var(--md-primary)]",
          !custom && node.type === "TextButton" && "px-3 text-[var(--md-primary)]",
          !enabled && "opacity-[0.38]",
        )}
        style={{
          width: "100%",
          justifyContent: contentJustify(node),
          color: resolveTextColor(node, filled ? "onPrimary" : "primary"),
          ...paintedSurface(node),
        }}
      >
        {icon && icon !== "none" ? <MaterialIcon name={icon} size={18} color="currentColor" /> : null}
        <span className="min-w-0" style={{ textAlign: cssTextAlign(node), ...maxLinesStyle(node) }}>
          {label}
        </span>
      </RippleButton>,
      cn(node.modifiers.fillMaxWidth ? "w-full" : "w-auto inline-flex", node.modifiers.clip ? "" : "rounded-full"),
    );
  }

  if (node.type === "Chip") {
    const label = String(resolveProp(node, "label", scope) ?? "Chip");
    const custom = hasCustomSurface(node);
    const icon = node.props.icon ? String(node.props.icon) : "";
    const enabled = node.props.enabled !== false;
    return wrap(
      <div
        className={cn(
          "inline-flex h-8 min-w-0 items-center gap-1.5 rounded-lg px-4",
          typeScaleClass(node),
          !custom && "border border-[var(--md-outline-variant)] text-[var(--md-on-surface)]",
          !enabled && "opacity-[0.38]",
        )}
        style={{
          width: "100%",
          justifyContent: contentJustify(node),
          color: resolveTextColor(node, "onSurface"),
          ...paintedSurface(node),
        }}
      >
        {icon && icon !== "none" ? <MaterialIcon name={icon} size={16} color="currentColor" /> : null}
        <span className="min-w-0" style={{ textAlign: cssTextAlign(node), ...maxLinesStyle(node) }}>
          {label}
        </span>
      </div>,
      cn(node.modifiers.fillMaxWidth ? "w-full" : "w-auto inline-flex", node.modifiers.clip ? "" : "rounded-lg"),
    );
  }

  if (node.type === "TextField") {
    const label = String(resolveProp(node, "label", scope) ?? "Label");
    const placeholder = String(node.props.placeholder ?? "");
    const formId = node.formField?.formId;
    const fieldName = node.formField?.name;
    const formValue =
      formId && fieldName ? runtime?.formValues[formId]?.[fieldName] : undefined;
    const value = formValue ?? String(resolveProp(node, "value", scope) ?? "");
    const invalid = Boolean(formId && fieldName && runtime?.formErrors[formId]?.[fieldName]);
    const custom = hasCustomSurface(node);
    const enabled = node.props.enabled !== false;
    const fieldStyle: CSSProperties = {
      color: resolveTextColor(node, "onSurface"),
      textAlign: cssTextAlign(node),
      ...maxLinesStyle(node),
      ...paintedSurface(node),
      borderColor: invalid ? "var(--md-error)" : "var(--md-primary)",
    };
    return wrap(
      <label
        className={cn("block", !enabled && "opacity-[0.38]")}
        onClick={runtime?.enabled ? (event) => event.stopPropagation() : undefined}
      >
        <span
          className="mb-1 block text-[12px] font-medium tracking-[0.5px] text-[var(--md-on-surface-variant)]"
          style={{
            color:
              typeof node.props.labelColorHex === "string" && node.props.labelColorHex
                ? String(node.props.labelColorHex)
                : resolveTextColor({ ...node, props: { ...node.props, color: node.props.labelColor ?? "onSurfaceVariant" } }, "onSurfaceVariant"),
          }}
        >
          {label}
        </span>
        {runtime?.enabled && formId && fieldName ? (
          <input
            value={value}
            placeholder={placeholder}
            disabled={!enabled}
            onChange={(event) => runtime.setFormValue(formId, fieldName, event.target.value)}
            className={cn(
              "h-14 w-full rounded-t-md border-b-2 px-4 outline-none",
              typeScaleClass(node),
              !custom && "bg-[var(--md-surface-container-high)]",
            )}
            style={fieldStyle}
          />
        ) : (
          <div
            className={cn(
              "flex h-14 items-center rounded-t-md border-b-2 px-4",
              typeScaleClass(node),
              !custom && "bg-[var(--md-surface-container-high)]",
            )}
            style={{ ...fieldStyle, justifyContent: contentJustify(node) }}
          >
            {value || <span className="text-[var(--md-on-surface-variant)]">{placeholder}</span>}
          </div>
        )}
      </label>,
    );
  }

  if (node.type === "Switch" || node.type === "Checkbox") {
    const label = String(resolveProp(node, "label", scope) ?? node.type);
    const checked = Boolean(node.props.checked);
    return wrap(
      <div className="flex items-center justify-between gap-3 py-1">
        <span
          className={cn(typeScaleClass(node), "text-[var(--md-on-surface)]")}
          style={{ color: resolveTextColor(node, "onSurface"), textAlign: cssTextAlign(node), ...maxLinesStyle(node) }}
        >
          {label}
        </span>
        {node.type === "Switch" ? (
          <span
            className={cn(
              "relative h-8 w-[52px] rounded-full border-2",
              checked
                ? "border-[var(--md-primary)] bg-[var(--md-primary)]"
                : "border-[var(--md-outline)] bg-[var(--md-surface-container-highest,#E6E0E9)]",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-5 rounded-full transition-transform",
                checked ? "left-7 bg-[var(--md-on-primary)]" : "left-1 bg-[var(--md-outline)]",
              )}
            />
          </span>
        ) : (
          <span
            className={cn(
              "flex size-[18px] items-center justify-center rounded-[2px] border-2",
              checked
                ? "border-[var(--md-primary)] bg-[var(--md-primary)] text-[var(--md-on-primary)]"
                : "border-[var(--md-on-surface-variant)]",
            )}
          >
            {checked ? "✓" : null}
          </span>
        )}
      </div>,
    );
  }

  if (node.type === "Text") {
    const text = String(resolveProp(node, "text", scope) ?? "");
    return wrap(
      <div
        className={typeScaleClass(node)}
        style={{
          color: resolveTextColor(node, "onSurface"),
          textAlign: cssTextAlign(node),
          ...maxLinesStyle(node),
        }}
      >
        {text}
      </div>,
    );
  }

  if (node.type === "Image") {
    const url = String(resolveProp(node, "url", scope) ?? "");
    const accent = String(resolveProp(node, "accent", scope) ?? node.props.accent ?? "#6750A4");
    return wrap(
      url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={String(node.props.alt ?? "")}
          className={cn(
            "h-full w-full",
            String(node.props.contentScale ?? "crop") === "fit" ? "object-contain" : "object-cover",
          )}
        />
      ) : (
        <div
          className="flex h-full min-h-[72px] w-full items-end p-2"
          style={{
            background: `linear-gradient(145deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, black) 100%)`,
          }}
        >
          <div className="size-6 rounded-full bg-white/25" />
        </div>
      ),
      "overflow-hidden",
    );
  }

  if (node.type === "Icon") {
    const color = COLOR_VAR[(node.props.color as ColorToken) || "primary"];
    const url = String(resolveProp(node, "url", scope) ?? "");
    const size = Number(node.props.size ?? 24);
    return wrap(
      url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="object-contain" style={{ width: size, height: size }} />
      ) : (
        <MaterialIcon name={String(node.props.name ?? "star")} color={color} size={size} />
      ),
      "w-auto inline-flex",
    );
  }

  if (node.type === "ListItem") {
    return wrap(
      <div className="flex min-h-[56px] items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]">
          <MaterialIcon name={String(node.props.leadingIcon ?? "star")} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-medium tracking-[0.15px] text-[var(--md-on-surface)]">
            {String(resolveProp(node, "headline", scope) ?? "")}
          </div>
          <div className="text-[14px] text-[var(--md-on-surface-variant)]">
            {String(resolveProp(node, "supporting", scope) ?? "")}
          </div>
        </div>
      </div>,
    );
  }

  if (node.type === "Divider") {
    return wrap(<div className="h-px w-full bg-[var(--md-outline-variant)]" />);
  }

  if (node.type === "Spacer") {
    return wrap(<div style={{ height: Number(node.props.height ?? 16) }} />);
  }

  if (node.type === "CircularProgress") {
    return wrap(
      <LoaderCircle
        className="animate-spin text-[var(--md-primary)]"
        size={Number(node.props.size ?? 40)}
      />,
      "w-auto inline-flex",
    );
  }

  return wrap(<div className="text-xs text-[var(--md-error)]">Unknown {node.type}</div>);
}

function NodeShell({
  node,
  scope,
  selected,
  interactive,
  onSelect,
  runAction,
  itemIndex,
  extraClass,
  extraStyle,
  children,
}: {
  node: UiNode;
  scope: BindingScope;
  selected: boolean;
  interactive: boolean;
  onSelect?: (id: string) => void;
  runAction: boolean;
  itemIndex: number;
  extraClass?: string;
  extraStyle?: CSSProperties;
  children: ReactNode;
}) {
  const runtime = useRuntime();
  const start = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef(0);
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consumed = useRef(false);

  const drag = useDraggable({
    id: `canvas-${node.id}`,
    data: { source: "canvas", nodeId: node.id, type: node.type },
    disabled: !interactive || node.type === "Scaffold",
  });
  const drop = useDroppable({
    id: `node-${node.id}`,
    data: {
      kind: isContainer(node.type) ? "container" : "reorder",
      targetId: node.id,
      nodeId: node.id,
    },
    disabled: !interactive || drag.isDragging,
  });
  const startWire = useDesigner((s) => s.startWire);
  const completeWire = useDesigner((s) => s.completeWire);
  const canvasWire = useDesigner((s) => s.canvasWire);

  function fire(event: TouchEvent, stop: { stopPropagation: () => void }) {
    const action = actionForEvent(node, event);
    if (runtime?.enabled && action && action.type !== "none") {
      stop.stopPropagation();
      runtime.dispatch(action, scope);
      return true;
    }
    return false;
  }

  function onPointerDown(event: ReactPointerEvent) {
    if (!runAction) return;
    start.current = { x: event.clientX, y: event.clientY };
    consumed.current = false;
    longTimer.current = setTimeout(() => {
      consumed.current = true;
      fire("longPress", event);
    }, 500);
  }

  function onPointerUp(event: ReactPointerEvent) {
    if (longTimer.current) {
      clearTimeout(longTimer.current);
      longTimer.current = null;
    }
    if (!runAction || consumed.current || !start.current) {
      start.current = null;
      return;
    }
    const classified = gestureFromDelta(event.clientX - start.current.x, event.clientY - start.current.y);
    start.current = null;
    if (classified !== "tap") {
      fire(classified, event);
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 320) {
      lastTap.current = 0;
      fire("doubleTap", event);
      return;
    }
    lastTap.current = now;
    fire("tap", event);
  }

  return (
    <div
      ref={(nodeEl) => {
        drag.setNodeRef(nodeEl);
        drop.setNodeRef(nodeEl);
      }}
      data-node-id={node.id}
      data-node-type={node.type}
      {...(interactive && node.type !== "Scaffold" ? drag.listeners : {})}
      {...(interactive && node.type !== "Scaffold" ? drag.attributes : {})}
      onPointerDown={runAction ? onPointerDown : undefined}
      onPointerUp={
        runAction
          ? onPointerUp
          : interactive
            ? (event) => {
                if (canvasWire && canvasWire.fromId !== node.id) {
                  event.stopPropagation();
                  const message = completeWire({ nodeId: node.id });
                  if (message) {
                    /* toast from designer overlay */
                  }
                }
              }
            : undefined
      }
      onPointerCancel={() => {
        if (longTimer.current) clearTimeout(longTimer.current);
        start.current = null;
      }}
      onClick={
        runAction
          ? undefined
          : interactive && onSelect
            ? (event) => {
                event.stopPropagation();
                onSelect(node.id);
              }
            : undefined
      }
      className={cn(
        "relative min-w-0 max-w-full",
        animationClass(node.animation),
        clipClass(node.modifiers.clip) || (isButtonType(node.type) ? "rounded-full" : ""),
        interactive && node.type !== "Scaffold" && "cursor-grab",
        runAction && "cursor-pointer",
        selected && interactive && "m3-selected",
        drop.isOver && interactive && (isContainer(node.type) ? "m3-drop-over" : "m3-drop-sibling"),
        drag.isDragging && "opacity-40",
        interactive && !runAction && !isContainer(node.type) && "[&>:not([data-chrome])]:pointer-events-none",
        extraClass,
      )}
      style={{
        ...(() => {
          const layout = modifierStyle(node.modifiers);
          if (isSurfaceType(node.type)) layout.background = undefined;
          return layout;
        })(),
        ...(isSurfaceType(node.type) ? {} : drawableStyle(node)),
        ...animationStyle(node.animation, itemIndex),
        ...extraStyle,
        touchAction: interactive || runAction ? "none" : undefined,
        userSelect: interactive ? "none" : undefined,
      }}
    >
      {children}
      {selected && interactive && node.type !== "Scaffold" ? (
        <span
          data-chrome="drag"
          title="Drag to move this widget"
          className="absolute -left-1 top-1 z-20 flex size-4 items-center justify-center rounded-sm bg-[#6750A4] text-white shadow"
        >
          <GripVertical className="size-3" />
        </span>
      ) : null}
      {selected && interactive ? (
        <button
          type="button"
          data-chrome="wire"
          data-wire-handle="1"
          title="Drag to another view or screen to wire"
          className="absolute -right-1 top-1 z-20 size-3 rounded-full bg-[#6750A4] ring-2 ring-white"
          onPointerDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
            startWire(node.id, event.clientX, event.clientY);
          }}
        />
      ) : null}
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--md-outline-variant)] px-3 py-6 text-center text-[11px] tracking-wide text-[var(--md-on-surface-variant)]">
      Drop into {label}
    </div>
  );
}

function SlotHint({ label }: { label: string }) {
  return (
    <div className="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-[1px] text-[var(--md-primary)]">
      Drop {label}
    </div>
  );
}

export function DropTarget({
  id,
  disabled,
  className,
  children,
}: {
  id: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }
  return (
    <ActiveDropTarget id={id} className={className}>
      {children}
    </ActiveDropTarget>
  );
}

function ActiveDropTarget({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { targetId: id, kind: String(id).includes("::") ? "slot" : "container" },
  });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && "m3-drop-over")}>
      {children}
    </div>
  );
}
