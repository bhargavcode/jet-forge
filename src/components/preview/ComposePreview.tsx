"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  Bell,
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
import { getByPath, resolveProp, type BindingScope } from "@/lib/bindings";
import type {
  ColorToken,
  EnterAnimation,
  IconName,
  ModifierSpec,
  NodeType,
  TextStyle,
  UiNode,
} from "@/lib/schema";
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
  return {
    width: modifiers.fillMaxWidth ? "100%" : dp(modifiers.widthDp),
    height: modifiers.fillMaxHeight ? "100%" : dp(modifiers.heightDp),
    flex: modifiers.weight ? modifiers.weight : undefined,
    ...paddingStyle(modifiers),
  };
}

function animationClass(animation?: EnterAnimation) {
  if (!animation || animation.type === "none") return "";
  return `m3-enter m3-enter-${animation.type}`;
}

function animationStyle(animation?: EnterAnimation, index = 0): CSSProperties {
  if (!animation || animation.type === "none") return {};
  const delay = (animation.delayMs ?? 0) + index * (animation.staggerMs ?? 0);
  return {
    animationDuration: `${animation.durationMs || 280}ms`,
    animationDelay: `${delay}ms`,
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
    <button type="button" className={cn("m3-ripple relative overflow-hidden", className)} style={style}>
      {children}
    </button>
  );
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
  const selected = selectedId === node.id;
  const select = (event: MouseEvent) => {
    if (!interactive || !onSelect) return;
    event.stopPropagation();
    onSelect(node.id);
  };

  const wrap = (content: ReactNode, extraClass = "", extraStyle?: CSSProperties) => (
    <div
      data-node-id={node.id}
      data-node-type={node.type}
      onClick={select}
      className={cn(
        "relative min-w-0",
        animationClass(node.animation),
        clipClass(node.modifiers.clip),
        interactive && "cursor-pointer",
        selected && interactive && "m3-selected",
        extraClass,
      )}
      style={{
        ...modifierStyle(node.modifiers),
        ...animationStyle(node.animation, itemIndex),
        ...extraStyle,
      }}
    >
      {content}
    </div>
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
    const items = getByPath(scope, node.itemBinding);
    const list = Array.isArray(items) ? items : [];
    const spacedBy = Number(node.props.spacedBy ?? 12);
    return wrap(
      <DropTarget id={node.id} disabled={!interactive} className="h-full overflow-y-auto">
        <div style={{ display: "flex", flexDirection: "column", gap: spacedBy }}>
        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--md-outline-variant)] px-3 py-8 text-center text-[12px] text-[var(--md-on-surface-variant)]">
            No items from `{node.itemBinding}`
          </div>
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
        className={cn(node.type === "LazyColumn" && "h-full overflow-y-auto")}
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
        <div className="min-w-0 flex-1 text-[22px] leading-7 text-[var(--md-on-surface)]">{title}</div>
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
    const selectedItem = Boolean(node.props.selected);
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
    return wrap(
      <RippleButton
        className={cn(
          "h-10 min-w-[48px] rounded-full px-6 text-[14px] font-medium tracking-[0.1px]",
          filled && "bg-[var(--md-primary)] text-[var(--md-on-primary)]",
          outlined && "border border-[var(--md-outline)] text-[var(--md-primary)] bg-transparent",
          node.type === "TextButton" && "text-[var(--md-primary)] px-3",
        )}
      >
        {label}
      </RippleButton>,
      "w-auto inline-flex",
    );
  }

  if (node.type === "Chip") {
    const label = String(resolveProp(node, "label", scope) ?? "Chip");
    return wrap(
      <div className="inline-flex h-8 items-center rounded-lg border border-[var(--md-outline-variant)] px-4 text-[14px] text-[var(--md-on-surface)]">
        {label}
      </div>,
      "w-auto inline-flex",
    );
  }

  if (node.type === "TextField") {
    const label = String(resolveProp(node, "label", scope) ?? "Label");
    const value = String(resolveProp(node, "value", scope) ?? "");
    const placeholder = String(node.props.placeholder ?? "");
    return wrap(
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium tracking-[0.5px] text-[var(--md-on-surface-variant)]">
          {label}
        </span>
        <div className="flex h-14 items-center rounded-t-md border-b-2 border-[var(--md-primary)] bg-[var(--md-surface-container-high)] px-4 text-[16px] text-[var(--md-on-surface)]">
          {value || <span className="text-[var(--md-on-surface-variant)]">{placeholder}</span>}
        </div>
      </label>,
    );
  }

  if (node.type === "Switch" || node.type === "Checkbox") {
    const label = String(resolveProp(node, "label", scope) ?? node.type);
    const checked = Boolean(node.props.checked);
    return wrap(
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="text-[16px] text-[var(--md-on-surface)]">{label}</span>
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
    const style = (node.props.style as TextStyle) || "bodyLarge";
    const color = (node.props.color as ColorToken) || "onSurface";
    return wrap(
      <div className={TYPE_SCALE[style]} style={{ color: COLOR_VAR[color] }}>
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
        <img src={url} alt={String(node.props.alt ?? "")} className="h-full w-full object-cover" />
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
    return wrap(
      <MaterialIcon name={String(node.props.name ?? "star")} color={color} size={Number(node.props.size ?? 24)} />,
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
    data: { targetId: id },
  });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && "m3-drop-over")}>
      {children}
    </div>
  );
}
