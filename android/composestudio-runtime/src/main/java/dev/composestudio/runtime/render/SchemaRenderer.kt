package dev.composestudio.runtime.render

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Button
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.AssistChip
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import dev.composestudio.runtime.bind.BindingScope
import dev.composestudio.runtime.bind.asDisplayString
import dev.composestudio.runtime.bind.bool
import dev.composestudio.runtime.bind.getByPath
import dev.composestudio.runtime.bind.int
import dev.composestudio.runtime.bind.prop
import dev.composestudio.runtime.bind.resolvePath
import dev.composestudio.runtime.model.EnterAnimation
import dev.composestudio.runtime.model.ScreenDocument
import dev.composestudio.runtime.model.UiNode
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudioScreen(document: ScreenDocument, scope: BindingScope) {
    val dark = document.theme.mode == "dark"
    val colors = seedScheme(document.theme.seed, dark)
    val start = if (document.screens.isNotEmpty()) {
        document.screens.find { it.id == document.startScreenId }?.root ?: document.screens.first().root
    } else document.root
    MaterialTheme(colorScheme = colors) {
        RenderNode(start, scope, 0)
    }
}

@Composable
private fun RenderNode(node: UiNode, scope: BindingScope, itemIndex: Int) {
    val whenState = node.visibleWhen ?: "always"
    if (whenState != "always" && whenState != "ready") {
        return
    }
    AnimatedVisibility(
        visible = true,
        enter = enterTransition(node.animation, itemIndex),
    ) {
        NodeBody(node, scope, itemIndex)
    }
}

@Composable
private fun NodeBody(node: UiNode, scope: BindingScope, itemIndex: Int) {
    val modifier = node.studioModifier()
    when (node.type) {
        "Scaffold" -> StudioScaffold(node, scope)
        "Column" -> Column(
            modifier = modifier,
            verticalArrangement = Arrangement.spacedBy((node.props.int("spacedBy", 8)).dp),
        ) { node.children.forEach { RenderNode(it, scope, itemIndex) } }
        "Row" -> Row(
            modifier = modifier,
            horizontalArrangement = Arrangement.spacedBy((node.props.int("spacedBy", 8)).dp),
            verticalAlignment = Alignment.CenterVertically,
        ) { node.children.forEach { RenderNode(it, scope, itemIndex) } }
        "Box" -> Box(modifier) { node.children.forEach { RenderNode(it, scope, itemIndex) } }
        "LazyColumn" -> StudioList(node, scope, modifier)
        "Card" -> Card(
            modifier = modifier,
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = if (node.props.prop("variant") == "outlined") 0.dp else 1.dp),
        ) { Column(Modifier.padding(12.dp)) { node.children.forEach { RenderNode(it, scope, itemIndex) } } }
        "TopAppBar" -> TopAppBar(
            title = { Text(resolve(node, "title", scope) ?: "Title") },
            navigationIcon = {
                IconButton(onClick = {}) {
                    Icon(iconOf(node.props.prop("navigationIcon") ?: "menu"), contentDescription = null)
                }
            },
            actions = { Icon(Icons.Filled.Notifications, contentDescription = null) },
        )
        "NavigationBar" -> NavigationBar {
            node.children.forEach { child ->
                NavigationBarItem(
                    selected = child.props.bool("selected"),
                    onClick = {},
                    icon = { Icon(iconOf(child.props.prop("icon") ?: "home"), contentDescription = null) },
                    label = { Text(child.props.prop("label") ?: "") },
                )
            }
        }
        "FAB" -> FloatingActionButton(onClick = {}) {
            Icon(iconOf(node.props.prop("icon") ?: "add"), contentDescription = node.props.prop("contentDescription"))
        }
        "FilledButton" -> Button(onClick = {}, modifier = modifier) { Text(resolve(node, "label", scope) ?: "Action") }
        "OutlinedButton" -> OutlinedButton(onClick = {}, modifier = modifier) { Text(resolve(node, "label", scope) ?: "Action") }
        "TextButton" -> TextButton(onClick = {}, modifier = modifier) { Text(resolve(node, "label", scope) ?: "Action") }
        "Chip" -> AssistChip(onClick = {}, label = { Text(resolve(node, "label", scope) ?: "Chip") })
        "TextField" -> OutlinedTextField(
            value = resolve(node, "value", scope) ?: "",
            onValueChange = {},
            modifier = modifier,
            label = { Text(resolve(node, "label", scope) ?: "") },
            placeholder = { Text(node.props.prop("placeholder") ?: "") },
            readOnly = true,
        )
        "Switch" -> Row(modifier, verticalAlignment = Alignment.CenterVertically) {
            Text(resolve(node, "label", scope) ?: "", modifier = Modifier.weight(1f))
            Switch(checked = node.props.bool("checked"), onCheckedChange = null)
        }
        "Checkbox" -> Row(modifier, verticalAlignment = Alignment.CenterVertically) {
            Text(resolve(node, "label", scope) ?: "", modifier = Modifier.weight(1f))
            Checkbox(checked = node.props.bool("checked"), onCheckedChange = null)
        }
        "Text" -> Text(
            text = resolve(node, "text", scope) ?: "",
            style = typeStyle(node.props.prop("style")),
            color = colorToken(node.props.prop("color")),
            modifier = modifier,
        )
        "Image" -> {
            val accent = Color(android.graphics.Color.parseColor(resolve(node, "accent", scope) ?: "#6750A4"))
            Box(
                modifier = modifier
                    .height((node.modifiers.heightDp ?: 72).dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(accent),
            )
        }
        "Icon" -> Icon(
            iconOf(node.props.prop("name") ?: "star"),
            contentDescription = null,
            tint = colorToken(node.props.prop("color") ?: "primary"),
            modifier = Modifier.size((node.props.int("size", 24)).dp),
        )
        "ListItem" -> Row(modifier, verticalAlignment = Alignment.CenterVertically) {
            Icon(iconOf(node.props.prop("leadingIcon") ?: "star"), contentDescription = null)
            Spacer(Modifier.width(16.dp))
            Column {
                Text(resolve(node, "headline", scope) ?: "", style = MaterialTheme.typography.titleMedium)
                Text(resolve(node, "supporting", scope) ?: "", style = MaterialTheme.typography.bodyMedium)
            }
        }
        "Divider" -> HorizontalDivider(modifier)
        "Spacer" -> Spacer(Modifier.height((node.props.int("height", 16)).dp))
        "CircularProgress" -> CircularProgressIndicator(Modifier.size((node.props.int("size", 40)).dp))
        else -> Text("Unknown ${node.type}", color = MaterialTheme.colorScheme.error)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StudioScaffold(node: UiNode, scope: BindingScope) {
    val top = node.children.find { it.slot == "topBar" || it.type == "TopAppBar" }
    val bottom = node.children.find { it.slot == "bottomBar" || it.type == "NavigationBar" }
    val fab = node.children.find { it.slot == "fab" || it.type == "FAB" }
    val content = node.children.find { it.slot == "content" }
        ?: node.copy(children = node.children.filter { it != top && it != bottom && it != fab })
    Scaffold(
        topBar = { if (top != null) RenderNode(top, scope, 0) },
        bottomBar = { if (bottom != null) RenderNode(bottom, scope, 0) },
        floatingActionButton = { if (fab != null) RenderNode(fab, scope, 0) },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            RenderNode(content, scope, 0)
        }
    }
}

@Composable
private fun StudioList(node: UiNode, scope: BindingScope, modifier: Modifier) {
    val path = node.itemBinding.orEmpty()
    val items = if (path.isNotBlank()) {
        when (val found = JsonObject(scope).getByPath(path) ?: scope.resolvePath(path)) {
            is JsonArray -> found
            else -> JsonArray(emptyList())
        }
    } else null

    if (items == null) {
        LazyColumn(modifier, verticalArrangement = Arrangement.spacedBy((node.props.int("spacedBy", 12)).dp)) {
            items(node.children.size) { index -> RenderNode(node.children[index], scope, index) }
        }
        return
    }

    LazyColumn(modifier, verticalArrangement = Arrangement.spacedBy((node.props.int("spacedBy", 12)).dp)) {
        itemsIndexed(items) { index, item ->
            val childScope = scope.toMutableMap().apply {
                put("item", item)
            }
            Column {
                node.children.forEach { RenderNode(it, childScope, index) }
            }
        }
    }
}

private fun resolve(node: UiNode, key: String, scope: BindingScope): String? {
    val binding = node.bindings[key]
    if (!binding.isNullOrBlank()) {
        return scope.resolvePath(binding)?.asDisplayString()
    }
    return node.props.prop(key)
}

private fun UiNode.studioModifier(): Modifier {
    var modifier: Modifier = Modifier
    if (modifiers.fillMaxWidth) modifier = modifier.fillMaxWidth()
    if (modifiers.fillMaxHeight) modifier = modifier.fillMaxHeight()
    modifiers.widthDp?.let { modifier = modifier.width(it.dp) }
    modifiers.heightDp?.let { modifier = modifier.height(it.dp) }
    modifiers.padding?.let { pad ->
        modifier = if (pad.all != null) modifier.padding(pad.all.dp)
        else modifier.padding(
            start = (pad.start ?: 0).dp,
            top = (pad.top ?: 0).dp,
            end = (pad.end ?: 0).dp,
            bottom = (pad.bottom ?: 0).dp,
        )
    }
    return modifier
}

private fun enterTransition(animation: EnterAnimation?, itemIndex: Int) = run {
    val spec = tween<Float>(
        durationMillis = animation?.durationMs ?: 280,
        delayMillis = (animation?.delayMs ?: 0) + itemIndex * (animation?.staggerMs ?: 0),
    )
    when (animation?.type) {
        "slideUp" -> fadeIn(spec) + slideInVertically(animationSpec = tween(animation.durationMs, spec.delayMillis)) { it / 5 }
        "slideLeft" -> fadeIn(spec) + slideInHorizontally(animationSpec = tween(animation.durationMs, spec.delayMillis)) { it / 4 }
        "scale" -> fadeIn(spec) + scaleIn(initialScale = 0.92f, animationSpec = tween(animation.durationMs, spec.delayMillis))
        "none", null -> fadeIn(tween(0))
        else -> fadeIn(spec)
    }
}

@Composable
private fun typeStyle(name: String?): TextStyle = when (name) {
    "displayLarge" -> MaterialTheme.typography.displayLarge
    "headlineMedium" -> MaterialTheme.typography.headlineMedium
    "titleLarge" -> MaterialTheme.typography.titleLarge
    "titleMedium" -> MaterialTheme.typography.titleMedium
    "bodyMedium" -> MaterialTheme.typography.bodyMedium
    "labelLarge" -> MaterialTheme.typography.labelLarge
    "labelMedium" -> MaterialTheme.typography.labelMedium
    else -> MaterialTheme.typography.bodyLarge
}

@Composable
private fun colorToken(name: String?): Color {
    val scheme = MaterialTheme.colorScheme
    return when (name) {
        "primary" -> scheme.primary
        "onPrimary" -> scheme.onPrimary
        "primaryContainer" -> scheme.primaryContainer
        "onPrimaryContainer" -> scheme.onPrimaryContainer
        "secondary" -> scheme.secondary
        "onSurfaceVariant" -> scheme.onSurfaceVariant
        "error" -> scheme.error
        "tertiary" -> scheme.tertiary
        else -> scheme.onSurface
    }
}

private fun iconOf(name: String): ImageVector = when (name) {
    "home" -> Icons.Filled.Home
    "search" -> Icons.Filled.Search
    "cart" -> Icons.Filled.ShoppingCart
    "person" -> Icons.Filled.Person
    "add" -> Icons.Filled.Add
    "favorite" -> Icons.Filled.Favorite
    "settings" -> Icons.Filled.Settings
    "back" -> Icons.Filled.ArrowBack
    "menu" -> Icons.Filled.Menu
    "notifications" -> Icons.Filled.Notifications
    "tune" -> Icons.Filled.Tune
    else -> Icons.Filled.Star
}

private fun seedScheme(seed: String, dark: Boolean) = if (dark) {
    darkColorScheme(
        primary = Color(if (seed == "teal") 0xFF4CDADA else if (seed == "blue") 0xFFA9C7FF else if (seed == "orange") 0xFFFFB870 else 0xFFD0BCFF),
        secondary = Color(0xFFCCC2DC),
        tertiary = Color(0xFFEFB8C8),
    )
} else {
    lightColorScheme(
        primary = Color(if (seed == "teal") 0xFF006A6A else if (seed == "blue") 0xFF005DB7 else if (seed == "orange") 0xFF8B5000 else 0xFF6750A4),
        secondary = Color(0xFF625B71),
        tertiary = Color(0xFF7D5260),
    )
}
