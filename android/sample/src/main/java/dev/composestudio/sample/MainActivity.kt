package dev.composestudio.sample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import dev.composestudio.runtime.bind.BindingScope
import dev.composestudio.runtime.model.ScreenDocument
import dev.composestudio.runtime.net.ScreenClient
import dev.composestudio.runtime.render.StudioScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val baseUrl = intent.getStringExtra("BASE_URL") ?: "http://10.0.2.2:43145"
        val screenId = intent.getStringExtra("SCREEN_ID") ?: "aurora-market"
        setContent {
            var document by remember { mutableStateOf<ScreenDocument?>(null) }
            var scope by remember { mutableStateOf<BindingScope>(mutableMapOf()) }
            var error by remember { mutableStateOf<String?>(null) }

            LaunchedEffect(screenId) {
                try {
                    val screen = withContext(Dispatchers.IO) { ScreenClient.fetchScreen(baseUrl, screenId) }
                    val bindings = withContext(Dispatchers.IO) { ScreenClient.fetchBindings(screen, baseUrl) }
                    document = screen
                    scope = bindings
                } catch (t: Throwable) {
                    error = t.message ?: "Failed to load screen"
                }
            }

            when {
                error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(error ?: "")
                }
                document == null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                else -> StudioScreen(document!!, scope)
            }
        }
    }
}
