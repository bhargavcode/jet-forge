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

- Design Material 3 screens, including **multiple routes** (Headlines → Article → Search)
- Click **actions** on the canvas: navigate, back, submit form, retry a failed API, open URL
- Form **validation** (required, min length, error copy) stored on the TextField
- **Loading / error / empty / invalid** UI painted on the same canvas via `visibleWhen`
- Bind lists and text to a live **US news** feed (`/api/news/us`)
- Press **Play** to execute the published behavior on the phone, then **Publish** to the device runtime

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43145](http://localhost:43145).

1. The sample app is **US Briefing**. Switch screens in the left **Screens** list.
2. Use **Canvas: error / loading / empty / invalid** to design those states without leaving the phone.
3. Press **Play**. Search with fewer than 3 letters to see validation; tap a story to open Article; turn on **Simulate API failure** on the news source and Retry.
4. **Publish**, then open `/device/us-briefing`.

The news proxy tries a public US headlines feed, then The Guardian `api-key=test`, and returns a structured error if both fail so the canvas error state can run.

Android emulator:

```kotlin
val baseUrl = "http://10.0.2.2:43145"
val screen = ScreenClient.fetchScreen(baseUrl, "us-briefing")
StudioScreen(screen, data)
```

Copy `android/composestudio-runtime` into an Android Studio project. Enable Compose Material 3 and kotlinx.serialization. Use `http://<lan-ip>:43145` on a physical device.

## Document contract

`POST /api/screens` body (simplified):

```json
{
  "schemaVersion": 2,
  "id": "us-briefing",
  "startScreenId": "headlines",
  "screens": [
    {
      "id": "headlines",
      "route": "/headlines",
      "dataSourceIds": ["news"],
      "emptyPath": "news.articles"
    }
  ],
  "dataSources": [
    { "id": "news", "url": "/api/news/us", "method": "GET", "fallbackToMock": false }
  ]
}
```

Nodes may include `onClick` (`navigate`, `back`, `submitForm`, `retry`, `openUrl`), `formField` validation, and `visibleWhen` (`ready`, `loading`, `error`, `empty`, `invalid`). List rows bind with `item.*`; the article screen reads `route.article`.

Binding rules:

- Data source id is the root (`catalog.storeName`).
- Inside a node with `itemBinding`, each array element is `item`.
- Unresolved bindings fall back to the static prop, then to mock JSON.

## How to grow this into production

The slice is intentionally one vertical path. A production system would add:

1. **Auth and environments** — draft vs published, per-app keys, staging URLs
2. **Expressions** — enablement, formatting (`formatCurrency(item.price)`)
3. **Shared-element / navigation transitions** between published screens
4. **Component library versioning** — designer and APK must agree on `schemaVersion`
5. **Hot reload on device** — websocket push after publish
6. **Design tokens** from your brand (Material dynamic color / HCT)
7. **Offline cache** of last published document + last API payload

Do not generate a new APK for every screen. Keep the interpreter in the app, and treat published JSON as configuration.

## Project layout

- `src/components/designer` — drag-and-drop editor
- `src/components/preview` — Material 3 phone renderer (shared with `/device`)
- `src/lib/schema.ts` — the document types
- `src/app/api/screens` — publish / fetch
- `android/composestudio-runtime` — Kotlin interpreter
- `android/sample` — Activity that loads a published screen
