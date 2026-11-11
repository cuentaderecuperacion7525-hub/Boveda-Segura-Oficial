package com.calculadora.boveda.privada;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import java.util.List;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "UpdaterPlugin")
public class UpdaterPlugin extends Plugin {
    private static final String TAG = "VaultUpdaterPlugin";

    /**
     * Obtiene el código de versión (versionCode) y nombre de versión real instalado en el dispositivo.
     */
    @PluginMethod
    public void getAppVersionCode(PluginCall call) {
        try {
            Context context = getContext();
            PackageManager pm = context.getPackageManager();
            PackageInfo pInfo = pm.getPackageInfo(context.getPackageName(), 0);

            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = pInfo.getLongVersionCode();
            } else {
                versionCode = pInfo.versionCode;
            }

            JSObject ret = new JSObject();
            ret.put("versionCode", versionCode);
            ret.put("versionName", pInfo.versionName);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error al obtener versión instalada", e);
            call.reject("Error al obtener versión: " + e.getMessage());
        }
    }

    /**
     * Descarga el archivo APK en segundo plano y ejecuta el instalador del sistema operativo Android.
     */
    @PluginMethod
    public void downloadAndInstall(final PluginCall call) {
        final String apkUrl = call.getString("url");
        if (apkUrl == null || apkUrl.trim().isEmpty()) {
            call.reject("URL del APK no proporcionada");
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Context context = getContext();
                    File cacheDir = context.getExternalCacheDir();
                    if (cacheDir == null) {
                        cacheDir = context.getCacheDir();
                    }

                    File apkFile = new File(cacheDir, "boveda_update.apk");
                    if (apkFile.exists()) {
                        apkFile.delete();
                    }

                    // Descargar siguiendo redirecciones (GitHub releases redirige 302 a CDN)
                    String currentUrl = apkUrl;
                    HttpURLConnection connection = null;
                    int redirects = 0;
                    while (redirects < 6) {
                        URL url = new URL(currentUrl);
                        connection = (HttpURLConnection) url.openConnection();
                        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Android; Mobile)");
                        connection.setConnectTimeout(25000);
                        connection.setReadTimeout(45000);
                        connection.setInstanceFollowRedirects(true);
                        connection.connect();

                        int responseCode = connection.getResponseCode();
                        if (responseCode == HttpURLConnection.HTTP_MOVED_PERM ||
                            responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
                            responseCode == HttpURLConnection.HTTP_SEE_OTHER ||
                            responseCode == 307 || responseCode == 308) {
                            String newUrl = connection.getHeaderField("Location");
                            if (newUrl != null && !newUrl.isEmpty()) {
                                currentUrl = newUrl;
                                redirects++;
                                continue;
                            }
                        }
                        break;
                    }

                    if (connection == null || connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                        int code = connection != null ? connection.getResponseCode() : -1;
                        call.reject("Error al descargar APK: Código HTTP " + code);
                        return;
                    }

                    int fileLength = connection.getContentLength();
                    InputStream in = connection.getInputStream();
                    FileOutputStream out = new FileOutputStream(apkFile);
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    long totalBytes = 0;
                    int lastReportedPercent = -1;
                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                        totalBytes += bytesRead;
                        if (fileLength > 0) {
                            int percent = (int) ((totalBytes * 100) / fileLength);
                            if (percent != lastReportedPercent) {
                                lastReportedPercent = percent;
                                JSObject progressObj = new JSObject();
                                progressObj.put("percent", percent);
                                progressObj.put("loaded", totalBytes);
                                progressObj.put("total", fileLength);
                                notifyListeners("downloadProgress", progressObj);
                            }
                        }
                    }
                    out.flush();
                    out.close();
                    in.close();

                    if (!apkFile.exists() || apkFile.length() < 1024) {
                        call.reject("El archivo descargado no es un APK válido");
                        return;
                    }

                    // Permiso de fuentes desconocidas en Android 8.0+ (Oreo+)
                    boolean hasUnknownSourcePermission = true;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        hasUnknownSourcePermission = context.getPackageManager().canRequestPackageInstalls();
                        if (!hasUnknownSourcePermission) {
                            try {
                                Intent manageIntent = new Intent(
                                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse("package:" + context.getPackageName())
                                );
                                manageIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                context.startActivity(manageIntent);
                            } catch (Exception ex) {
                                Log.w(TAG, "No se pudo abrir configuración de orígenes desconocidos", ex);
                            }
                        }
                    }

                    // Lanzar el instalador nativo de paquetes con FileProvider
                    Uri apkUri = FileProvider.getUriForFile(
                        context,
                        context.getPackageName() + ".fileprovider",
                        apkFile
                    );

                    Intent installIntent = new Intent(Intent.ACTION_VIEW);
                    installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                    installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    installIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

                    // Conceder permisos explícitos de lectura a todos los componentes instaladores del sistema
                    List<ResolveInfo> resInfoList = context.getPackageManager().queryIntentActivities(installIntent, PackageManager.MATCH_DEFAULT_ONLY);
                    for (ResolveInfo resolveInfo : resInfoList) {
                        String targetPackage = resolveInfo.activityInfo.packageName;
                        context.grantUriPermission(targetPackage, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    }

                    context.startActivity(installIntent);

                    JSObject res = new JSObject();
                    res.put("success", true);
                    res.put("message", hasUnknownSourcePermission ? "Instalador iniciado" : "Activa 'Permitir desde esta fuente' y regresa para continuar");
                    call.resolve(res);

                } catch (Exception e) {
                    Log.e(TAG, "Fallo durante la descarga o instalación", e);
                    call.reject("Error en instalación: " + e.getMessage());
                }
            }
        }).start();
    }
}
