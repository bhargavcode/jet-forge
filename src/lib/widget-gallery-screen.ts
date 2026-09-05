import { CATALOG, createNode } from "./catalog";
import type { ScreenDef, UiNode } from "./schema";

function sectionTitle(text: string): UiNode {
  const title = createNode("Text");
  title.props = { text, style: "titleMedium", color: "primary" };
  title.modifiers = { fillMaxWidth: true };
  return title;
}

function caption(text: string): UiNode {
  const node = createNode("Text");
  node.props = { text, style: "bodySmall", color: "onSurfaceVariant" };
  node.modifiers = { fillMaxWidth: true };
  return node;
}

const SKIP = new Set<UiNode["type"]>([
  "Scaffold",
  "Tab",
  "NavigationBarItem",
  "NavigationRailItem",
  "SegmentedButtonItem",
  "DropdownMenuItem",
]);

function demoFor(type: UiNode["type"]): UiNode | null {
  if (SKIP.has(type)) return null;
  const node = createNode(type);

  switch (type) {
    case "Text":
      node.props = { text: "Sample headline", style: "titleLarge", color: "onSurface" };
      break;
    case "Image":
      node.props = {
        url: "https://picsum.photos/seed/widgets/240/140",
        alt: "Demo image",
        accent: "#6750A4",
        contentScale: "fit",
      };
      node.modifiers = { widthMode: "wrap", heightMode: "wrap", clip: "medium" };
      break;
    case "Icon":
      node.props = { name: "favorite", color: "primary", size: 28 };
      break;
    case "FilledButton":
    case "TonalButton":
    case "ElevatedButton":
    case "OutlinedButton":
    case "TextButton":
      node.props = { ...node.props, label: type.replace("Button", "") };
      break;
    case "TextField":
      node.props = { ...node.props, label: "Email", value: "demo@jetforge.app", placeholder: "you@example.com" };
      break;
    case "SearchBar":
      node.props = { ...node.props, query: "Compose widgets", placeholder: "Search" };
      break;
    case "Switch":
      node.props = { label: "Notifications", checked: true };
      break;
    case "Checkbox":
      node.props = { label: "Remember me", checked: true };
      break;
    case "Slider":
      node.props = { ...node.props, value: 0.4 };
      break;
    case "RadioButton":
      node.props = { label: "Option A", selected: true, enabled: true };
      break;
    case "Chip":
      node.props = { ...node.props, label: "Assist chip" };
      break;
    case "ListItem":
      node.props = {
        headline: "List item",
        supporting: "Supporting dummy text",
        leadingIcon: "person",
      };
      break;
    case "CircularProgress":
      node.props = { size: 36 };
      break;
    case "LinearProgressIndicator":
      node.props = { progress: 0.55, indeterminate: false };
      break;
    case "Badge":
      node.props = { ...node.props, count: 3 };
      break;
    case "Tooltip":
      node.props = { text: "Tooltip hint" };
      break;
    case "Dialog":
      node.props = {
        title: "Dialog",
        message: "Dummy dialog body with sample copy.",
        confirmLabel: "OK",
        dismissLabel: "Cancel",
      };
      break;
    case "BottomSheet":
      node.props = { title: "Bottom sheet" };
      break;
    case "Snackbar":
      node.props = { message: "Saved successfully", actionLabel: "Undo" };
      break;
    case "DatePicker":
      node.props = { date: "2026-08-30", enabled: true };
      break;
    case "TimePicker":
      node.props = { time: "16:30", enabled: true };
      break;
    case "TopAppBar":
      node.slot = undefined;
      node.props = { title: "Demo app bar", navigationIcon: "menu" };
      break;
    case "FAB":
      node.slot = undefined;
      break;
    case "Column":
    case "Row":
    case "Box":
    case "Card":
    case "Surface": {
      const child = createNode("Text");
      child.props = { text: `${type} child`, style: "bodyMedium", color: "onSurface" };
      node.children = [caption(`${type} container`), child];
      break;
    }
    case "LazyColumn":
    case "LazyRow": {
      const second = createNode("ListItem");
      second.props = { headline: "Second row", supporting: "Dummy data", leadingIcon: "star" };
      node.children = [createNode("ListItem"), second];
      node.modifiers = {
        fillMaxWidth: true,
        heightDp: type === "LazyRow" ? 120 : 160,
        padding: { all: 8 },
      };
      break;
    }
    case "LazyVerticalGrid":
      node.modifiers = { fillMaxWidth: true, heightDp: 160, padding: { all: 8 } };
      node.children = [createNode("Card"), createNode("Card")];
      break;
    case "NavigationBar":
    case "NavigationRail":
    case "NavigationDrawer":
      node.slot = undefined;
      break;
    case "HorizontalPager":
      node.modifiers = { fillMaxWidth: true, heightDp: 120 };
      break;
    case "PullRefresh":
      node.modifiers = { fillMaxWidth: true, heightDp: 160 };
      break;
    case "Spacer":
      node.props = { height: 12 };
      break;
    default:
      break;
  }

  return node;
}

/** Screen showcasing every palette widget with dummy data. */
export function createWidgetGalleryScreen(): ScreenDef {
  const scaffold = createNode("Scaffold");
  const topBar = createNode("TopAppBar");
  topBar.slot = "topBar";
  topBar.props = { title: "Widget gallery", navigationIcon: "widgets" };

  const column = createNode("Column");
  column.props = { arrangement: "top", alignment: "start", spacedBy: 12 };
  column.modifiers = { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 16 } };

  const intro = createNode("Text");
  intro.props = {
    text: "Examples of every widget with dummy data. Select a view and drag blue dots to constrain siblings.",
    style: "bodyMedium",
    color: "onSurfaceVariant",
  };

  const children: UiNode[] = [intro];
  let currentGroup = "";
  for (const item of CATALOG) {
    if (item.group !== currentGroup) {
      currentGroup = item.group;
      children.push(sectionTitle(currentGroup));
    }
    const demo = demoFor(item.type);
    if (!demo) continue;
    children.push(caption(item.label));
    children.push(demo);
  }

  column.children = children;
  scaffold.children = [topBar, column];

  return {
    id: "widget-gallery",
    name: "Widget gallery",
    route: "/widget-gallery",
    root: scaffold,
    dataSourceIds: [],
    flowX: 56,
    flowY: 420,
  };
}
