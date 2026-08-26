# Compose Studio

A visual **Material 3** designer for Jetpack Compose screens. You drag official-style components onto a phone canvas, bind them to REST APIs, add enter motion, and **publish**. An Android runtime then fetches that same JSON document, calls the same APIs, and renders real Compose Material 3 views.

This repo ships a working slice of that loop: designer → document → server → device runtime (web simulator + Kotlin sources).

## Architecture

```
┌──────────────────────┐     JSON ScreenDocument      ┌─────────────────────┐
│  Compose Studio      │  ─────────────────────────▶  │  Publish API        │
│  Next.js designer    │     POST /api/screens        │  /api/screens/:id   │
│  drag / bind / motion│                              └──────────┬──────────┘
└──────────┬───────────┘                                         │
           │ same schema                                         │ GET document
           ▼                                                     ▼
┌──────────────────────┐                              ┌─────────────────────┐
│  Web device runtime  │                              │  Android runtime    │
│  /device/:id         │                              │  ScreenClient +     │
│  (preview on phone)  │                              │  StudioScreen()     │
└──────────────────────┘                              └──────────┬──────────┘
                                                                 │
                                                      REST data sources
                                                                 ▼
                                                      Your product APIs
```

The important idea: **the designer does not generate Kotlin source for each screen.** It produces a versioned UI document. One Compose interpreter on the device is enough for every published screen.

| Layer | Role |
| --- | --- |
| **Screen document** | Tree of Material nodes, modifiers, enter animations, data sources, and binding paths |
| **Designer** | Drag-and-drop editor with a Material 3 phone preview |
| **Publish server** | Stores documents; Android and the web runtime both fetch them |
| **Binding engine** | Resolves dotted JSON paths (`catalog.products`, `item.title`) |
| **Compose runtime** | Maps each node type to `material3` composables (`Scaffold`, `TopAppBar`, `LazyColumn`, …) |

## What you can do in this slice

- Design with Material 3 components: Scaffold, TopAppBar, NavigationBar, FAB, Card, buttons, text field, switch, checkbox, chip, list item, typography roles, LazyColumn
- Nest layouts (Column / Row / Box / Card) by dragging onto the canvas
- Bind properties and repeating lists to REST JSON
- Enter animations: fade, slide up, slide left, scale, with duration / delay / list stagger
- Theme with Material seed colors and light / dark
- Publish a full screen; open `/device/:id` to see the device runtime
- Copy the Kotlin runtime into an Android app and point it at this server

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43145](http://localhost:43145).

1. Drag components from the left palette onto the phone (or click a component while a layout is selected).
2. Select a node to edit props, API bindings, and motion.
3. Add data sources in the right panel. Use `/api/mock/catalog` or any public JSON API. Mock JSON is the fallback when the live call fails.
4. Press **Publish**. Open **Published** or `/device/aurora-market` after publishing the sample.

Android emulator (sample activity in `android/sample`):

```kotlin
val baseUrl = "http://10.0.2.2:43145" // host machine from the emulator
val screen = ScreenClient.fetchScreen(baseUrl, "aurora-market")
val data = ScreenClient.fetchBindings(screen, baseUrl)
StudioScreen(screen, data)
```

Copy `android/composestudio-runtime` into an Android Studio project. Enable Compose Material 3 and kotlinx.serialization. Use `http://<lan-ip>:43145` on a physical device.

## Document contract

`POST /api/screens` body (simplified):

```json
{
  "schemaVersion": 1,
  "id": "aurora-market",
  "name": "Aurora Market",
  "theme": { "mode": "light", "seed": "purple" },
  "dataSources": [
    { "id": "catalog", "name": "Product catalog", "url": "/api/mock/catalog", "method": "GET" }
  ],
  "root": {
    "id": "root",
    "type": "Scaffold",
    "children": [
      { "type": "TopAppBar", "slot": "topBar", "bindings": { "title": "catalog.storeName" } },
      {
        "type": "LazyColumn",
        "slot": "content",
        "itemBinding": "catalog.products",
        "children": [
          { "type": "Text", "bindings": { "text": "item.title" } }
        ]
      }
    ]
  }
}
```

Binding rules:

- Data source id is the root (`catalog.storeName`).
- Inside a node with `itemBinding`, each array element is `item`.
- Unresolved bindings fall back to the static prop, then to mock JSON.

## How to grow this into production

The slice is intentionally one vertical path. A production system would add:

1. **Auth and environments** — draft vs published, per-app keys, staging URLs
2. **Actions** — button → navigate, call POST, open URL, update local state
3. **Expressions** — visibility, enablement, formatting (`formatCurrency(item.price)`)
4. **Shared-element / navigation transitions** between published screens
5. **Component library versioning** — designer and APK must agree on `schemaVersion`
6. **Hot reload on device** — websocket push after publish
7. **Design tokens** from your brand (Material dynamic color / HCT)
8. **Offline cache** of last published document + last API payload

Do not generate a new APK for every screen. Keep the interpreter in the app, and treat published JSON as configuration.

## Project layout

- `src/components/designer` — drag-and-drop editor
- `src/components/preview` — Material 3 phone renderer (shared with `/device`)
- `src/lib/schema.ts` — the document types
- `src/app/api/screens` — publish / fetch
- `android/composestudio-runtime` — Kotlin interpreter
- `android/sample` — Activity that loads a published screen
