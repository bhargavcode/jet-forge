import { nanoid } from "nanoid";
import type { EnterAnimation, NodeType, UiNode } from "./schema";

export interface CatalogItem {
  type: NodeType;
  label: string;
  group: "Layout" | "Chrome" | "Actions" | "Input" | "Display" | "Overlay";
  hint: string;
}

export const CATALOG: CatalogItem[] = [
  { type: "Scaffold", label: "Scaffold", group: "Layout", hint: "Material screen shell" },
  { type: "Column", label: "Column", group: "Layout", hint: "Vertical stack" },
  { type: "Row", label: "Row", group: "Layout", hint: "Horizontal stack" },
  { type: "Box", label: "Box", group: "Layout", hint: "Overlay stack" },
  { type: "LazyColumn", label: "LazyColumn", group: "Layout", hint: "Scrolling list" },
  { type: "LazyRow", label: "LazyRow", group: "Layout", hint: "Horizontal scrolling list" },
  { type: "LazyVerticalGrid", label: "LazyVerticalGrid", group: "Layout", hint: "Scrolling grid" },
  { type: "Surface", label: "Surface", group: "Layout", hint: "Tonal Material surface" },
  { type: "HorizontalPager", label: "Horizontal pager", group: "Layout", hint: "Swipeable pages" },
  { type: "PullRefresh", label: "Pull refresh", group: "Layout", hint: "Swipe-to-refresh container" },
  { type: "Card", label: "Card", group: "Layout", hint: "Elevated surface" },
  { type: "TopAppBar", label: "Top app bar", group: "Chrome", hint: "Small Material 3 bar" },
  { type: "TabRow", label: "Tab row", group: "Chrome", hint: "Primary tabs" },
  { type: "Tab", label: "Tab", group: "Chrome", hint: "Tab destination" },
  { type: "NavigationDrawer", label: "Navigation drawer", group: "Chrome", hint: "Side navigation panel" },
  { type: "NavigationBar", label: "Navigation bar", group: "Chrome", hint: "Bottom destinations" },
  { type: "NavigationBarItem", label: "Nav item", group: "Chrome", hint: "Destination in the bar" },
  { type: "NavigationRail", label: "Navigation rail", group: "Chrome", hint: "Side destinations (tablet)" },
  { type: "NavigationRailItem", label: "Rail item", group: "Chrome", hint: "Destination in the rail" },
  { type: "FAB", label: "FAB", group: "Chrome", hint: "Floating action button" },
  { type: "IconButton", label: "Icon button", group: "Actions", hint: "Icon-only action" },
  { type: "FilledButton", label: "Filled button", group: "Actions", hint: "Primary action" },
  { type: "TonalButton", label: "Tonal button", group: "Actions", hint: "Secondary filled" },
  { type: "ElevatedButton", label: "Elevated button", group: "Actions", hint: "Raised surface" },
  { type: "OutlinedButton", label: "Outlined button", group: "Actions", hint: "Secondary action" },
  { type: "TextButton", label: "Text button", group: "Actions", hint: "Tertiary action" },
  { type: "Chip", label: "Chip", group: "Actions", hint: "Assist chip" },
  { type: "SegmentedButton", label: "Segmented button", group: "Actions", hint: "Single-choice segments" },
  { type: "SegmentedButtonItem", label: "Segment item", group: "Actions", hint: "Segment in a row" },
  { type: "DropdownMenu", label: "Dropdown menu", group: "Actions", hint: "Overflow menu" },
  { type: "DropdownMenuItem", label: "Menu item", group: "Actions", hint: "Dropdown row" },
  { type: "ExposedDropdownMenu", label: "Exposed dropdown", group: "Input", hint: "Select from options" },
  { type: "TextField", label: "Text field", group: "Input", hint: "Filled text field" },
  { type: "SearchBar", label: "Search bar", group: "Input", hint: "M3 search field" },
  { type: "Switch", label: "Switch", group: "Input", hint: "On / off toggle" },
  { type: "Checkbox", label: "Checkbox", group: "Input", hint: "Binary choice" },
  { type: "Slider", label: "Slider", group: "Input", hint: "Continuous value" },
  { type: "RadioButton", label: "Radio button", group: "Input", hint: "Single choice" },
  { type: "DatePicker", label: "Date picker", group: "Input", hint: "Pick a date" },
  { type: "TimePicker", label: "Time picker", group: "Input", hint: "Pick a time" },
  { type: "Text", label: "Text", group: "Display", hint: "Typography role" },
  { type: "Image", label: "Image", group: "Display", hint: "Remote or bound image" },
  { type: "Icon", label: "Icon", group: "Display", hint: "Material icon" },
  { type: "ListItem", label: "List item", group: "Display", hint: "Headline + supporting" },
  { type: "Divider", label: "Divider", group: "Display", hint: "Hairline separator" },
  { type: "Spacer", label: "Spacer", group: "Display", hint: "Fixed gap" },
  { type: "CircularProgress", label: "Progress", group: "Display", hint: "Indeterminate spinner" },
  { type: "LinearProgressIndicator", label: "Linear progress", group: "Display", hint: "Horizontal progress bar" },
  { type: "Badge", label: "Badge", group: "Display", hint: "Notification badge" },
  { type: "Tooltip", label: "Tooltip", group: "Display", hint: "Hover hint" },
  { type: "Dialog", label: "Dialog", group: "Overlay", hint: "Alert dialog" },
  { type: "BottomSheet", label: "Bottom sheet", group: "Overlay", hint: "Modal bottom sheet" },
  { type: "Snackbar", label: "Snackbar", group: "Overlay", hint: "Brief message" },
];

export const DEFAULT_ANIMATION: EnterAnimation = {
  type: "fade",
  durationMs: 280,
  delayMs: 0,
  staggerMs: 40,
};

function id() {
  return nanoid(8);
}

export function createNode(type: NodeType): UiNode {
  const base: UiNode = {
    id: id(),
    type,
    props: {},
    modifiers: { fillMaxWidth: type !== "Icon" && type !== "FAB" && type !== "CircularProgress" },
    animation: { ...DEFAULT_ANIMATION, type: type === "Scaffold" ? "none" : "fade" },
    children: [],
  };

  switch (type) {
    case "Scaffold":
      return { ...base, modifiers: { fillMaxWidth: true, fillMaxHeight: true } };
    case "Column":
      return {
        ...base,
        props: { arrangement: "top", alignment: "start", spacedBy: 12 },
        modifiers: { fillMaxWidth: true, padding: { all: 16 } },
      };
    case "Row":
      return {
        ...base,
        props: { arrangement: "start", alignment: "center", spacedBy: 12 },
        modifiers: { fillMaxWidth: true },
      };
    case "Box":
      return { ...base, props: { alignment: "topStart" } };
    case "LazyColumn":
      return {
        ...base,
        props: { spacedBy: 12 },
        modifiers: { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 16 } },
        itemBinding: "",
      };
    case "LazyRow":
      return {
        ...base,
        props: { spacedBy: 12 },
        modifiers: { fillMaxWidth: true, heightDp: 120 },
        itemBinding: "",
      };
    case "LazyVerticalGrid":
      return {
        ...base,
        props: { spacedBy: 12, columns: 2 },
        modifiers: { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 16 } },
        itemBinding: "",
      };
    case "Surface":
      return {
        ...base,
        props: { tonalElevation: 1 },
        modifiers: { fillMaxWidth: true, padding: { all: 16 }, clip: "medium" },
      };
    case "HorizontalPager":
      return {
        ...base,
        props: { pageCount: 3, currentPage: 0 },
        modifiers: { fillMaxWidth: true, heightDp: 200 },
        children: [
          { ...createNode("Text"), props: { text: "Page 1", style: "titleMedium", color: "onSurface" } },
          { ...createNode("Text"), props: { text: "Page 2", style: "titleMedium", color: "onSurface" } },
          { ...createNode("Text"), props: { text: "Page 3", style: "titleMedium", color: "onSurface" } },
        ],
      };
    case "Card":
      return {
        ...base,
        props: { variant: "elevated" },
        modifiers: { fillMaxWidth: true, padding: { all: 16 }, clip: "medium" },
        animation: { type: "slideUp", durationMs: 320, delayMs: 0, staggerMs: 50 },
      };
    case "TopAppBar":
      return {
        ...base,
        slot: "topBar",
        props: { title: "Title", navigationIcon: "menu" },
        modifiers: { fillMaxWidth: true },
        animation: { type: "none", durationMs: 0, delayMs: 0 },
      };
    case "TabRow":
      return {
        ...base,
        modifiers: { fillMaxWidth: true },
        animation: { type: "none", durationMs: 0, delayMs: 0 },
        children: [
          { ...createNode("Tab"), props: { label: "Tab 1", selected: true } },
          { ...createNode("Tab"), props: { label: "Tab 2", selected: false } },
          { ...createNode("Tab"), props: { label: "Tab 3", selected: false } },
        ],
      };
    case "Tab":
      return {
        ...base,
        props: { label: "Tab", selected: false },
        modifiers: {},
        animation: { type: "none", durationMs: 0, delayMs: 0 },
      };
    case "NavigationDrawer":
      return {
        ...base,
        props: { title: "Menu" },
        modifiers: { widthDp: 280, fillMaxHeight: true, padding: { all: 16 } },
        children: [
          { ...createNode("ListItem"), props: { headline: "Home", leadingIcon: "home" } },
          { ...createNode("ListItem"), props: { headline: "Settings", leadingIcon: "settings" } },
        ],
      };
    case "NavigationBar":
      return {
        ...base,
        slot: "bottomBar",
        modifiers: { fillMaxWidth: true },
        animation: { type: "none", durationMs: 0, delayMs: 0 },
        children: [
          createNode("NavigationBarItem"),
          {
            ...createNode("NavigationBarItem"),
            props: { label: "Search", icon: "search", selected: false },
          },
        ],
      };
    case "NavigationBarItem":
      return {
        ...base,
        props: { label: "Home", icon: "home", selected: true },
        modifiers: {},
        animation: { type: "none", durationMs: 0, delayMs: 0 },
      };
    case "NavigationRail":
      return {
        ...base,
        slot: "rail",
        modifiers: { widthDp: 80, fillMaxHeight: true },
        animation: { type: "none", durationMs: 0, delayMs: 0 },
        children: [
          createNode("NavigationRailItem"),
          {
            ...createNode("NavigationRailItem"),
            props: { label: "Search", icon: "search", selected: false },
          },
        ],
      };
    case "NavigationRailItem":
      return {
        ...base,
        props: { label: "Home", icon: "home", selected: true },
        modifiers: {},
        animation: { type: "none", durationMs: 0, delayMs: 0 },
      };
    case "IconButton":
      return {
        ...base,
        props: {
          icon: "settings",
          iconButtonVariant: "standard",
          enabled: true,
          contentDescription: "Settings",
        },
        modifiers: {},
      };
    case "ExposedDropdownMenu":
      return {
        ...base,
        props: { label: "Category", value: "Option 1", expanded: true, enabled: true },
        modifiers: { fillMaxWidth: true, widthDp: 240 },
        children: [
          { ...createNode("DropdownMenuItem"), props: { label: "Option 1" } },
          { ...createNode("DropdownMenuItem"), props: { label: "Option 2" } },
          { ...createNode("DropdownMenuItem"), props: { label: "Option 3" } },
        ],
      };
    case "PullRefresh":
      return {
        ...base,
        props: { refreshing: false },
        modifiers: { fillMaxWidth: true, fillMaxHeight: true },
        children: [
          {
            ...createNode("LazyColumn"),
            modifiers: { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 16 } },
            children: [
              { ...createNode("ListItem"), props: { headline: "Item 1", leadingIcon: "star" } },
              { ...createNode("ListItem"), props: { headline: "Item 2", leadingIcon: "favorite" } },
            ],
          },
        ],
      };
    case "FAB":
      return {
        ...base,
        slot: "fab",
        props: { icon: "add", contentDescription: "Create" },
        modifiers: {},
        animation: { type: "scale", durationMs: 240, delayMs: 120 },
      };
    case "FilledButton":
    case "TonalButton":
    case "ElevatedButton":
    case "OutlinedButton":
    case "TextButton":
      return {
        ...base,
        props: {
          label: type === "FilledButton" ? "Confirm" : "Action",
          textAlign: "center",
          style: "labelLarge",
          color:
            type === "FilledButton"
              ? "onPrimary"
              : type === "TonalButton"
                ? "onSecondaryContainer"
                : "primary",
          enabled: true,
        },
        modifiers: {
          fillMaxWidth: type === "FilledButton" || type === "ElevatedButton",
          clip: "full",
          elevationDp: type === "ElevatedButton" ? 2 : undefined,
        },
      };
    case "Chip":
      return {
        ...base,
        props: {
          label: "Filter",
          textAlign: "center",
          style: "labelLarge",
          color: "onSurface",
          enabled: true,
        },
        modifiers: { clip: "full" },
      };
    case "SegmentedButton":
      return {
        ...base,
        modifiers: { fillMaxWidth: true },
        children: [
          { ...createNode("SegmentedButtonItem"), props: { label: "Day", selected: true } },
          { ...createNode("SegmentedButtonItem"), props: { label: "Week", selected: false } },
          { ...createNode("SegmentedButtonItem"), props: { label: "Month", selected: false } },
        ],
      };
    case "SegmentedButtonItem":
      return {
        ...base,
        props: { label: "Segment", selected: false },
        modifiers: {},
        animation: { type: "none", durationMs: 0, delayMs: 0 },
      };
    case "DropdownMenu":
      return {
        ...base,
        props: { label: "Menu" },
        modifiers: { widthDp: 200 },
        children: [
          { ...createNode("DropdownMenuItem"), props: { label: "Edit" } },
          { ...createNode("DropdownMenuItem"), props: { label: "Share" } },
          { ...createNode("DropdownMenuItem"), props: { label: "Delete" } },
        ],
      };
    case "DropdownMenuItem":
      return {
        ...base,
        props: { label: "Item" },
        modifiers: { fillMaxWidth: true },
        animation: { type: "none", durationMs: 0, delayMs: 0 },
      };
    case "TextField":
      return {
        ...base,
        props: {
          label: "Search",
          placeholder: "Hint text",
          value: "",
          textAlign: "start",
          style: "bodyLarge",
          color: "onSurface",
          enabled: true,
        },
        modifiers: { fillMaxWidth: true, clip: "extraSmall" },
      };
    case "SearchBar":
      return {
        ...base,
        props: {
          query: "",
          placeholder: "Search",
          active: false,
        },
        modifiers: { fillMaxWidth: true },
      };
    case "Switch":
      return { ...base, props: { label: "Notifications", checked: true }, modifiers: { fillMaxWidth: true } };
    case "Checkbox":
      return { ...base, props: { label: "Remember me", checked: false }, modifiers: { fillMaxWidth: true } };
    case "Slider":
      return {
        ...base,
        props: { value: 0.5, valueMin: 0, valueMax: 100, enabled: true },
        modifiers: { fillMaxWidth: true },
      };
    case "RadioButton":
      return {
        ...base,
        props: { label: "Option", selected: false, enabled: true },
        modifiers: { fillMaxWidth: true },
      };
    case "DatePicker":
      return {
        ...base,
        props: { date: "2026-08-27", enabled: true },
        modifiers: { fillMaxWidth: true },
      };
    case "TimePicker":
      return {
        ...base,
        props: { time: "18:30", enabled: true },
        modifiers: { fillMaxWidth: true },
      };
    case "Dialog":
      return {
        ...base,
        props: {
          title: "Dialog title",
          message: "Dialog body text goes here.",
          confirmLabel: "OK",
          dismissLabel: "Cancel",
        },
        modifiers: { fillMaxWidth: true, widthDp: 320 },
      };
    case "BottomSheet":
      return {
        ...base,
        props: { title: "Bottom sheet" },
        modifiers: { fillMaxWidth: true, padding: { all: 16 } },
        children: [{ ...createNode("Text"), props: { text: "Sheet content", style: "bodyLarge", color: "onSurface" } }],
      };
    case "Snackbar":
      return {
        ...base,
        props: { message: "Snackbar message", actionLabel: "Undo" },
        modifiers: { fillMaxWidth: true },
        animation: { type: "slideUp", durationMs: 240, delayMs: 0 },
      };
    case "Tooltip":
      return {
        ...base,
        props: { text: "Tooltip hint" },
        modifiers: {},
        children: [{ ...createNode("Icon"), props: { name: "star", color: "primary", size: 24 } }],
      };
    case "Badge":
      return {
        ...base,
        props: { count: 3 },
        modifiers: {},
        children: [{ ...createNode("Icon"), props: { name: "notifications", color: "onSurface", size: 24 } }],
      };
    case "Text":
      return {
        ...base,
        props: { text: "Headline", style: "titleLarge", color: "onSurface" },
        modifiers: { fillMaxWidth: true },
      };
    case "Image":
      return {
        ...base,
        props: {
          url: "https://picsum.photos/seed/jetforge/320/200",
          alt: "Image",
          accent: "#6750A4",
          contentScale: "fit",
        },
        modifiers: { widthMode: "wrap", heightMode: "wrap", clip: "medium" },
      };
    case "Icon":
      return { ...base, props: { name: "star", color: "primary", size: 24 }, modifiers: {} };
    case "ListItem":
      return {
        ...base,
        props: {
          headline: "List item",
          supporting: "Supporting text",
          leadingIcon: "star",
        },
        modifiers: { fillMaxWidth: true, padding: { top: 8, bottom: 8 } },
      };
    case "Divider":
      return { ...base, modifiers: { fillMaxWidth: true }, animation: { type: "none", durationMs: 0, delayMs: 0 } };
    case "Spacer":
      return { ...base, props: { height: 16 }, modifiers: { fillMaxWidth: true }, animation: { type: "none", durationMs: 0, delayMs: 0 } };
    case "CircularProgress":
      return { ...base, props: { size: 40 }, modifiers: {} };
    case "LinearProgressIndicator":
      return {
        ...base,
        props: { progress: 0.65, indeterminate: false },
        modifiers: { fillMaxWidth: true },
      };
    default:
      return base;
  }
}

export const BINDABLE_PROPS: Partial<Record<NodeType, { key: string; label: string }[]>> = {
  Text: [
    { key: "text", label: "Text" },
    { key: "color", label: "Color token" },
  ],
  Image: [
    { key: "url", label: "Image URL (API)" },
    { key: "accent", label: "Placeholder color" },
    { key: "alt", label: "contentDescription" },
  ],
  Icon: [
    { key: "url", label: "Custom icon URL" },
    { key: "name", label: "Icon name" },
    { key: "color", label: "Tint" },
  ],
  FilledButton: [
    { key: "label", label: "Label" },
    { key: "color", label: "Text color" },
  ],
  OutlinedButton: [
    { key: "label", label: "Label" },
    { key: "color", label: "Text color" },
  ],
  TextButton: [
    { key: "label", label: "Label" },
    { key: "color", label: "Text color" },
  ],
  Chip: [
    { key: "label", label: "Label" },
    { key: "color", label: "Text color" },
  ],
  TopAppBar: [{ key: "title", label: "Title" }],
  TextField: [
    { key: "value", label: "Value" },
    { key: "label", label: "Label" },
  ],
  ListItem: [
    { key: "headline", label: "Headline" },
    { key: "supporting", label: "Supporting" },
  ],
  LazyColumn: [{ key: "itemBinding", label: "List items" }],
  LazyRow: [{ key: "itemBinding", label: "List items" }],
  LazyVerticalGrid: [{ key: "itemBinding", label: "Grid items" }],
  Column: [{ key: "itemBinding", label: "List items" }],
  Row: [{ key: "itemBinding", label: "List items" }],
  Card: [{ key: "variant", label: "Variant" }],
  Switch: [{ key: "label", label: "Label" }],
  Checkbox: [{ key: "label", label: "Label" }],
  SearchBar: [
    { key: "query", label: "Query" },
    { key: "placeholder", label: "Placeholder" },
  ],
  Dialog: [
    { key: "title", label: "Title" },
    { key: "message", label: "Message" },
  ],
  Snackbar: [
    { key: "message", label: "Message" },
    { key: "actionLabel", label: "Action label" },
  ],
  DatePicker: [{ key: "date", label: "Date" }],
  ExposedDropdownMenu: [
    { key: "value", label: "Selected value" },
    { key: "label", label: "Label" },
  ],
  IconButton: [{ key: "icon", label: "Icon name" }],
  NavigationRailItem: [{ key: "label", label: "Label" }],
  PullRefresh: [{ key: "refreshing", label: "Refreshing" }],
};
