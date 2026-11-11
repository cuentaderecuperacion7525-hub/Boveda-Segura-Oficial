package com.calculadora.boveda.privada;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQ_CODE = 1001;
    private static boolean currentIsDarkTheme = true;

    public static void syncSafeAreaInsetsToWebView(final Activity activity) {
        if (activity == null) return;
        try {
            Window window = activity.getWindow();
            if (window == null) return;
            View decorView = window.getDecorView();
            WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decorView);
            if (rootInsets == null) return;

            Insets bars = rootInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets imeInsets = rootInsets.getInsets(WindowInsetsCompat.Type.ime());
            boolean keyboardVisible = rootInsets.isVisible(WindowInsetsCompat.Type.ime());

            // Eliminar cualquier padding superior/inferior que el plugin SystemBars de Capacitor 8 intente agregar al DecorView
            decorView.setPadding(0, 0, 0, keyboardVisible ? imeInsets.bottom : 0);

            if (activity instanceof BridgeActivity) {
                BridgeActivity bridgeActivity = (BridgeActivity) activity;
                if (bridgeActivity.getBridge() != null && bridgeActivity.getBridge().getWebView() != null) {
                    final WebView webView = bridgeActivity.getBridge().getWebView();
                    webView.setPadding(0, 0, 0, 0);

                    float density = decorView.getResources().getDisplayMetrics().density;
                    if (density <= 0f) density = 1f;

                    float topDp = bars.top / density;
                    float bottomDp = (keyboardVisible ? 0 : bars.bottom) / density;

                    final String js = String.format(
                        Locale.US,
                        "document.documentElement.style.setProperty('--safe-top','%.1fpx');document.documentElement.style.setProperty('--safe-bottom','%.1fpx');",
                        topDp,
                        bottomDp
                    );
                    webView.post(() -> {
                        try {
                            webView.evaluateJavascript(js, null);
                        } catch (Exception ignored) {}
                    });
                }
            }
        } catch (Exception ignored) {}
    }

    public static void applySystemBarsTheme(final Activity activity, final boolean isDark) {
        currentIsDarkTheme = isDark;
        if (activity == null) return;
        final Runnable applyTask = () -> {
            try {
                Window window = activity.getWindow();
                if (window == null) return;
                View decorView = window.getDecorView();

                // Permitir que el WebView ocupe toda la pantalla de borde a borde (incluyendo el área del notch/cámara y barra inferior)
                WindowCompat.setDecorFitsSystemWindows(window, false);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    WindowManager.LayoutParams lp = window.getAttributes();
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS;
                    } else {
                        lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                    }
                    window.setAttributes(lp);
                }

                window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
                window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);

                // Pintar el fondo base del DecorView exactamente con el color del tema (nunca gris de Android)
                int baseBgColor = isDark ? Color.parseColor("#060B14") : Color.parseColor("#F1F5F9");
                decorView.setBackgroundColor(baseBgColor);

                // Hacer las barras 100% transparentes para que no existan franjas grises arriba ni abajo
                window.setStatusBarColor(Color.TRANSPARENT);
                window.setNavigationBarColor(Color.TRANSPARENT);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    window.setNavigationBarDividerColor(Color.TRANSPARENT);
                }

                // Desactivar el velo gris automático de contraste que Android 10+ pone sobre la barra de 3 botones y de estado
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    window.setStatusBarContrastEnforced(false);
                    window.setNavigationBarContrastEnforced(false);
                }

                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
                if (controller != null) {
                    controller.setAppearanceLightStatusBars(!isDark);
                    controller.setAppearanceLightNavigationBars(!isDark);
                }

                syncSafeAreaInsetsToWebView(activity);
            } catch (Exception ignored) {}
        };

        activity.runOnUiThread(() -> {
            applyTask.run();
            try {
                // Re-aplicar después en la cola del hilo principal para sobrescribir cualquier llamada tardía de SystemBars de Capacitor 8
                activity.getWindow().getDecorView().post(applyTask);
            } catch (Exception ignored) {}
        });
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VaultBiometricsPlugin.class);
        registerPlugin(VaultSecurityPlugin.class);
        registerPlugin(VaultMediaPlugin.class);
        registerPlugin(UpdaterPlugin.class);
        registerPlugin(VaultGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);

        final View decorView = getWindow().getDecorView();

        // Reemplazar cualquier listener de SystemBars en el DecorView para impedir que Capacitor 8 agregue padding gris arriba y abajo
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            boolean keyboardVisible = windowInsets.isVisible(WindowInsetsCompat.Type.ime());

            // Forzar padding superior e inferior en 0 para que el WebView llegue hasta los bordes físicos sin barras grises
            v.setPadding(0, 0, 0, keyboardVisible ? imeInsets.bottom : 0);

            int baseBgColor = currentIsDarkTheme ? Color.parseColor("#060B14") : Color.parseColor("#F1F5F9");
            v.setBackgroundColor(baseBgColor);

            if (getBridge() != null && getBridge().getWebView() != null) {
                final WebView webView = getBridge().getWebView();
                webView.setPadding(0, 0, 0, 0);

                float density = v.getResources().getDisplayMetrics().density;
                if (density <= 0f) density = 1f;

                float topDp = bars.top / density;
                float bottomDp = (keyboardVisible ? 0 : bars.bottom) / density;

                final String js = String.format(
                    Locale.US,
                    "document.documentElement.style.setProperty('--safe-top','%.1fpx');document.documentElement.style.setProperty('--safe-bottom','%.1fpx');",
                    topDp,
                    bottomDp
                );
                webView.post(() -> {
                    try {
                        webView.evaluateJavascript(js, null);
                    } catch (Exception ignored) {}
                });
            }

            return WindowInsetsCompat.CONSUMED;
        });

        // Aplicar modo borde a borde sin franjas grises desde el arranque
        applySystemBarsTheme(this, currentIsDarkTheme);

        // Bloqueo total a nivel de sistema operativo para capturas y grabaciones de pantalla
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );

        // Solicitar permisos necesarios desde el inicio (Cámara + Acceso Multimedia para MediaStore)
        checkAndRequestAppPermissions();

        // Concesión automática de permisos de cámara al WebView interno y soporte para descargas
        if (getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            webView.setBackgroundColor(Color.TRANSPARENT);
            webView.setPadding(0, 0, 0, 0);

            webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    request.grant(request.getResources());
                }

                @Override
                public boolean onShowFileChooser(
                    android.webkit.WebView view,
                    android.webkit.ValueCallback<android.net.Uri[]> filePathCallback,
                    android.webkit.WebChromeClient.FileChooserParams fileChooserParams
                ) {
                    android.webkit.ValueCallback<android.net.Uri[]> wrappedCallback = uris -> {
                        if (uris != null && uris.length > 0) {
                            try {
                                VaultMediaPlugin.recordPickedUris(getApplicationContext(), uris);
                            } catch (Exception ignored) {}
                        }
                        filePathCallback.onReceiveValue(uris);
                    };
                    return super.onShowFileChooser(view, wrappedCallback, fileChooserParams);
                }
            });

            webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                try {
                    android.app.DownloadManager.Request request = new android.app.DownloadManager.Request(android.net.Uri.parse(url));
                    request.setMimeType(mimetype != null ? mimetype : "application/json");
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Descargando copia de seguridad...");
                    String fileName = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype);
                    request.setTitle(fileName);
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName);
                    android.app.DownloadManager dm = (android.app.DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                    }
                } catch (Exception ignored) {}
            });
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBarsTheme(this, currentIsDarkTheme);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applySystemBarsTheme(this, currentIsDarkTheme);
        }
    }

    private void checkAndRequestAppPermissions() {
        List<String> neededPermissions = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            neededPermissions.add(Manifest.permission.CAMERA);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ (API 33+)
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(Manifest.permission.READ_MEDIA_IMAGES);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(Manifest.permission.READ_MEDIA_VIDEO);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(Manifest.permission.READ_MEDIA_AUDIO);
            }
        } else {
            // Android 12 y anteriores
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    neededPermissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
                }
            }
        }

        if (!neededPermissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, neededPermissions.toArray(new String[0]), PERMISSION_REQ_CODE);
        }
    }
}

