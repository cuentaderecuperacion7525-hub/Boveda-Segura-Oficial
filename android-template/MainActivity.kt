package com.calculadora.boveda.privada

import android.os.Bundle
import android.view.WindowManager
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Bloqueo total de capturas de pantalla (botones físicos, gesto de 3 dedos, grabadores y multitarea)
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )

        // Registra los plugins nativos de Capacitor (Eliminación en MediaStore y Huella Digital)
        registerPlugin(VaultMediaPlugin::class.java)
        registerPlugin(VaultBiometricPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}

