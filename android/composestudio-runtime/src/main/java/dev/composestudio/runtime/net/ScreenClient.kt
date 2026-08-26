package dev.composestudio.runtime.net

import dev.composestudio.runtime.bind.BindingScope
import dev.composestudio.runtime.model.DataSource
import dev.composestudio.runtime.model.ScreenDocument
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

object ScreenClient {
    private val json = Json { ignoreUnknownKeys = true }

    fun fetchScreen(baseUrl: String, screenId: String): ScreenDocument {
        val raw = http("${baseUrl.trimEnd('/')}/api/screens/$screenId")
        return json.decodeFromString(ScreenDocument.serializer(), raw)
    }

    fun fetchBindings(document: ScreenDocument, baseUrl: String): BindingScope {
        val scope: BindingScope = mutableMapOf()
        document.dataSources.forEach { source ->
            val url = resolveUrl(source.url, baseUrl)
            try {
                val raw = http(url, source)
                scope[source.id] = json.parseToJsonElement(raw)
            } catch (_: Exception) {
                source.mock?.let { scope[source.id] = it }
            }
        }
        if (scope.isEmpty()) {
            scope["empty"] = JsonObject(emptyMap())
        }
        return scope
    }

    private fun resolveUrl(url: String, baseUrl: String): String {
        return if (url.startsWith("http")) url else "${baseUrl.trimEnd('/')}$url"
    }

    private fun http(url: String, source: DataSource? = null): String {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = source?.method ?: "GET"
        connection.connectTimeout = 8_000
        connection.readTimeout = 8_000
        connection.setRequestProperty("Accept", "application/json")
        source?.headers?.forEach { (key, value) -> connection.setRequestProperty(key, value) }
        if (source?.method == "POST") {
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { it.write((source.body ?: "{}").toByteArray()) }
        }
        connection.inputStream.bufferedReader().use { return it.readText() }
    }
}
