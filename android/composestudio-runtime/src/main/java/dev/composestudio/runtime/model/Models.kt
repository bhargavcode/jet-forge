package dev.composestudio.runtime.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

@Serializable
data class ScreenDocument(
    val schemaVersion: Int = 1,
    val id: String,
    val name: String,
    val theme: ScreenTheme = ScreenTheme(),
    val dataSources: List<DataSource> = emptyList(),
    val root: UiNode,
    val publishedAt: String? = null,
)

@Serializable
data class ScreenTheme(
    val mode: String = "light",
    val seed: String = "purple",
)

@Serializable
data class DataSource(
    val id: String,
    val name: String,
    val url: String,
    val method: String = "GET",
    val headers: Map<String, String> = emptyMap(),
    val body: String? = null,
    val mock: JsonElement? = null,
)

@Serializable
data class UiNode(
    val id: String,
    val type: String,
    val props: JsonObject = JsonObject(emptyMap()),
    val modifiers: ModifierSpec = ModifierSpec(),
    val animation: EnterAnimation? = null,
    val bindings: Map<String, String> = emptyMap(),
    val children: List<UiNode> = emptyList(),
    val slot: String? = null,
    val itemBinding: String? = null,
)

@Serializable
data class ModifierSpec(
    val fillMaxWidth: Boolean = false,
    val fillMaxHeight: Boolean = false,
    val widthDp: Int? = null,
    val heightDp: Int? = null,
    val weight: Float? = null,
    val padding: PaddingSpec? = null,
    val clip: String? = null,
)

@Serializable
data class PaddingSpec(
    val all: Int? = null,
    val start: Int? = null,
    val top: Int? = null,
    val end: Int? = null,
    val bottom: Int? = null,
)

@Serializable
data class EnterAnimation(
    val type: String = "none",
    val durationMs: Int = 280,
    val delayMs: Int = 0,
    val staggerMs: Int = 0,
)
