# Compose Studio

Visual **Material 3** designer for Jetpack Compose screens. You place official-style components on a phone canvas the way you would frames in Figma, bind them to REST APIs, wire prototype routes, and **publish**. A separate Kotlin Multiplatform runtime ([jetforge-kmp](https://github.com/bhargavcode/jetforge-kmp)) fetches that JSON and renders it on Android and iOS with **native Compose** — `JetForgeScreen` / `JetForgeComponent` never use a WebView.

## Architecture

```
┌──────────────────────┐     JSON ScreenDocument      ┌─────────────────────┐
│  Compose Studio      │  ─────────────────────────▶  │  Publish API        │
│  Next.js designer    │     POST /api/screens        │  /api/screens/:id   │
│  design / prototype  │                              └──────────┬──────────┘
└──────────────────────┘                                         │
           │ same schema                                         │ GET document
           ▼                                                     ▼
┌──────────────────────┐                              ┌─────────────────────┐
│  Web device runtime  │                              │  jetforge-kmp        │
│  /device/:id         │                              │  JetForgeScreen()    │
│  (preview on phone)  │                              │  native Compose      │
└──────────────────────┘                              └──────────┬──────────┘
                                                                 │
                                                      configured request
                                                      (headers, query, body)
                                                                 ▼
                                                      Your product APIs
```

The designer does **not** generate Kotlin per screen. It produces a versioned UI document. One Compose interpreter on the device is enough for every published screen.

The KMP interpreter lives in **its own repository**: [bhargavcode/jetforge-kmp](https://github.com/bhargavcode/jetforge-kmp). Keep that clone next to this studio; do not vendor it back into this tree.

## What you can do

- Design Material 3 screens, including **multiple routes** (Headlines → Article → Search)
- **Prototype board** — see every screen, drag artboards, and wire a view click (or swipe / long-press / double-tap) to another screen
- **Touch events** on any node: tap, doubleTap, longPress, swipeLeft / swipeRight / swipeUp / swipeDown
- Upload **image and icon placeholders** from this device; bind `item.image` (or any API path) so the live response replaces the placeholder
- Configure the screen **request**: HTTP method, header key-value pairs, query, JSON body, form-urlencoded, or multipart. Values accept `{{forms.search.query}}` and `{{route.*}}`
- Form **validation** (required, min length) stored on the TextField
- **Loading / error / empty / invalid** UI via `visibleWhen`
- Press **Play** on the phone, then **Publish** for `/device/:id` and native apps

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43145](http://localhost:43145).

1. The sample app is **US Briefing**. Switch screens in the left **Screens** list.
2. Use **Design** to edit the current phone. Use **Prototype** to see all screens and connect hotspots.
3. Select an Image and **Upload from device** for placeholder art. Bind Image URL to `item.image` so the API replaces it.
4. Open **Request** to edit headers, query, and body for the APIs the designed screen will call.
5. Press **Play**. Search with fewer than 3 letters to see validation; tap a story to open Article.
6. **Publish**, then open `/device/us-briefing`.

The news proxy tries a public US headlines feed, then The Guardian `api-key=test`. If both remotes fail it still returns bundled US sample stories. Turn on **Simulate API failure** on a data source to design the error / Retry UI.

## Native Android / iOS

Clone and open [jetforge-kmp](https://github.com/bhargavcode/jetforge-kmp). Point it at this studio:

```kotlin
JetForge.configure(JetForgeConfig(baseUrl = "http://10.0.2.2:43145")) // Android emulator

@Composable
fun Briefing() {
    JetForgeScreen(endpoint = "us-briefing") // native Compose, not a WebView
}

JetForgeComponent(endpoint = "us-briefing", modifier = Modifier.height(240.dp))
```

On iOS simulator / desktop use `http://127.0.0.1:43145`. Physical devices need your LAN IP and cleartext HTTP allowed for local studios.

## Document contract

`POST /api/screens` body (simplified):

```json
{
  "schemaVersion": 3,
  "id": "us-briefing",
  "startScreenId": "headlines",
  "screens": [
    {
      "id": "headlines",
      "route": "/headlines",
      "dataSourceIds": ["news"],
      "emptyPath": "news.articles",
      "flowX": 48,
      "flowY": 48
    }
  ],
  "dataSources": [
    {
      "id": "news",
      "url": "/api/news/us",
      "method": "GET",
      "headerRows": [{ "key": "Accept", "value": "application/json" }],
      "queryRows": [{ "key": "q", "value": "{{forms.search.query}}" }],
      "bodyMode": "none"
    }
  ]
}
```

Nodes may include `interactions` (`tap`, `doubleTap`, `longPress`, `swipeLeft`, `swipeRight`, `swipeUp`, `swipeDown`) mapped to `navigate`, `back`, `submitForm`, `retry`, `openUrl`, or `callApi`. `onClick` is still accepted as a tap action. List rows bind with `item.*`; the article screen reads `route.article`. Image `props.url` is the placeholder; `bindings.url` is the API field that replaces it.

## Project layout

- `src/components/designer` — drag-and-drop editor, Prototype board, request inspector
- `src/components/preview` — Material 3 phone renderer (shared with `/device`)
- `src/lib/schema.ts` — the document types (schema version 3)
- `src/app/api/screens` — publish / fetch
- `src/app/api/bind` — execute configured requests and return JSON for binding
- `src/app/api/assets` — device uploads for image/icon placeholders
- `android/` — earlier Android-only snapshot (prefer [jetforge-kmp](https://github.com/bhargavcode/jetforge-kmp))
