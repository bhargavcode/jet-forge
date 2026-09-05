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
  ScrollAxis,
  TextStyle,
  TouchEvent,
  UiNode,
} from "@/lib/schema";
import { containerLayoutStyle } from "@/lib/layout";
import { useDesigner } from "@/lib/store";
import { SelectionChrome } from "@/components/designer/SelectionChrome";
import { hostIdFromVirtual, isContainer, isVirtualNodeId } from "@/lib/tree";
import { isolateDragListeners } from "@/lib/dnd-bind";
import {
  contentJustify,
  cssTextAlign,
  defaultTextToken,
  defaultTypeScale,
  hasCustomSurface,
  isButtonType,
  isSurfaceType,
} from "@/lib/widget-chrome";
import { sliderPosition } from "@/lib/slider";
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
  secondaryContainer: "var(--md-secondary-container)",
  onSecondaryContainer: "var(--md-on-secondary-container)",
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
  // Always longhand — mixing `padding` with paddingLeft/etc. warns on React rerenders.
  if (p.all != null) {
    const value = dp(p.all);
    return {
      paddingTop: value,
      paddingRight: value,
      paddingBottom: value,
      paddingLeft: value,
    };
  }
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

function scrollOverflowClass(axis?: ScrollAxis) {
  // One axis only — CSS turns the other into auto if left unspecified, which shows both scrollbars.
  if (axis === "vertical") return "overflow-y-auto overflow-x-hidden";
  if (axis === "horizontal") return "overflow-x-auto overflow-y-hidden";
  return "overflow-hidden";
}

function insetPaddingStyle(modifiers: ModifierSpec): CSSProperties {
  const style: CSSProperties = {};
  if (modifiers.systemBarsPadding) style.paddingTop = "24px";
  if (modifiers.imePadding) style.paddingBottom = "48px";
  return style;
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
  ripple = true,
}: {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  ripple?: boolean;
}) {
  return (
    <div
      role="button"
      className={cn("relative overflow-hidden", ripple && "m3-ripple", className)}
      style={style}
    >
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
    letterSpacing: node.props.letterSpacing != null ? `${Number(node.props.letterSpacing)}px` : undefined,
    lineHeight: node.props.lineHeightDp != null ? `${Number(node.props.lineHeightDp)}px` : undefined,
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

function surfaceStyle(node: UiNode): CSSProperties {
  return {
    ...paintedSurface(node),
    ...insetPaddingStyle(node.modifiers),
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
      <div
        className="relative flex h-full min-h-0 flex-col"
        style={{ background: "var(--md-surface)", ...surfaceStyle(node) }}
      >
        {topBar ? (
          <ComposeNode
            node={topBar}
            scope={scope}
            selectedId={selectedId}
            onSelect={onSelect}
            interactive={interactive}
          />
        ) : interactive ? (
          <DropTarget
            id={`${node.id}::topBar`}
            className="pointer-events-auto absolute inset-x-0 top-0 z-20"
          >
            <SlotHint label="Top app bar" />
          </DropTarget>
        ) : null}
        <DropTarget
          id={`${node.id}::content`}
          className={cn(
            "relative min-h-0 min-w-0 flex-1",
            scrollOverflowClass(content.modifiers?.scrollAxis),
          )}
        >
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
            <DropTarget id={`${node.id}::fab`} className="absolute right-4 bottom-5 z-20">
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
          <DropTarget
            id={`${node.id}::bottomBar`}
            className="pointer-events-auto absolute inset-x-0 bottom-0 z-20"
          >
            <SlotHint label="Navigation bar" />
          </DropTarget>
        ) : null}
      </div>,
      "h-full",
    );
  }

  if ((node.type === "LazyColumn" || node.type === "LazyRow" || node.type === "LazyVerticalGrid") && node.itemBinding) {
    const list = resolveList(scope, node.itemBinding);
    const spacedBy = Number(node.props.spacedBy ?? 12);
    const isRow = node.type === "LazyRow";
    const isGrid = node.type === "LazyVerticalGrid";
    const columns = Number(node.props.columns ?? 2);
    return wrap(
      <DropTarget
        id={node.id}
        disabled={!interactive}
        className={cn("h-full min-w-0", isRow ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden")}
      >
        <div
          style={
            isGrid
              ? {
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gap: spacedBy,
                }
              : { display: "flex", flexDirection: isRow ? "row" : "column", gap: spacedBy }
          }
        >
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

  if (node.type === "LazyColumn" && node.itemBinding) {
    const list = resolveList(scope, node.itemBinding);
    const spacedBy = Number(node.props.spacedBy ?? 12);
    return wrap(
      <DropTarget id={node.id} disabled={!interactive} className="h-full min-w-0 overflow-y-auto overflow-x-hidden">
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

  if ((node.type === "Column" || node.type === "Row") && node.itemBinding) {
    const list = resolveList(scope, node.itemBinding);
    const spacedBy = Number(node.props.spacedBy ?? 8);
    return wrap(
      <DropTarget id={node.id} disabled={!interactive}>
        <div
          style={{
            ...containerLayoutStyle(node),
            gap: spacedBy,
            width: "100%",
          }}
        >
          {list.length === 0 ? (
            interactive ? (
              <div className="rounded-xl border border-dashed border-[var(--md-outline-variant)] px-3 py-8 text-center text-[12px] text-[var(--md-on-surface-variant)]">
                No items from `{node.itemBinding}`
              </div>
            ) : null
          ) : (
            list.map((item, index) => (
              <div key={index} style={{ display: "contents" }}>
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
    const dropId = isVirtualNodeId(node.id) ? `${hostIdFromVirtual(node.id)}::content` : node.id;
    const isLazy = node.type === "LazyColumn";
    return wrap(
      <DropTarget
        id={dropId}
        disabled={!interactive}
        className={cn(
          "min-w-0",
          (node.modifiers.fillMaxHeight || isLazy) && "h-full min-h-0",
          isLazy ? "overflow-y-auto overflow-x-hidden" : scrollOverflowClass(node.modifiers.scrollAxis),
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: spacedBy, width: "100%" }}>
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Column" /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "Row" || node.type === "LazyRow") {
    const spacedBy = Number(node.props.spacedBy ?? 8);
    const isLazy = node.type === "LazyRow";
    return wrap(
      <DropTarget
        id={node.id}
        disabled={!interactive}
        className={cn(
          "min-w-0",
          isLazy ? "overflow-x-auto overflow-y-hidden" : scrollOverflowClass(node.modifiers.scrollAxis),
        )}
        style={surfaceStyle(node)}
      >
        <div
          style={{
            ...containerLayoutStyle(node),
            gap: spacedBy,
            width: "100%",
          }}
        >
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label={node.type} /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "LazyVerticalGrid") {
    const spacedBy = Number(node.props.spacedBy ?? 12);
    const columns = Number(node.props.columns ?? 2);
    return wrap(
      <DropTarget
        id={node.id}
        disabled={!interactive}
        className="h-full min-h-0 min-w-0 overflow-y-auto overflow-x-hidden"
        style={surfaceStyle(node)}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: spacedBy,
            width: "100%",
          }}
        >
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="LazyVerticalGrid" /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "Surface") {
    const elevation = Number(node.props.tonalElevation ?? 1);
    return wrap(
      <DropTarget id={node.id} disabled={!interactive} style={surfaceStyle(node)}>
        <div
          className="min-h-[48px] rounded-xl bg-[var(--md-surface-container-low,#F3EDF7)]"
          style={{
            boxShadow: elevation > 0 ? `0 ${elevation}px ${elevation * 2}px rgb(0 0 0 / 12%)` : undefined,
            padding: node.modifiers.padding?.all ?? 16,
          }}
        >
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Surface" /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "HorizontalPager") {
    const currentPage = Number(node.props.currentPage ?? 0);
    const pageNode = children[currentPage] ?? children[0];
    return wrap(
      <DropTarget id={node.id} disabled={!interactive} className="relative">
        <div className="min-h-[120px]">
          {pageNode ? (
            <ComposeNode
              node={pageNode}
              scope={scope}
              selectedId={selectedId}
              onSelect={onSelect}
              interactive={interactive}
            />
          ) : interactive ? (
            <EmptyHint label="HorizontalPager pages" />
          ) : null}
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {(children.length ? children : [{ id: "p0" } as UiNode]).map((child, index) => (
            <span
              key={child.id}
              className={cn(
                "size-2 rounded-full",
                index === currentPage ? "bg-[var(--md-primary)]" : "bg-[var(--md-outline-variant)]",
              )}
            />
          ))}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "PullRefresh") {
    const refreshing = Boolean(node.props.refreshing);
    return wrap(
      <DropTarget id={node.id} disabled={!interactive} className="relative min-h-[120px]">
        {refreshing ? (
          <div className="absolute inset-x-0 top-2 z-10 flex justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-[var(--md-primary)] border-t-transparent" />
          </div>
        ) : null}
        <div className={cn(refreshing && "opacity-80")}>
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Refreshable content" /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "NavigationDrawer") {
    const title = String(node.props.title ?? "Menu");
    return wrap(
      <DropTarget id={node.id} disabled={!interactive}>
        <div className="flex min-h-[200px] flex-col bg-[var(--md-surface-container-low,#F3EDF7)] p-4">
          <div className="mb-4 text-[22px] font-normal text-[var(--md-on-surface)]">{title}</div>
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Drawer items" /> : null}
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "TabRow") {
    return wrap(
      <div className="flex border-b border-[var(--md-outline-variant)]">
        {children.length
          ? children.map((child) => (
              <ComposeNode
                key={child.id}
                node={child}
                scope={scope}
                selectedId={selectedId}
                onSelect={onSelect}
                interactive={interactive}
              />
            ))
          : interactive
            ? [<EmptyHint key="tabs" label="Tabs" />]
            : null}
      </div>,
    );
  }

  if (node.type === "Tab") {
    const label = String(node.props.label ?? "Tab");
    const selected = Boolean(node.props.selected);
    return wrap(
      <span
        className={cn(
          "inline-flex min-w-[48px] items-center justify-center px-4 py-3 text-[14px] font-medium",
          selected
            ? "border-b-2 border-[var(--md-primary)] text-[var(--md-primary)]"
            : "text-[var(--md-on-surface-variant)]",
        )}
      >
        {label}
      </span>,
      "w-auto inline-flex",
    );
  }

  if (node.type === "SegmentedButton") {
    return wrap(
      <div className="inline-flex rounded-full border border-[var(--md-outline)] p-1">
        {children.length
          ? children.map((child) => (
              <ComposeNode
                key={child.id}
                node={child}
                scope={scope}
                selectedId={selectedId}
                onSelect={onSelect}
                interactive={interactive}
              />
            ))
          : interactive
            ? <EmptyHint label="Segments" />
            : null}
      </div>,
      "w-auto",
    );
  }

  if (node.type === "SegmentedButtonItem") {
    const label = String(node.props.label ?? "Segment");
    const selected = Boolean(node.props.selected);
    return wrap(
      <span
        className={cn(
          "rounded-full px-4 py-1.5 text-[14px] font-medium",
          selected
            ? "bg-[var(--md-secondary-container,#E8DEF8)] text-[var(--md-on-secondary-container,#1D192B)]"
            : "text-[var(--md-on-surface)]",
        )}
      >
        {label}
      </span>,
      "w-auto inline-flex",
    );
  }

  if (node.type === "DropdownMenu") {
    const label = String(node.props.label ?? "Menu");
    return wrap(
      <DropTarget id={node.id} disabled={!interactive} className="relative w-auto">
        <div className="inline-flex min-h-10 items-center rounded-lg border border-[var(--md-outline)] px-4 text-[14px] text-[var(--md-on-surface)]">
          {label}
        </div>
        <div className="mt-1 min-w-[160px] rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] py-1 shadow-md">
          {children.length
            ? children.map((child) => (
                <ComposeNode
                  key={child.id}
                  node={child}
                  scope={scope}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  interactive={interactive}
                />
              ))
            : interactive
              ? <EmptyHint label="Menu items" />
              : null}
        </div>
      </DropTarget>,
      "w-auto",
    );
  }

  if (node.type === "DropdownMenuItem") {
    const label = String(node.props.label ?? "Item");
    return wrap(
      <div className="px-4 py-2 text-[14px] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)]">
        {label}
      </div>,
    );
  }

  if (node.type === "Box") {
    return wrap(
      <DropTarget
        id={node.id}
        disabled={!interactive}
        className={cn("relative min-w-0", scrollOverflowClass(node.modifiers.scrollAxis))}
      >
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
      { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
    );
  }

  if (node.type === "TopAppBar") {
    const title = String(resolveProp(node, "title", scope) ?? "Title");
    const nav = String(node.props.navigationIcon ?? "menu");
    const action = String(node.props.actionIcon ?? "notifications");
    const barStyle = String(node.props.barStyle ?? "small");
    const scrollBehavior = String(node.props.scrollBehavior ?? "pinned");
    const barHeight =
      barStyle === "large" ? "h-28" : barStyle === "medium" ? "h-24" : barStyle === "center" ? "h-16" : "h-16";
    return wrap(
      <div className={cn("relative flex items-center gap-3 bg-[var(--md-surface)] px-2", barHeight)}>
        {(barStyle === "medium" || barStyle === "large") && scrollBehavior !== "pinned" ? (
          <span className="absolute right-2 top-1 rounded bg-[var(--md-surface-container-high)] px-1.5 py-0.5 text-[10px] text-[var(--md-on-surface-variant)]">
            {scrollBehavior}
          </span>
        ) : null}
        {nav !== "none" ? (
          <span className="flex size-12 items-center justify-center text-[var(--md-on-surface)]">
            <MaterialIcon name={nav} />
          </span>
        ) : (
          <span className="size-12" />
        )}
        <div
          className={cn(
            "min-w-0 flex-1 text-[var(--md-on-surface)]",
            barStyle === "large" ? "text-[28px] leading-9" : barStyle === "medium" ? "text-[24px] leading-8" : "text-[22px] leading-7",
            barStyle === "center" && "text-center",
          )}
          style={{ color: resolveTextColor(node, "onSurface"), textAlign: barStyle === "center" ? "center" : cssTextAlign(node), ...maxLinesStyle(node) }}
        >
          {title}
        </div>
        {action !== "none" ? (
          <span className="flex size-12 items-center justify-center text-[var(--md-on-surface-variant)]">
            <MaterialIcon name={action} />
          </span>
        ) : (
          <span className="size-12" />
        )}
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

  if (node.type === "NavigationRail") {
    return wrap(
      <DropTarget id={node.id} disabled={!interactive}>
        <div className="flex h-full w-20 shrink-0 flex-col items-center gap-3 bg-[var(--md-surface-container)] py-3">
          {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Rail items" /> : null}
        </div>
      </DropTarget>,
      "h-full w-auto shrink-0",
    );
  }

  if (node.type === "NavigationRailItem") {
    const selectedItem =
      (runtime?.enabled && actionForEvent(node, "tap")?.screenId
        ? runtime.screenId === actionForEvent(node, "tap")?.screenId
        : Boolean(node.props.selected));
    const label = String(node.props.label ?? "Item");
    const icon = String(node.props.icon ?? "home");
    return wrap(
      <div className="flex w-full flex-col items-center gap-1 px-1">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl",
            selectedItem && "bg-[var(--md-secondary-container,#E8DEF8)] text-[var(--md-on-surface)]",
            !selectedItem && "text-[var(--md-on-surface-variant)]",
          )}
        >
          <MaterialIcon name={icon} size={24} />
        </div>
        <div
          className={cn(
            "max-w-full truncate text-center text-[12px] font-medium",
            selectedItem ? "text-[var(--md-on-surface)]" : "text-[var(--md-on-surface-variant)]",
          )}
        >
          {label}
        </div>
      </div>,
      "w-auto",
    );
  }

  if (node.type === "IconButton") {
    const icon = String(node.props.icon ?? "settings");
    const variant = String(node.props.iconButtonVariant ?? "standard");
    const enabled = node.props.enabled !== false;
    const custom = hasCustomSurface(node);
    const sizeClass =
      node.props.iconButtonSize === "small"
        ? "size-8"
        : node.props.iconButtonSize === "large"
          ? "size-12"
          : "size-10";
    const iconSize = node.props.iconButtonSize === "small" ? 18 : node.props.iconButtonSize === "large" ? 28 : 24;
    return wrap(
      <RippleButton
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          sizeClass,
          !custom && variant === "filled" && "bg-[var(--md-primary)] text-[var(--md-on-primary)]",
          !custom && variant === "filledTonal" && "bg-[var(--md-secondary-container,#E8DEF8)] text-[var(--md-on-secondary-container,#1D192B)]",
          !custom && variant === "outlined" && "border border-[var(--md-outline)] text-[var(--md-on-surface-variant)]",
          !custom && variant === "standard" && "text-[var(--md-on-surface-variant)]",
          !enabled && "opacity-[0.38]",
        )}
        style={custom ? paintedSurface(node) : undefined}
      >
        <MaterialIcon name={icon} size={iconSize} color="currentColor" />
      </RippleButton>,
      "w-auto inline-flex",
    );
  }

  if (node.type === "FAB") {
    const fabSize = String(node.props.fabSize ?? "default");
    const icon = String(node.props.icon ?? "add");
    const label = String(node.props.label ?? "");
    const sizeClass =
      fabSize === "small"
        ? "size-10 rounded-xl"
        : fabSize === "large"
          ? "size-24 rounded-[28px]"
          : fabSize === "extended"
            ? "h-14 min-w-[80px] rounded-2xl px-5"
            : "size-14 rounded-2xl";
    return wrap(
      <RippleButton
        className={cn(
          "inline-flex items-center justify-center gap-2 bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] m3-elev-3",
          sizeClass,
        )}
      >
        <MaterialIcon name={icon} color="currentColor" size={fabSize === "small" ? 20 : 24} />
        {fabSize === "extended" && label ? <span className="text-sm font-medium">{label}</span> : null}
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
          "flex min-h-10 min-w-[48px] w-full items-center gap-2 rounded-full px-6",
          typeScaleClass(node),
          contentJustify(node) === "center" && "justify-center",
          contentJustify(node) === "flex-end" && "justify-end",
          contentJustify(node) === "flex-start" && "justify-start",
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
    const variant = String(node.props.chipVariant ?? "assist");
    const selected = Boolean(node.props.selected);
    return wrap(
      <div
        className={cn(
          "inline-flex h-8 min-w-0 items-center gap-1.5 rounded-lg px-4",
          typeScaleClass(node),
          variant === "filter" && selected && "border border-[var(--md-primary)] bg-[var(--md-secondary-container)]",
          variant === "filter" && !selected && "border border-[var(--md-outline-variant)]",
          variant !== "filter" && !custom && "border border-[var(--md-outline-variant)] text-[var(--md-on-surface)]",
          variant === "suggestion" && "rounded-full",
          !enabled && "opacity-[0.38]",
        )}
        style={{
          color: resolveTextColor(node, "onSurface"),
          ...paintedSurface(node),
        }}
      >
        {icon && icon !== "none" ? <MaterialIcon name={icon} size={16} color="currentColor" /> : null}
        {label}
      </div>,
      "w-auto",
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
    const invalid = Boolean(node.props.isError) || Boolean(formId && fieldName && runtime?.formErrors[formId]?.[fieldName]);
    const variant = String(node.props.variant ?? "outlined");
    const leading = node.props.leadingIcon ? String(node.props.leadingIcon) : "";
    const trailing = node.props.trailingIcon ? String(node.props.trailingIcon) : "";
    const supporting = String(node.props.supportingText ?? "");
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
        <div className="relative flex items-center">
          {leading && leading !== "none" ? (
            <span className="absolute left-3 text-[var(--md-on-surface-variant)]">
              <MaterialIcon name={leading} size={20} />
            </span>
          ) : null}
          {runtime?.enabled && formId && fieldName ? (
            <input
              value={value}
              placeholder={placeholder}
              disabled={!enabled}
              readOnly={Boolean(node.props.readOnly)}
              onChange={(event) => runtime.setFormValue(formId, fieldName, event.target.value)}
              className={cn(
                "h-14 w-full px-4 outline-none",
                typeScaleClass(node),
                variant === "outlined" && "rounded-md border-2",
                variant === "filled" && "rounded-t-md border-b-2",
                leading && leading !== "none" && "pl-11",
                trailing && trailing !== "none" && "pr-11",
                !custom && variant === "filled" && "bg-[var(--md-surface-container-high)]",
                !custom && variant === "outlined" && "bg-transparent",
              )}
              style={fieldStyle}
            />
          ) : (
            <div
              className={cn(
                "flex h-14 w-full items-center px-4",
                typeScaleClass(node),
                variant === "outlined" && "rounded-md border-2",
                variant === "filled" && "rounded-t-md border-b-2",
                leading && leading !== "none" && "pl-11",
                trailing && trailing !== "none" && "pr-11",
                !custom && variant === "filled" && "bg-[var(--md-surface-container-high)]",
                !custom && variant === "outlined" && "bg-transparent",
              )}
              style={{ ...fieldStyle, justifyContent: contentJustify(node) }}
            >
              {value || <span className="text-[var(--md-on-surface-variant)]">{placeholder}</span>}
            </div>
          )}
          {trailing && trailing !== "none" ? (
            <span className="absolute right-3 text-[var(--md-on-surface-variant)]">
              <MaterialIcon name={trailing} size={20} />
            </span>
          ) : null}
        </div>
        {supporting ? (
          <span className={cn("mt-1 block text-[12px]", invalid ? "text-[var(--md-error)]" : "text-[var(--md-on-surface-variant)]")}>
            {supporting}
          </span>
        ) : null}
      </label>,
    );
  }

  if (node.type === "Slider") {
    const enabled = node.props.enabled !== false;
    const pct = `${Math.round(sliderPosition(node, scope) * 100)}%`;
    return wrap(
      <div className={cn("py-2", !enabled && "opacity-[0.38]")}>
        <div className="relative h-1 rounded-full bg-[var(--md-surface-container-highest,#E6E0E9)]">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--md-primary)]" style={{ width: pct }} />
          <span
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--md-primary)] bg-[var(--md-primary)]"
            style={{ left: pct }}
          />
        </div>
      </div>,
    );
  }

  if (node.type === "RadioButton") {
    const label = String(node.props.label ?? "Option");
    const selected = Boolean(node.props.selected);
    const enabled = node.props.enabled !== false;
    return wrap(
      <div className={cn("flex items-center gap-3 py-1", !enabled && "opacity-[0.38]")}>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full border-2",
            selected ? "border-[var(--md-primary)]" : "border-[var(--md-on-surface-variant)]",
          )}
        >
          {selected ? <span className="size-2.5 rounded-full bg-[var(--md-primary)]" /> : null}
        </span>
        <span className="text-[14px] text-[var(--md-on-surface)]">{label}</span>
      </div>,
    );
  }

  if (node.type === "Switch" || node.type === "Checkbox") {
    const label = String(resolveProp(node, "label", scope) ?? node.type);
    const checked = Boolean(node.props.checked);
    const enabled = node.props.enabled !== false;
    return wrap(
      <div className={cn("flex items-center justify-between gap-3 py-1", !enabled && "opacity-[0.38]")}>
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
    const scale = String(node.props.contentScale ?? "crop");
    const objectClass =
      scale === "fit"
        ? "object-contain"
        : scale === "fillBounds"
          ? "object-fill"
          : scale === "inside"
            ? "object-scale-down"
            : scale === "none"
              ? "object-none"
              : "object-cover";
    const alpha = node.props.imageAlpha != null ? Number(node.props.imageAlpha) : 1;
    const widthMode =
      node.modifiers.widthMode ?? (node.modifiers.fillMaxWidth ? "fill" : node.modifiers.widthDp != null ? "fixed" : "wrap");
    const heightMode =
      node.modifiers.heightMode ?? (node.modifiers.fillMaxHeight ? "fill" : node.modifiers.heightDp != null ? "fixed" : "wrap");
    const wrapSize = widthMode === "wrap" || heightMode === "wrap";
    return wrap(
      url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={String(node.props.alt ?? "")}
          className={cn(wrapSize ? "max-h-full max-w-full" : "h-full w-full", objectClass)}
          style={{ opacity: alpha }}
        />
      ) : (
        <div
          className={cn(
            "flex items-end p-2",
            wrapSize ? "h-[72px] w-[120px]" : "h-full min-h-[72px] w-full",
          )}
          style={{
            background: `linear-gradient(145deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, black) 100%)`,
            opacity: alpha,
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
    const leading = String(node.props.leadingIcon ?? "star");
    const trailing = node.props.trailingIcon ? String(node.props.trailingIcon) : "";
    return wrap(
      <div className="flex min-h-[56px] items-center gap-4">
        {leading && leading !== "none" ? (
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]">
            <MaterialIcon name={leading} size={20} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {node.props.overline ? (
            <div className="text-[11px] uppercase tracking-wide text-[var(--md-on-surface-variant)]">
              {String(node.props.overline)}
            </div>
          ) : null}
          <div className="text-[16px] font-medium tracking-[0.15px] text-[var(--md-on-surface)]">
            {String(resolveProp(node, "headline", scope) ?? "")}
          </div>
          <div className="text-[14px] text-[var(--md-on-surface-variant)]">
            {String(resolveProp(node, "supporting", scope) ?? "")}
          </div>
        </div>
        {trailing && trailing !== "none" ? <MaterialIcon name={trailing} size={20} /> : null}
      </div>,
    );
  }

  if (node.type === "SearchBar") {
    const query = String(resolveProp(node, "query", scope) ?? node.props.query ?? "");
    const placeholder = String(node.props.placeholder ?? "Search");
    const active = Boolean(node.props.active);
    return wrap(
      <div
        className={cn(
          "flex min-h-14 items-center gap-3 rounded-[28px] px-4",
          active ? "bg-[var(--md-surface-container-high)]" : "bg-[var(--md-surface-container-low,#F3EDF7)]",
        )}
      >
        <MaterialIcon name="search" size={24} color="var(--md-on-surface-variant)" />
        <span className={cn("flex-1 text-[16px]", query ? "text-[var(--md-on-surface)]" : "text-[var(--md-on-surface-variant)]")}>
          {query || placeholder}
        </span>
      </div>,
    );
  }

  if (node.type === "DatePicker") {
    const date = String(resolveProp(node, "date", scope) ?? node.props.date ?? "2026-08-27");
    return wrap(
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-4">
        <div className="mb-2 text-[12px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)]">Date</div>
        <div className="text-[22px] text-[var(--md-on-surface)]">{date}</div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--md-on-surface-variant)]">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <span key={d}>{d}</span>
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className={cn(
                "rounded-full py-1",
                i === 10 && "bg-[var(--md-primary)] text-[var(--md-on-primary)]",
              )}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  if (node.type === "TimePicker") {
    const time = String(resolveProp(node, "time", scope) ?? node.props.time ?? "12:00");
    return wrap(
      <div className="flex items-center justify-center gap-4 rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-6">
        <div className="relative size-24 rounded-full border-2 border-[var(--md-outline-variant)]">
          <span className="absolute left-1/2 top-1/2 h-8 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full bg-[var(--md-primary)]" />
          <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--md-primary)]" />
        </div>
        <div className="text-[32px] tabular-nums text-[var(--md-on-surface)]">{time}</div>
      </div>,
    );
  }

  if (node.type === "Dialog") {
    const title = String(resolveProp(node, "title", scope) ?? "Dialog title");
    const message = String(resolveProp(node, "message", scope) ?? "");
    const confirm = String(node.props.confirmLabel ?? "OK");
    const dismiss = String(node.props.dismissLabel ?? "Cancel");
    return wrap(
      <div className="relative rounded-[28px] bg-[var(--md-surface-container-high)] p-6 shadow-xl">
        <div className="text-[24px] leading-8 text-[var(--md-on-surface)]">{title}</div>
        {message ? <div className="mt-3 text-[14px] leading-5 text-[var(--md-on-surface-variant)]">{message}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <span className="rounded-full px-4 py-2 text-[14px] font-medium text-[var(--md-primary)]">{dismiss}</span>
          <span className="rounded-full bg-[var(--md-primary)] px-4 py-2 text-[14px] font-medium text-[var(--md-on-primary)]">
            {confirm}
          </span>
        </div>
      </div>,
    );
  }

  if (node.type === "BottomSheet") {
    const title = String(node.props.title ?? "Bottom sheet");
    return wrap(
      <DropTarget id={node.id} disabled={!interactive}>
        <div className="rounded-t-[28px] bg-[var(--md-surface-container-low,#F3EDF7)] pt-2 pb-4">
          <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-[var(--md-outline-variant)]" />
          <div className="px-4 text-[22px] text-[var(--md-on-surface)]">{title}</div>
          <div className="px-4 pt-3">
            {children.length ? renderChildren(scope) : interactive ? <EmptyHint label="Sheet content" /> : null}
          </div>
        </div>
      </DropTarget>,
    );
  }

  if (node.type === "Snackbar") {
    const message = String(resolveProp(node, "message", scope) ?? "Snackbar message");
    const action = String(node.props.actionLabel ?? "Undo");
    return wrap(
      <div className="flex min-h-12 items-center justify-between gap-4 rounded-[4px] bg-[var(--md-inverse-surface,#313033)] px-4 py-3 text-[var(--md-inverse-on-surface,#F4EFF4)]">
        <span className="text-[14px]">{message}</span>
        <span className="text-[14px] font-medium text-[var(--md-inverse-primary,#D0BCFF)]">{action}</span>
      </div>,
    );
  }

  if (node.type === "Badge") {
    const count = Number(node.props.count ?? 0);
    const label = node.props.label != null ? String(node.props.label) : count > 0 ? String(count) : "";
    return wrap(
      <div className="relative inline-flex w-auto">
        {children.length ? (
          children.map((child) => (
            <ComposeNode
              key={child.id}
              node={child}
              scope={scope}
              selectedId={selectedId}
              onSelect={onSelect}
              interactive={interactive}
            />
          ))
        ) : (
          <MaterialIcon name="notifications" size={24} />
        )}
        {label ? (
          <span className="absolute -right-1 -top-1 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--md-error)] px-1 text-[10px] font-medium text-[var(--md-on-error,#fff)]">
            {label}
          </span>
        ) : null}
      </div>,
      "w-auto inline-flex",
    );
  }

  if (node.type === "Tooltip") {
    const text = String(node.props.text ?? "Tooltip");
    return wrap(
      <div className="relative inline-flex w-auto flex-col items-center">
        <span className="mb-1 rounded-[4px] bg-[var(--md-inverse-surface,#313033)] px-2 py-1 text-[12px] text-[var(--md-inverse-on-surface,#F4EFF4)]">
          {text}
        </span>
        {children.length ? (
          children.map((child) => (
            <ComposeNode
              key={child.id}
              node={child}
              scope={scope}
              selectedId={selectedId}
              onSelect={onSelect}
              interactive={interactive}
            />
          ))
        ) : (
          <MaterialIcon name="star" size={24} />
        )}
      </div>,
      "w-auto inline-flex",
    );
  }

  if (node.type === "LinearProgressIndicator") {
    const indeterminate = Boolean(node.props.indeterminate);
    const progress = Number(node.props.progress ?? 0.65);
    const color = COLOR_VAR[(node.props.color as ColorToken) || "primary"] ?? "var(--md-primary)";
    return wrap(
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--md-surface-container-highest,#E6E0E9)]">
        {indeterminate ? (
          <div className="h-full w-1/3 animate-pulse rounded-full" style={{ background: color }} />
        ) : (
          <div className="h-full rounded-full" style={{ width: `${Math.round(progress * 100)}%`, background: color }} />
        )}
      </div>,
    );
  }

  if (node.type === "Divider") {
    const thickness = Number(node.props.thicknessDp ?? 1);
    const color = COLOR_VAR[(node.props.color as ColorToken) || "outline"] ?? "var(--md-outline-variant)";
    return wrap(<div className="w-full" style={{ height: thickness, background: color }} />);
  }

  if (node.type === "Spacer") {
    const height = Number(node.props.height ?? 16);
    const width = Number(node.props.width ?? 0);
    return wrap(
      <div style={{ height: width > 0 ? undefined : height, width: width > 0 ? width : undefined, minHeight: width > 0 ? height : undefined }} />,
    );
  }

  if (node.type === "CircularProgress") {
    const color = COLOR_VAR[(node.props.color as ColorToken) || "primary"] ?? "var(--md-primary)";
    return wrap(
      <LoaderCircle className="animate-spin" style={{ color }} size={Number(node.props.size ?? 40)} />,
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
  const shellRef = useRef<HTMLDivElement | null>(null);

  const dragLocked = !interactive || node.type === "Scaffold" || isVirtualNodeId(node.id);
  const drag = useDraggable({
    id: `canvas-${node.id}`,
    data: { source: "canvas", nodeId: node.id, type: node.type },
    disabled: dragLocked,
  });
  const dropHost = isVirtualNodeId(node.id) ? `${hostIdFromVirtual(node.id)}::content` : node.id;
  const drop = useDroppable({
    id: isVirtualNodeId(node.id) ? `node-slot-${dropHost}` : `node-${node.id}`,
    data: {
      kind: isVirtualNodeId(node.id) || isContainer(node.type) ? "container" : "reorder",
      targetId: dropHost,
      nodeId: isVirtualNodeId(node.id) ? hostIdFromVirtual(node.id) : node.id,
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
        shellRef.current = nodeEl;
        drag.setNodeRef(nodeEl);
        drop.setNodeRef(nodeEl);
      }}
      data-node-id={node.id}
      data-node-type={node.type}
      {...(!dragLocked ? drag.attributes : {})}
      {...(!dragLocked ? isolateDragListeners(drag.listeners) : {})}
      onPointerDown={
        runAction
          ? onPointerDown
          : (event) => {
              event.stopPropagation();
              if (interactive && onSelect && !isVirtualNodeId(node.id)) onSelect(node.id);
              if (!dragLocked) {
                (drag.listeners?.onPointerDown as ((e: ReactPointerEvent) => void) | undefined)?.(event);
              }
            }
      }
      onMouseDown={
        runAction || dragLocked
          ? undefined
          : (event) => {
              event.stopPropagation();
              if (interactive && onSelect && !isVirtualNodeId(node.id)) onSelect(node.id);
              (drag.listeners?.onMouseDown as ((e: typeof event) => void) | undefined)?.(event);
            }
      }
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
          : interactive && onSelect && !isVirtualNodeId(node.id)
            ? (event) => {
                event.stopPropagation();
                onSelect(node.id);
              }
            : undefined
      }
      className={cn(
        "relative min-w-0 max-w-full group/node",
        animationClass(node.animation),
        clipClass(node.modifiers.clip) || (isButtonType(node.type) ? "rounded-full" : ""),
        interactive && !dragLocked && "cursor-grab",
        runAction && "cursor-pointer",
        node.modifiers.clickable && !runAction && "cursor-pointer ring-1 ring-[var(--md-primary)]/25",
        node.modifiers.clickable && node.modifiers.rippleEnabled !== false && "m3-ripple overflow-hidden",
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
      {interactive && !dragLocked ? (
        <span
          data-chrome="drag"
          title="Drag to move above or below another widget"
          className={cn(
            "absolute left-1 top-1 z-30 flex size-5 items-center justify-center rounded-md bg-[#6750A4] text-white shadow-md",
            selected ? "opacity-100" : "opacity-70 group-hover/node:opacity-100",
          )}
        >
          <GripVertical className="size-3.5" />
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
      {selected && interactive ? <SelectionChrome node={node} shellRef={shellRef} /> : null}
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
    <div className="bg-[color-mix(in_srgb,var(--md-primary)_12%,transparent)] px-3 py-2 text-center text-[10px] font-medium uppercase tracking-[1px] text-[var(--md-primary)]">
      Drop {label}
    </div>
  );
}

export function DropTarget({
  id,
  disabled,
  className,
  style,
  children,
}: {
  id: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <ActiveDropTarget id={id} className={className} style={style}>
      {children}
    </ActiveDropTarget>
  );
}

function ActiveDropTarget({
  id,
  className,
  style,
  children,
}: {
  id: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { targetId: id, kind: String(id).includes("::") ? "slot" : "container" },
  });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && "m3-drop-over")} style={style}>
      {children}
    </div>
  );
}
