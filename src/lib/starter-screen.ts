import type { ScreenDocument } from "./schema";

const catalogMock = {
  storeName: "Aurora Market",
  products: [
    {
      id: 1,
      title: "Nimbus Headphones",
      subtitle: "Adaptive noise cancelling",
      price: "$129",
      accent: "#6750A4",
    },
    {
      id: 2,
      title: "Lumen Desk Lamp",
      subtitle: "Matter + Thread ready",
      price: "$89",
      accent: "#006A6A",
    },
    {
      id: 3,
      title: "Field Notes Folio",
      subtitle: "Recycled leather cover",
      price: "$42",
      accent: "#8B5000",
    },
    {
      id: 4,
      title: "Orbit Charging Tray",
      subtitle: "15W Qi2, two devices",
      price: "$64",
      accent: "#005DB7",
    },
  ],
};

export function createStarterScreen(): ScreenDocument {
  return {
    schemaVersion: 1,
    id: "aurora-market",
    name: "Aurora Market",
    theme: { mode: "light", seed: "purple" },
    dataSources: [
      {
        id: "catalog",
        name: "Product catalog",
        url: "/api/mock/catalog",
        method: "GET",
        mock: catalogMock,
      },
    ],
    root: {
      id: "root",
      type: "Scaffold",
      props: {},
      modifiers: { fillMaxWidth: true, fillMaxHeight: true },
      animation: { type: "none", durationMs: 0, delayMs: 0 },
      children: [
        {
          id: "appbar",
          type: "TopAppBar",
          slot: "topBar",
          props: { title: "Aurora Market", navigationIcon: "menu" },
          modifiers: { fillMaxWidth: true },
          bindings: { title: "catalog.storeName" },
          animation: { type: "none", durationMs: 0, delayMs: 0 },
        },
        {
          id: "content",
          type: "Column",
          slot: "content",
          props: { arrangement: "top", alignment: "start", spacedBy: 8 },
          modifiers: { fillMaxWidth: true, fillMaxHeight: true, padding: { all: 0 } },
          animation: { type: "none", durationMs: 0, delayMs: 0 },
          children: [
            {
              id: "hero-copy",
              type: "Column",
              props: { spacedBy: 4, arrangement: "top", alignment: "start" },
              modifiers: { fillMaxWidth: true, padding: { start: 16, end: 16, top: 8, bottom: 4 } },
              animation: { type: "fade", durationMs: 280, delayMs: 40 },
              children: [
                {
                  id: "kicker",
                  type: "Text",
                  props: { text: "Today’s edit", style: "labelMedium", color: "primary" },
                  modifiers: { fillMaxWidth: true },
                  animation: { type: "slideLeft", durationMs: 280, delayMs: 40 },
                },
                {
                  id: "headline",
                  type: "Text",
                  props: {
                    text: "Objects with a quieter kind of luxury.",
                    style: "headlineMedium",
                    color: "onSurface",
                  },
                  modifiers: { fillMaxWidth: true },
                  animation: { type: "slideUp", durationMs: 360, delayMs: 80 },
                },
              ],
            },
            {
              id: "search",
              type: "TextField",
              props: { label: "Search the catalog", placeholder: "Lamps, leather, audio", value: "" },
              modifiers: { fillMaxWidth: true, padding: { start: 16, end: 16, top: 4, bottom: 8 } },
              animation: { type: "fade", durationMs: 240, delayMs: 120 },
            },
            {
              id: "product-list",
              type: "LazyColumn",
              itemBinding: "catalog.products",
              props: { spacedBy: 12 },
              modifiers: {
                fillMaxWidth: true,
                fillMaxHeight: true,
                padding: { start: 16, end: 16, top: 4, bottom: 16 },
              },
              animation: { type: "none", durationMs: 0, delayMs: 0, staggerMs: 60 },
              children: [
                {
                  id: "product-card",
                  type: "Card",
                  props: { variant: "elevated" },
                  modifiers: { fillMaxWidth: true, padding: { all: 0 }, clip: "medium" },
                  animation: { type: "slideUp", durationMs: 340, delayMs: 0, staggerMs: 70 },
                  children: [
                    {
                      id: "product-row",
                      type: "Row",
                      props: { arrangement: "start", alignment: "center", spacedBy: 12 },
                      modifiers: { fillMaxWidth: true, padding: { all: 12 } },
                      animation: { type: "none", durationMs: 0, delayMs: 0 },
                      children: [
                        {
                          id: "product-image",
                          type: "Image",
                          props: { url: "", alt: "Product", accent: "#6750A4" },
                          modifiers: { widthDp: 72, heightDp: 72, clip: "small" },
                          bindings: { url: "item.image", accent: "item.accent" },
                          animation: { type: "scale", durationMs: 280, delayMs: 0 },
                        },
                        {
                          id: "product-copy",
                          type: "Column",
                          props: { spacedBy: 2, arrangement: "top", alignment: "start" },
                          modifiers: { fillMaxWidth: true, weight: 1 },
                          animation: { type: "none", durationMs: 0, delayMs: 0 },
                          children: [
                            {
                              id: "product-title",
                              type: "Text",
                              props: { text: "Product", style: "titleMedium", color: "onSurface" },
                              bindings: { text: "item.title" },
                              modifiers: { fillMaxWidth: true },
                              animation: { type: "none", durationMs: 0, delayMs: 0 },
                            },
                            {
                              id: "product-sub",
                              type: "Text",
                              props: { text: "Details", style: "bodyMedium", color: "onSurfaceVariant" },
                              bindings: { text: "item.subtitle" },
                              modifiers: { fillMaxWidth: true },
                              animation: { type: "none", durationMs: 0, delayMs: 0 },
                            },
                            {
                              id: "product-price",
                              type: "Text",
                              props: { text: "$0", style: "labelLarge", color: "primary" },
                              bindings: { text: "item.price" },
                              modifiers: { fillMaxWidth: true },
                              animation: { type: "none", durationMs: 0, delayMs: 0 },
                            },
                          ],
                        },
                        {
                          id: "add-btn",
                          type: "FilledButton",
                          props: { label: "Add" },
                          modifiers: {},
                          animation: { type: "scale", durationMs: 220, delayMs: 80 },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "nav",
          type: "NavigationBar",
          slot: "bottomBar",
          props: {},
          modifiers: { fillMaxWidth: true },
          animation: { type: "none", durationMs: 0, delayMs: 0 },
          children: [
            {
              id: "nav-home",
              type: "NavigationBarItem",
              props: { label: "Home", icon: "home", selected: true },
              modifiers: {},
              animation: { type: "none", durationMs: 0, delayMs: 0 },
            },
            {
              id: "nav-search",
              type: "NavigationBarItem",
              props: { label: "Search", icon: "search", selected: false },
              modifiers: {},
              animation: { type: "none", durationMs: 0, delayMs: 0 },
            },
            {
              id: "nav-cart",
              type: "NavigationBarItem",
              props: { label: "Bag", icon: "cart", selected: false },
              modifiers: {},
              animation: { type: "none", durationMs: 0, delayMs: 0 },
            },
            {
              id: "nav-you",
              type: "NavigationBarItem",
              props: { label: "You", icon: "person", selected: false },
              modifiers: {},
              animation: { type: "none", durationMs: 0, delayMs: 0 },
            },
          ],
        },
        {
          id: "fab",
          type: "FAB",
          slot: "fab",
          props: { icon: "search", contentDescription: "Search" },
          modifiers: {},
          animation: { type: "scale", durationMs: 260, delayMs: 180 },
        },
      ],
    },
  };
}
