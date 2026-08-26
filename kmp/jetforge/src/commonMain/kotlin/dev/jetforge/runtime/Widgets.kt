package dev.jetforge.runtime

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import dev.jetforge.runtime.ui.JetForgeComponent as EmbeddedComponent
import dev.jetforge.runtime.ui.JetForgeScreen as EmbeddedScreen

/** Full published screen. See [dev.jetforge.runtime.ui.JetForgeScreen]. */
@Composable
fun JetForgeScreen(
    endpoint: String,
    modifier: Modifier = Modifier,
    config: JetForgeConfig = JetForge.config,
    onOpenUrl: ((String) -> Unit)? = null,
) = EmbeddedScreen(endpoint, modifier, config, onOpenUrl)

/** Embedded published region. See [dev.jetforge.runtime.ui.JetForgeComponent]. */
@Composable
fun JetForgeComponent(
    endpoint: String,
    modifier: Modifier = Modifier,
    config: JetForgeConfig = JetForge.config,
    onOpenUrl: ((String) -> Unit)? = null,
) = EmbeddedComponent(endpoint, modifier, config, onOpenUrl)
