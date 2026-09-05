"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  AlignVerticalSpaceAround,
  AppWindow,
  BadgeCheck,
  Boxes,
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  Columns2,
  CreditCard,
  Grid2X2,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  LayoutPanelTop,
  List,
  LoaderCircle,
  Menu,
  MessageSquare,
  Minus,
  Navigation,
  PanelBottom,
  PanelLeft,
  Radio,
  RectangleHorizontal,
  Rows3,
  Search,
  SeparatorHorizontal,
  SlidersHorizontal,
  Square,
  Star,
  ToggleLeft,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATALOG, type CatalogItem } from "@/lib/catalog";
import { isolateDragListeners } from "@/lib/dnd-bind";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NodeType } from "@/lib/schema";

/** Android Studio Layout Editor–style palette icons */
const PALETTE_ICONS: Partial<Record<NodeType, LucideIcon>> = {
  Scaffold: AppWindow,
  Column: Rows3,
  Row: Columns2,
  Box: Square,
  LazyColumn: List,
  LazyRow: RectangleHorizontal,
  LazyVerticalGrid: Grid2X2,
  Surface: CreditCard,
  HorizontalPager: PanelBottom,
  PullRefresh: AlignVerticalSpaceAround,
  Card: CreditCard,
  TopAppBar: LayoutPanelTop,
  TabRow: PanelBottom,
  Tab: RectangleHorizontal,
  NavigationDrawer: PanelLeft,
  NavigationBar: Navigation,
  NavigationBarItem: Circle,
  NavigationRail: PanelLeft,
  NavigationRailItem: Circle,
  FAB: Star,
  IconButton: Circle,
  FilledButton: RectangleHorizontal,
  TonalButton: RectangleHorizontal,
  ElevatedButton: RectangleHorizontal,
  OutlinedButton: RectangleHorizontal,
  TextButton: Type,
  Chip: BadgeCheck,
  SegmentedButton: Columns2,
  SegmentedButtonItem: RectangleHorizontal,
  DropdownMenu: Menu,
  DropdownMenuItem: ChevronDown,
  ExposedDropdownMenu: ChevronDown,
  TextField: Type,
  SearchBar: Search,
  Switch: ToggleLeft,
  Checkbox: CheckSquare,
  Slider: SlidersHorizontal,
  RadioButton: Radio,
  DatePicker: Calendar,
  TimePicker: Calendar,
  Text: Type,
  Image: ImageIcon,
  Icon: Star,
  ListItem: List,
  Divider: SeparatorHorizontal,
  Spacer: Minus,
  CircularProgress: LoaderCircle,
  LinearProgressIndicator: SlidersHorizontal,
  Badge: BadgeCheck,
  Tooltip: MessageSquare,
  Dialog: AppWindow,
  BottomSheet: PanelBottom,
  Snackbar: MessageSquare,
};

function PaletteItem({ item, onAdd }: { item: CatalogItem; onAdd?: (type: NodeType) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: "palette", type: item.type },
  });
  const Icon = PALETTE_ICONS[item.type] ?? LayoutGrid;

  return (
    <button
      ref={setNodeRef}
      type="button"
      title={item.hint}
      {...attributes}
      {...isolateDragListeners(listeners)}
      className={cn(
        "group flex w-full cursor-grab flex-col items-center gap-1 rounded border border-transparent bg-[#F5F5F5] px-1 py-2 text-center hover:border-[#9E9E9E] hover:bg-white",
        "dark:bg-muted/40 dark:hover:border-border dark:hover:bg-muted",
        isDragging && "opacity-40",
      )}
      onClick={() => onAdd?.(item.type)}
    >
      <span className="relative flex size-9 items-center justify-center rounded-sm border border-[#BDBDBD] bg-white text-[#424242] shadow-sm dark:border-border dark:bg-background dark:text-foreground">
        <Icon className="size-4" strokeWidth={1.75} />
        <GripVertical className="absolute -left-0.5 top-0.5 size-2.5 text-[#9E9E9E] opacity-0 group-hover:opacity-100" />
      </span>
      <span className="w-full truncate px-0.5 text-[10px] leading-tight text-[#212121] dark:text-foreground">
        {item.label}
      </span>
    </button>
  );
}

const GROUPS: CatalogItem["group"][] = ["Layout", "Chrome", "Actions", "Input", "Display", "Overlay"];

export function Palette({ onAdd }: { onAdd?: (type: NodeType) => void }) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-2">
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#616161] dark:text-muted-foreground">
          <Boxes className="size-3.5" />
          Palette
        </div>
        {GROUPS.map((group) => (
          <div key={group} className="rounded border border-[#E0E0E0] bg-white dark:border-border dark:bg-card">
            <div className="border-b border-[#EEEEEE] bg-[#FAFAFA] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#757575] dark:border-border dark:bg-muted/40 dark:text-muted-foreground">
              {group}
            </div>
            <div className="grid grid-cols-2 gap-1 p-1.5 sm:grid-cols-3">
              {CATALOG.filter((item) => item.group === group).map((item) => (
                <PaletteItem key={item.type} item={item} onAdd={onAdd} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
