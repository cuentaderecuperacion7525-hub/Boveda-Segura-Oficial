package com.calculadora.boveda.privada

import android.os.Build
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import androidx.annotation.RequiresApi
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.concurrent.Executor

/**
 * Native Android Biometric Plugin & JavascriptInterface
 * Allows 100% offline fingerprint / biometric authentication via Android BiometricPrompt
 * Works even in Airplane mode and without Google Play Services!
 */
@CapacitorPlugin(name = "VaultBiometrics")
class VaultBiometricPlugin : Plugin() {

    /**
     * Checks if biometric hardware and enrolled fingerprints are available on the Android device.
     */
    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("Activity not available")
            return
        }

        val biometricManager = BiometricManager.from(activity)
        val canAuthenticate = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK
        )

        val ret = JSObject()
        when (canAuthenticate) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
                ret.put("isAvailable", true)
                ret.put("hasEnrolled", true)
                ret.put("status", "SUCCESS")
            }
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
                ret.put("isAvailable", true)
                ret.put("hasEnrolled", false)
                ret.put("status", "NOT_ENROLLED")
            }
            else -> {
                ret.put("isAvailable", false)
                ret.put("hasEnrolled", false)
                ret.put("status", "UNAVAILABLE")
            }
        }
        call.resolve(ret)
    }

    /**
     * Prompts the user with native Android BiometricPrompt (Fingerprint Dialog)
     */
    @PluginMethod
    fun authenticate(call: PluginCall) {
        val activity = activity as? FragmentActivity ?: run {
            call.reject("Activity is not a FragmentActivity")
            return
        }

        val title = call.getString("title", "Desbloquear Bóveda") ?: "Desbloquear Bóveda"
        val subtitle = call.getString("subtitle", "Usa tu huella digital para acceder") ?: "Usa tu huella digital para acceder"
        val negativeBtn = call.getString("negativeButton", "Usar PIN") ?: "Usar PIN"

        activity.runOnUiThread {
            val executor: Executor = ContextCompat.getMainExecutor(activity)
            val biometricPrompt = BiometricPrompt(activity, executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        super.onAuthenticationSucceeded(result)
                        val ret = JSObject()
                        ret.put("success", true)
                        call.resolve(ret)
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        super.onAuthenticationError(errorCode, errString)
                        val ret = JSObject()
                        ret.put("success", false)
                        ret.put("errorCode", errorCode)
                        ret.put("message", errString.toString())
                        call.resolve(ret)
                    }

                    override fun onAuthenticationFailed() {
                        super.onAuthenticationFailed()
                        // User touched sensor with wrong finger, prompt stays open
                    }
                })

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setNegativeButtonText(negativeBtn)
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK)
                .build()

            biometricPrompt.authenticate(promptInfo)
        }
    }
}
