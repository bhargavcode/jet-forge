# JetForge KMP runtime

Kotlin Multiplatform library (`:jetforge`) plus a sample app (`:sample`) that mix **ordinary Compose screens** with **server-driven JetForge screens**.

Android and iOS share one renderer. Publish a document in the Next.js designer, then draw it with:

```kotlin
JetForge.configure(JetForgeConfig(baseUrl = "https://your-studio.example.com"))

// Full screen — shimmer skeleton until the document arrives
JetForgeScreen(endpoint = "us-briefing")

// Embedded region inside a screen you already own
JetForgeComponent(
    endpoint = "us-briefing",
    modifier = Modifier.fillMaxWidth().height(240.dp),
)
```

`endpoint` can be a screen id (`us-briefing`), a path (`/api/screens/us-briefing`), or an absolute URL.

## Add it to an existing KMP app

1. Copy the `jetforge/` module into your project (or `includeBuild("../jet-forge/kmp")`).
2. In `settings.gradle.kts`: `include(":jetforge")`
3. In your app module:

```kotlin
kotlin {
    sourceSets {
        commonMain.dependencies {
            implementation(project(":jetforge"))
        }
    }
}
```

4. Call `JetForge.configure` once at startup. On the Android emulator use `http://10.0.2.2:43145`; on iOS simulator / desktop use `http://127.0.0.1:43145`. Cleartext HTTP must be allowed for local studios (`android:usesCleartextTraffic="true"`).

### SwiftUI

The iOS framework exposes `JetForgeViewController(endpoint:baseUrl:)`. Wrap it:

```swift
JetForgeScreenView(endpoint: "us-briefing", baseUrl: "http://127.0.0.1:43145")
    .ignoresSafeArea(.keyboard)
```

## Sample app

The sample is a shop-style shell:

| Tab | What it is |
| --- | --- |
| **Home** | Traditional Compose (copy, button, local state) plus an embedded `JetForgeComponent` |
| **Briefing** | A full `JetForgeScreen` for the published US Briefing document |
| **Settings** | Traditional form to change studio URL and endpoint |

### Desktop (this repo)

```bash
cd kmp
./gradlew :sample:run
```

### Android Studio

Open the `kmp/` folder. Set `sdk.dir` in `local.properties`. Run the `sample` Android configuration.

### iOS

Open `kmp/iosApp` after Android Studio / Fleet has generated the `Sample` framework, or run the iOS app from a Compose Multiplatform run configuration. `MainViewController()` hosts the same `App()`.

## How loading works

1. `GET {baseUrl}/api/screens/{id}` — published JSON document.
2. Shimmer skeleton while that request is in flight.
3. `POST {baseUrl}/api/bind` (falls back to calling each data source URL directly) — same bindings the web runtime uses.
4. Clicks, forms, validation, retry, and in-document navigation run inside the interpreter. Your app keeps its own back stack for traditional screens.

Do not generate Kotlin per screen. Keep this module in the app and treat published JSON as configuration.
