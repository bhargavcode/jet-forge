package dev.composestudio.runtime.bind

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

typealias BindingScope = MutableMap<String, JsonElement>

fun JsonElement.getByPath(path: String): JsonElement? {
    val clean = path.replace("{{", "").replace("}}", "").trim()
    if (clean.isEmpty()) return null
    var current: JsonElement? = this
    for (part in clean.split(".").filter { it.isNotEmpty() }) {
        current = when (val node = current) {
            is JsonObject -> node[part]
            is JsonArray -> part.toIntOrNull()?.let { node.getOrNull(it) }
            else -> null
        }
    }
    return current
}

fun BindingScope.resolvePath(path: String): JsonElement? {
    val clean = path.replace("{{", "").replace("}}", "").trim()
    val first = clean.substringBefore(".")
    val rest = clean.substringAfter(".", missingDelimiterValue = "")
    val root = this[first] ?: JsonObject(this).getByPath(clean)
    return if (rest.isEmpty()) root else root?.getByPath(rest)
}

fun JsonElement.asDisplayString(): String = when (this) {
    is JsonNull -> ""
    is JsonPrimitive -> contentOrNull ?: booleanOrNull?.toString() ?: doubleOrNull?.toString() ?: ""
    else -> Json.encodeToString(JsonElement.serializer(), this)
}

fun JsonObject.prop(key: String): String? = this[key]?.jsonPrimitive?.contentOrNull

fun JsonObject.bool(key: String, default: Boolean = false): Boolean =
    this[key]?.jsonPrimitive?.booleanOrNull ?: default

fun JsonObject.int(key: String, default: Int): Int =
    this[key]?.jsonPrimitive?.contentOrNull?.toIntOrNull() ?: default
