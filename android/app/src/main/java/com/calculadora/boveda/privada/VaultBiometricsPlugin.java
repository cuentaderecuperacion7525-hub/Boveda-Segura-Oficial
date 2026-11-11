package com.calculadora.boveda.privada;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.Executor;

@CapacitorPlugin(name = "VaultBiometrics")
public class VaultBiometricsPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        try {
            BiometricManager biometricManager = BiometricManager.from(getContext());
            int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK;
            int canAuthenticate = biometricManager.canAuthenticate(authenticators);

            JSObject ret = new JSObject();
            if (canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS) {
                ret.put("isAvailable", true);
                ret.put("hasEnrolled", true);
                ret.put("status", "available");
            } else if (canAuthenticate == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) {
                ret.put("isAvailable", true);
                ret.put("hasEnrolled", false);
                ret.put("status", "none_enrolled");
            } else {
                ret.put("isAvailable", false);
                ret.put("hasEnrolled", false);
                ret.put("status", "not_supported");
            }
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("isAvailable", false);
            ret.put("hasEnrolled", false);
            ret.put("status", "error");
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        FragmentActivity activity = (FragmentActivity) getActivity();
        if (activity == null) {
            call.reject("Activity no disponible");
            return;
        }

        String title = call.getString("title", "Autenticación Biométrica");
        String subtitle = call.getString("subtitle", "Toca el sensor de huella");
        String negativeButton = call.getString("negativeButton", "Cancelar");

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Executor executor = ContextCompat.getMainExecutor(activity);
                    BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            super.onAuthenticationError(errorCode, errString);
                            JSObject ret = new JSObject();
                            ret.put("success", false);
                            ret.put("errorCode", errorCode);
                            ret.put("message", errString.toString());
                            call.resolve(ret);
                        }

                        @Override
                        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                            super.onAuthenticationSucceeded(result);
                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            call.resolve(ret);
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            super.onAuthenticationFailed();
                        }
                    });

                    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                            .setTitle(title)
                            .setSubtitle(subtitle)
                            .setNegativeButtonText(negativeButton)
                            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK)
                            .build();

                    biometricPrompt.authenticate(promptInfo);
                } catch (Exception e) {
                    call.reject("Error al iniciar lector biométrico: " + e.getMessage());
                }
            }
        });
    }
}
