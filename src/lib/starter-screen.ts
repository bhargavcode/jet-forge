import type { ClickAction, ScreenDocument, UiNode } from "./schema";

const fade = (delay = 0) => ({ type: "fade" as const, durationMs: 280, delayMs: delay, staggerMs: 40 });
const none = { type: "none" as const, durationMs: 0, delayMs: 0 };

function node(
  id: string,
  type: UiNode["type"],
  extra: Partial<UiNode> = {},
): UiNode {
  return {
    id,
    type,
    props: extra.props ?? {},
    modifiers: extra.modifiers ?? { fillMaxWidth: true },
    animation: extra.animation ?? fade(),
    children: extra.children ?? [],
    bindings: extra.bindings,
    slot: extra.slot,
    itemBinding: extra.itemBinding,
    onClick: extra.onClick,
    formField: extra.formField,
    visibleWhen: extra.visibleWhen,
  };
}

const newsMock = {
  country: "US",
  status: "ok",
  articles: [
    {
      id: "1",
      title: "Senate reaches last-minute deal on federal funding",
      description: "Leaders said the stopgap keeps agencies open while talks continue on a longer bill.",
      source: "Associated Press",
      publishedAt: "2h ago",
      url: "https://apnews.com",
      image: "",
      accent: "#1B4B8A",
    },
    {
      id: "2",
      title: "West Coast storm knocks out power to hundreds of thousands",
      description: "Utilities warned of more outages as atmospheric river rains move inland.",
      source: "Reuters",
      publishedAt: "3h ago",
      url: "https://www.reuters.com",
      image: "",
      accent: "#0F766E",
    },
    {
      id: "3",
      title: "NASA target date set for next crewed Artemis flight",
      description: "Officials outlined remaining hardware tests before the lunar mission window.",
      source: "The Washington Post",
      publishedAt: "5h ago",
      url: "https://www.washingtonpost.com",
      image: "",
      accent: "#6750A4",
    },
    {
      id: "4",
      title: "Markets rally as inflation reading cools more than expected",
      description: "Investors priced in a gentler path for borrowing costs after the CPI print.",
      source: "Bloomberg",
      publishedAt: "6h ago",
      url: "https://www.bloomberg.com",
      image: "",
      accent: "#8B5000",
    },
  ],
};

function navBar(active: "headlines" | "search"): UiNode {
  return node("nav", "NavigationBar", {
    slot: "bottomBar",
    animation: none,
    children: [
      node("nav-home", "NavigationBarItem", {
        props: { label: "Headlines", icon: "home", selected: active === "headlines" },
        modifiers: {},
        animation: none,
        onClick: { type: "navigate", screenId: "headlines" },
      }),
      node("nav-search", "NavigationBarItem", {
        props: { label: "Search", icon: "search", selected: active === "search" },
        modifiers: {},
        animation: none,
        onClick: { type: "navigate", screenId: "search" },
      }),
    ],
  });
}

function statusLayers(sourceId: string, emptyCopy: string): UiNode[] {
  return [
    node(`${sourceId}-loading`, "Column", {
      visibleWhen: "loading",
      props: { spacedBy: 12, arrangement: "center" },
      modifiers: { fillMaxWidth: true, padding: { all: 32 } },
      children: [
        node(`${sourceId}-spinner`, "CircularProgress", {
          props: { size: 40 },
          modifiers: {},
        }),
        node(`${sourceId}-loading-text`, "Text", {
          props: { text: "Fetching US headlines…", style: "bodyMedium", color: "onSurfaceVariant" },
        }),
      ],
    }),
    node(`${sourceId}-error`, "Card", {
      visibleWhen: "error",
      props: { variant: "outlined" },
      modifiers: { fillMaxWidth: true, padding: { all: 16 }, clip: "medium" },
      children: [
        node(`${sourceId}-error-title`, "Text", {
          props: { text: "Headlines unavailable", style: "titleMedium", color: "error" },
        }),
        node(`${sourceId}-error-body`, "Text", {
          props: {
            text: "The live US news feed failed. Retry, or inspect this error state on the canvas.",
            style: "bodyMedium",
            color: "onSurfaceVariant",
          },
          bindings: { text: `errors.${sourceId}` },
        }),
        node(`${sourceId}-retry`, "FilledButton", {
          props: { label: "Retry" },
          modifiers: {},
          onClick: { type: "retry", dataSourceId: sourceId },
        }),
      ],
    }),
    node(`${sourceId}-empty`, "Column", {
      visibleWhen: "empty",
      props: { spacedBy: 8 },
      modifiers: { fillMaxWidth: true, padding: { all: 24 } },
      children: [
        node(`${sourceId}-empty-title`, "Text", {
          props: { text: emptyCopy, style: "titleMedium", color: "onSurface" },
        }),
        node(`${sourceId}-empty-sub`, "Text", {
          props: {
            text: "Try another query, or wait for the next briefing cycle.",
            style: "bodyMedium",
            color: "onSurfaceVariant",
          },
        }),
      ],
    }),
  ];
}

function articleCard(prefix: string): UiNode {
  return node(`${prefix}-card`, "Card", {
    visibleWhen: "ready",
    props: { variant: "elevated" },
    modifiers: { fillMaxWidth: true, padding: { all: 0 }, clip: "medium" },
    animation: { type: "slideUp", durationMs: 340, delayMs: 0, staggerMs: 70 },
    onClick: {
      type: "navigate",
      screenId: "article",
      params: { article: "item" },
    },
    children: [
      node(`${prefix}-row`, "Row", {
        props: { spacedBy: 12, alignment: "center" },
        modifiers: { fillMaxWidth: true, padding: { all: 12 } },
        animation: none,
        children: [
          node(`${prefix}-image`, "Image", {
            props: { url: "", alt: "Story", accent: "#1B4B8A" },
            modifiers: { widthDp: 76, heightDp: 76, clip: "small" },
            bindings: { url: "item.image", accent: "item.accent" },
            animation: { type: "scale", durationMs: 240, delayMs: 0 },
          }),
          node(`${prefix}-copy`, "Column", {
            props: { spacedBy: 4 },
            modifiers: { fillMaxWidth: true, weight: 1 },
            animation: none,
            children: [
              node(`${prefix}-source`, "Text", {
                props: { text: "Source", style: "labelMedium", color: "primary" },
                bindings: { text: "item.source" },
                animation: none,
              }),
              node(`${prefix}-title`, "Text", {
                props: { text: "Headline", style: "titleMedium", color: "onSurface" },
                bindings: { text: "item.title" },
                animation: none,
              }),
              node(`${prefix}-time`, "Text", {
                props: { text: "", style: "labelMedium", color: "onSurfaceVariant" },
                bindings: { text: "item.publishedAt" },
                animation: none,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export function createStarterScreen(): ScreenDocument {
  const headlinesRoot = node("headlines-root", "Scaffold", {
    modifiers: { fillMaxWidth: true, fillMaxHeight: true },
    animation: none,
    children: [
      node("headlines-bar", "TopAppBar", {
        slot: "topBar",
        props: { title: "US Briefing", navigationIcon: "menu" },
        animation: none,
      }),
      node("headlines-content", "Column", {
        slot: "content",
        props: { spacedBy: 8 },
        modifiers: { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 0 } },
        animation: none,
        children: [
          node("headlines-hero", "Column", {
            visibleWhen: "ready",
            props: { spacedBy: 4 },
            modifiers: { fillMaxWidth: true, padding: { start: 16, end: 16, top: 8, bottom: 4 } },
            children: [
              node("headlines-kicker", "Text", {
                props: { text: "United States", style: "labelMedium", color: "primary" },
              }),
              node("headlines-lede", "Text", {
                props: {
                  text: "Top stories, designed on the canvas and bound to a live feed.",
                  style: "headlineMedium",
                  color: "onSurface",
                },
              }),
            ],
          }),
          node("search-field", "TextField", {
            visibleWhen: "ready",
            props: { label: "Search US news", placeholder: "At least 3 letters", value: "" },
            modifiers: { fillMaxWidth: true, padding: { start: 16, end: 16, top: 4, bottom: 0 } },
            formField: {
              formId: "search",
              name: "query",
              validation: {
                required: true,
                minLength: 3,
                message: "Enter at least 3 characters to search.",
              },
            },
          }),
          node("search-error", "Text", {
            visibleWhen: "invalid",
            props: { text: "", style: "labelMedium", color: "error" },
            bindings: { text: "forms.search.errors.query" },
            modifiers: { fillMaxWidth: true, padding: { start: 16, end: 16 } },
          }),
          node("search-submit", "FilledButton", {
            visibleWhen: "ready",
            props: { label: "Search headlines" },
            modifiers: { padding: { start: 16, end: 16, bottom: 8 } },
            onClick: { type: "submitForm", formId: "search", screenId: "search" },
          }),
          ...statusLayers("news", "No national headlines right now."),
          node("headlines-list", "LazyColumn", {
            visibleWhen: "ready",
            itemBinding: "news.articles",
            props: { spacedBy: 12 },
            modifiers: {
              fillMaxWidth: true,
              fillMaxHeight: true,
              padding: { start: 16, end: 16, top: 4, bottom: 16 },
            },
            animation: { type: "none", durationMs: 0, delayMs: 0, staggerMs: 60 },
            children: [articleCard("hl")],
          }),
        ],
      }),
      navBar("headlines"),
    ],
  });

  const searchRoot = node("search-root", "Scaffold", {
    modifiers: { fillMaxWidth: true, fillMaxHeight: true },
    animation: none,
    children: [
      node("search-bar", "TopAppBar", {
        slot: "topBar",
        props: { title: "Search", navigationIcon: "back" },
        animation: none,
        onClick: { type: "back" },
      }),
      node("search-content", "Column", {
        slot: "content",
        props: { spacedBy: 8 },
        modifiers: { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 0 } },
        animation: none,
        children: [
          node("search-query-label", "Text", {
            visibleWhen: "ready",
            props: { text: "Results", style: "labelMedium", color: "primary" },
            bindings: { text: "forms.search.query" },
            modifiers: { fillMaxWidth: true, padding: { start: 16, end: 16, top: 12 } },
          }),
          node("search-field-2", "TextField", {
            visibleWhen: "ready",
            props: { label: "Refine search", placeholder: "At least 3 letters", value: "" },
            modifiers: { fillMaxWidth: true, padding: { start: 16, end: 16 } },
            formField: {
              formId: "search",
              name: "query",
              validation: {
                required: true,
                minLength: 3,
                message: "Enter at least 3 characters to search.",
              },
            },
          }),
          node("search-error-2", "Text", {
            visibleWhen: "invalid",
            props: { text: "", style: "labelMedium", color: "error" },
            bindings: { text: "forms.search.errors.query" },
            modifiers: { fillMaxWidth: true, padding: { start: 16, end: 16 } },
          }),
          node("search-again", "FilledButton", {
            visibleWhen: "ready",
            props: { label: "Update results" },
            modifiers: { padding: { start: 16, end: 16 } },
            onClick: { type: "submitForm", formId: "search", screenId: "search" },
          }),
          ...statusLayers("search", "No matching US stories."),
          node("search-list", "LazyColumn", {
            visibleWhen: "ready",
            itemBinding: "search.articles",
            props: { spacedBy: 12 },
            modifiers: {
              fillMaxWidth: true,
              fillMaxHeight: true,
              padding: { start: 16, end: 16, top: 8, bottom: 16 },
            },
            children: [articleCard("sr")],
          }),
        ],
      }),
      navBar("search"),
    ],
  });

  const articleRoot = node("article-root", "Scaffold", {
    modifiers: { fillMaxWidth: true, fillMaxHeight: true },
    animation: none,
    children: [
      node("article-bar", "TopAppBar", {
        slot: "topBar",
        props: { title: "Story", navigationIcon: "back" },
        animation: none,
        bindings: { title: "route.article.source" },
        onClick: { type: "back" } satisfies ClickAction,
      }),
      node("article-content", "Column", {
        slot: "content",
        props: { spacedBy: 12 },
        modifiers: { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 16 } },
        children: [
          node("article-image", "Image", {
            props: { url: "", alt: "Story image", accent: "#1B4B8A" },
            modifiers: { fillMaxWidth: true, heightDp: 180, clip: "medium" },
            bindings: { url: "route.article.image", accent: "route.article.accent" },
            animation: { type: "scale", durationMs: 320, delayMs: 0 },
          }),
          node("article-kicker", "Text", {
            props: { text: "US", style: "labelMedium", color: "primary" },
            bindings: { text: "route.article.source" },
          }),
          node("article-title", "Text", {
            props: { text: "Story title", style: "headlineMedium", color: "onSurface" },
            bindings: { text: "route.article.title" },
          }),
          node("article-time", "Text", {
            props: { text: "", style: "labelMedium", color: "onSurfaceVariant" },
            bindings: { text: "route.article.publishedAt" },
          }),
          node("article-body", "Text", {
            props: { text: "Description", style: "bodyLarge", color: "onSurfaceVariant" },
            bindings: { text: "route.article.description" },
          }),
          node("article-open", "FilledButton", {
            props: { label: "Open original" },
            modifiers: {},
            onClick: { type: "openUrl", url: "{{route.article.url}}" },
          }),
        ],
      }),
      navBar("headlines"),
    ],
  });

  return {
    schemaVersion: 2,
    id: "us-briefing",
    name: "US Briefing",
    theme: { mode: "light", seed: "blue" },
    startScreenId: "headlines",
    dataSources: [
      {
        id: "news",
        name: "US top headlines",
        url: "/api/news/us",
        method: "GET",
        fallbackToMock: false,
        mock: newsMock,
      },
      {
        id: "search",
        name: "US news search",
        url: "/api/news/us?q={{forms.search.query}}",
        method: "GET",
        fallbackToMock: false,
        mock: newsMock,
      },
    ],
    screens: [
      {
        id: "headlines",
        name: "Headlines",
        route: "/headlines",
        root: headlinesRoot,
        dataSourceIds: ["news"],
        emptyPath: "news.articles",
      },
      {
        id: "search",
        name: "Search",
        route: "/search",
        root: searchRoot,
        dataSourceIds: ["search"],
        emptyPath: "search.articles",
      },
      {
        id: "article",
        name: "Article",
        route: "/article",
        root: articleRoot,
        dataSourceIds: [],
      },
    ],
    root: headlinesRoot,
  };
}
