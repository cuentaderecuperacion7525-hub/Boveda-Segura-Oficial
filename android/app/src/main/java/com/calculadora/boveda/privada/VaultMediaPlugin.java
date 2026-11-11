package com.calculadora.boveda.privada;

import android.app.Activity;
import android.app.PendingIntent;
import android.app.RecoverableSecurityException;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Base64InputStream;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.json.JSONObject;

@CapacitorPlugin(name = "VaultMedia")
public class VaultMediaPlugin extends Plugin {

    private static class PickedMediaEntry {
        final Uri rawUri;
        final Uri mediaStoreUri;
        final String displayName;
        final long size;
        final String filePath;
        final long timestamp;
        boolean consumed;

        PickedMediaEntry(Uri rawUri, Uri mediaStoreUri, String displayName, long size, String filePath, long timestamp) {
            this.rawUri = rawUri;
            this.mediaStoreUri = mediaStoreUri;
            this.displayName = displayName;
            this.size = size;
            this.filePath = filePath;
            this.timestamp = timestamp;
            this.consumed = false;
        }
    }

    private static final List<PickedMediaEntry> lastPickedEntries = new ArrayList<>();

    /**
     * Registra los URIs exactos seleccionados por el usuario en el selector nativo de Android
     * mientras el permiso temporal de lectura sobre el URI seleccionado sigue activo.
     */
    public static synchronized void recordPickedUris(Context context, Uri[] uris) {
        if (context == null || uris == null || uris.length == 0) return;
        long now = System.currentTimeMillis();

        // Limpiar entradas antiguas (> 5 minutos)
        Iterator<PickedMediaEntry> it = lastPickedEntries.iterator();
        while (it.hasNext()) {
            PickedMediaEntry e = it.next();
            if (now - e.timestamp > 300000L) {
                it.remove();
            }
        }

        ContentResolver resolver = context.getContentResolver();
        for (Uri rawUri : uris) {
            if (rawUri == null) continue;
            String displayName = null;
            long size = -1;
            String filePath = null;
            String mimeType = null;

            try {
                mimeType = resolver.getType(rawUri);
            } catch (Exception ignored) {}

            try (Cursor c = resolver.query(rawUri, null, null, null, null)) {
                if (c != null && c.moveToFirst()) {
                    int nameIdx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIdx == -1) nameIdx = c.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME);
                    if (nameIdx >= 0 && !c.isNull(nameIdx)) {
                        displayName = c.getString(nameIdx);
                    }

                    int sizeIdx = c.getColumnIndex(OpenableColumns.SIZE);
                    if (sizeIdx == -1) sizeIdx = c.getColumnIndex(MediaStore.MediaColumns.SIZE);
                    if (sizeIdx >= 0 && !c.isNull(sizeIdx)) {
                        size = c.getLong(sizeIdx);
                    }

                    int dataIdx = c.getColumnIndex(MediaStore.MediaColumns.DATA);
                    if (dataIdx >= 0 && !c.isNull(dataIdx)) {
                        filePath = c.getString(dataIdx);
                    }
                }
            } catch (Exception ignored) {}

            Uri mediaStoreUri = resolvePickedUriToMediaStore(context, resolver, rawUri, displayName, size, filePath, mimeType);
            lastPickedEntries.add(new PickedMediaEntry(rawUri, mediaStoreUri, displayName, size, filePath, now));
        }
    }

    private static Uri getMediaCollectionUri(String typeOrMime) {
        if (typeOrMime != null) {
            String lower = typeOrMime.toLowerCase();
            if (lower.startsWith("video") || lower.contains("video")) {
                return MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
            }
            if (lower.startsWith("audio") || lower.contains("audio")) {
                return MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            }
        }
        return MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
    }

    /**
     * Convierte cualquier URI devuelto por Photo Picker, DocumentsUI o Galería de cualquier fabricante
     * (Samsung, Xiaomi, Motorola, Honor, Huawei, Pixel, etc.) al URI oficial de MediaStore para createDeleteRequest.
     */
    private static Uri resolvePickedUriToMediaStore(
        Context context,
        ContentResolver resolver,
        Uri rawUri,
        String displayName,
        long size,
        String filePath,
        String mimeType
    ) {
        if (rawUri == null) return null;

        // 1. API oficial de Android 10+ / 12+ para traducir URIs de Photo Picker y DocumentsProvider a MediaStore
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                Uri converted = MediaStore.getMediaUri(context, rawUri);
                if (converted != null) {
                    return converted;
                }
            } catch (Throwable ignored) {}
        }

        String uriStr = rawUri.toString();
        String authority = rawUri.getAuthority() != null ? rawUri.getAuthority() : "";

        // 2. DocumentUri (ej: content://com.android.providers.media.documents/document/image%3A12345)
        try {
            if (DocumentsContract.isDocumentUri(context, rawUri)) {
                String docId = DocumentsContract.getDocumentId(rawUri);
                if (docId != null) {
                    if (docId.startsWith("raw:")) {
                        filePath = docId.substring(4);
                    } else if (docId.contains(":")) {
                        String[] parts = docId.split(":");
                        if (parts.length >= 2) {
                            String prefix = parts[0];
                            String idPart = parts[parts.length - 1];
                            if (idPart.matches("\\d+")) {
                                long id = Long.parseLong(idPart);
                                Uri base = getMediaCollectionUri(prefix.equals("msf") || prefix.equals("document") ? mimeType : prefix);
                                return ContentUris.withAppendedId(base, id);
                            }
                        }
                    } else if (docId.matches("\\d+")) {
                        long id = Long.parseLong(docId);
                        return ContentUris.withAppendedId(getMediaCollectionUri(mimeType), id);
                    }
                }
            }
        } catch (Exception ignored) {}

        // 3. Android 13/14/15 Photo Picker URI (ej: content://media/picker/0/.../media/1000012345)
        if (uriStr.contains("/picker") || authority.contains("photopicker")) {
            String lastSeg = rawUri.getLastPathSegment();
            if (lastSeg != null) {
                if (lastSeg.contains(":")) {
                    String[] parts = lastSeg.split(":");
                    lastSeg = parts[parts.length - 1];
                }
                if (lastSeg.matches("\\d+")) {
                    try {
                        long id = Long.parseLong(lastSeg);
                        return ContentUris.withAppendedId(getMediaCollectionUri(mimeType), id);
                    } catch (Exception ignored) {}
                }
            }
        }

        // 4. Si ya es un URI directo de MediaStore (ej: content://media/external/images/media/12345)
        if ("media".equalsIgnoreCase(authority) && !uriStr.contains("/picker")) {
            String lastSeg = rawUri.getLastPathSegment();
            if (lastSeg != null && lastSeg.matches("\\d+")) {
                try {
                    long id = Long.parseLong(lastSeg);
                    if (uriStr.contains("/video/")) {
                        return ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);
                    } else if (uriStr.contains("/audio/")) {
                        return ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id);
                    } else {
                        return ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id);
                    }
                } catch (Exception ignored) {}
            }
            return rawUri;
        }

        // 5. Si el proveedor de galería devolvió ruta física en _data o en el path del URI
        if (filePath == null && "file".equalsIgnoreCase(rawUri.getScheme())) {
            filePath = rawUri.getPath();
        }
        if (filePath != null && !filePath.isEmpty()) {
            Uri base = getMediaCollectionUri(mimeType);
            try (Cursor c = resolver.query(
                base,
                new String[]{MediaStore.MediaColumns._ID},
                MediaStore.MediaColumns.DATA + " = ?",
                new String[]{filePath},
                MediaStore.MediaColumns._ID + " DESC"
            )) {
                if (c != null && c.moveToFirst()) {
                    long id = c.getLong(0);
                    return ContentUris.withAppendedId(base, id);
                }
            } catch (Exception ignored) {}

            if (displayName == null) {
                displayName = new File(filePath).getName();
            }
        }

        return null;
    }

    private static synchronized Uri matchFromPickedUris(String filename, long size, int index, int totalRequested) {
        if (lastPickedEntries.isEmpty()) return null;

        // 1. Coincidencia por nombre y/o tamaño
        for (int i = lastPickedEntries.size() - 1; i >= 0; i--) {
            PickedMediaEntry entry = lastPickedEntries.get(i);
            if (entry.consumed || entry.mediaStoreUri == null) continue;

            boolean nameMatches = filename != null && entry.displayName != null &&
                (filename.equalsIgnoreCase(entry.displayName) ||
                 entry.displayName.endsWith(filename) ||
                 filename.endsWith(entry.displayName));
            boolean sizeMatches = size > 0 && entry.size > 0 && size == entry.size;

            if ((nameMatches && sizeMatches) || nameMatches || sizeMatches) {
                entry.consumed = true;
                return entry.mediaStoreUri;
            }
        }

        // 2. Si el WebView renombró el archivo (ej: a ID numérico) pero hay entradas recién seleccionadas sin consumir
        int unconsumedCount = 0;
        PickedMediaEntry firstUnconsumed = null;
        for (PickedMediaEntry entry : lastPickedEntries) {
            if (!entry.consumed && entry.mediaStoreUri != null) {
                unconsumedCount++;
                if (firstUnconsumed == null) {
                    firstUnconsumed = entry;
                }
            }
        }
        if (firstUnconsumed != null && (unconsumedCount == totalRequested || totalRequested == 1)) {
            firstUnconsumed.consumed = true;
            return firstUnconsumed.mediaStoreUri;
        }

        return null;
    }

    /**
     * Guarda y restaura un archivo multimedia o documento en el almacenamiento público del dispositivo / galería (MediaStore)
     */
    @PluginMethod
    public void exportMediaToDevice(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String filename = call.getString("filename", "archivo_restaurado");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String category = call.getString("category", "photo");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("No se proporcionaron datos para exportar");
            return;
        }

        try {
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }

            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            ContentResolver resolver = getContext().getContentResolver();
            Uri targetUri = null;
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);

            boolean isPhoto = "photo".equalsIgnoreCase(category) || (mimeType != null && mimeType.startsWith("image/"));
            boolean isVideo = "video".equalsIgnoreCase(category) || (mimeType != null && mimeType.startsWith("video/"));
            boolean isAudio = "audio".equalsIgnoreCase(category) || (mimeType != null && mimeType.startsWith("audio/"));
            boolean isBackup = "backup".equalsIgnoreCase(category) || (filename != null && filename.endsWith(".json")) || "application/json".equalsIgnoreCase(mimeType);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                try {
                    if (isPhoto) {
                        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Restauradas");
                        targetUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                    } else if (isVideo) {
                        values.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/Restauradas");
                        targetUri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
                    } else if (isAudio) {
                        values.put(MediaStore.Audio.Media.RELATIVE_PATH, Environment.DIRECTORY_MUSIC + "/Restauradas");
                        targetUri = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values);
                    } else if (isBackup) {
                        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                        targetUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    } else {
                        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Restauradas");
                        targetUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    }
                } catch (Exception exInsert) {
                    // Fallback sin ruta relativa si el dispositivo es estricto
                    values.remove(MediaStore.MediaColumns.RELATIVE_PATH);
                    if (isPhoto) {
                        targetUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                    } else if (isVideo) {
                        targetUri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
                    } else if (isAudio) {
                        targetUri = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values);
                    } else {
                        targetUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    }
                }
            } else {
                File exportDir;
                if (isPhoto) {
                    exportDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                } else if (isVideo) {
                    exportDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES);
                } else if (isAudio) {
                    exportDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC);
                } else {
                    exportDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                }
                if (!exportDir.exists()) exportDir.mkdirs();
                File destFile = new File(exportDir, filename);
                int counter = 1;
                while (destFile.exists()) {
                    String nameOnly = filename.contains(".") ? filename.substring(0, filename.lastIndexOf('.')) : filename;
                    String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.')) : "";
                    destFile = new File(exportDir, nameOnly + "_" + counter + ext);
                    counter++;
                }
                try (FileOutputStream fos = new FileOutputStream(destFile)) {
                    fos.write(bytes);
                    fos.flush();
                }
                MediaScannerConnection.scanFile(
                    getContext(),
                    new String[]{destFile.getAbsolutePath()},
                    new String[]{mimeType},
                    null
                );

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("path", destFile.getAbsolutePath());
                call.resolve(ret);
                return;
            }

            if (targetUri == null) {
                call.reject("No se pudo crear el registro en la galería o almacenamiento");
                return;
            }

            try (OutputStream os = resolver.openOutputStream(targetUri)) {
                if (os == null) {
                    call.reject("No se pudo abrir el flujo de escritura del archivo");
                    return;
                }
                os.write(bytes);
                os.flush();
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(targetUri, values, null, null);
            }

            try {
                MediaScannerConnection.scanFile(
                    getContext(),
                    new String[]{targetUri.getPath()},
                    new String[]{mimeType},
                    null
                );
            } catch (Exception ignored) {}

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("uri", targetUri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error al guardar en el dispositivo: " + e.getMessage());
        }
    }

    /**
     * Guarda una copia de seguridad (.json) directamente en la carpeta pública "Descargas" (Downloads) del teléfono
     * para que sea visible de inmediato en cualquier explorador de archivos (Mis Archivos, Files de Google, etc.)
     */
    @PluginMethod
    public void saveBackupToDownloads(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String filename = call.getString("filename", "Boveda_Respaldo.json");
        String mimeType = call.getString("mimeType", "application/json");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("No se proporcionaron datos para guardar");
            return;
        }

        try {
            int commaIdx = base64Data.indexOf(",");
            String rawBase64 = commaIdx >= 0 ? base64Data.substring(commaIdx + 1) : base64Data;

            ContentResolver resolver = getContext().getContentResolver();
            Uri targetUri = null;
            String savedPath = null;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                try {
                    targetUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                } catch (Exception e) {
                    values.remove(MediaStore.Downloads.RELATIVE_PATH);
                    targetUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                }

                if (targetUri != null) {
                    try (OutputStream os = resolver.openOutputStream(targetUri);
                         ByteArrayInputStream bais = new ByteArrayInputStream(rawBase64.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
                         Base64InputStream b64is = new Base64InputStream(bais, Base64.DEFAULT)) {
                        if (os != null) {
                            byte[] buffer = new byte[32768];
                            int read;
                            while ((read = b64is.read(buffer)) != -1) {
                                os.write(buffer, 0, read);
                            }
                            os.flush();
                        }
                    }
                    values.clear();
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    resolver.update(targetUri, values, null, null);
                    savedPath = Environment.DIRECTORY_DOWNLOADS + "/" + filename;
                }
            }

            // Fallback para dispositivos anteriores a Android 10 o si MediaStore no resolvió
            if (savedPath == null) {
                File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (downloadDir != null && !downloadDir.exists()) {
                    downloadDir.mkdirs();
                }
                File destFile = new File(downloadDir, filename);
                int counter = 1;
                while (destFile.exists()) {
                    String nameOnly = filename.contains(".") ? filename.substring(0, filename.lastIndexOf('.')) : filename;
                    String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.')) : "";
                    destFile = new File(downloadDir, nameOnly + "_" + counter + ext);
                    counter++;
                }
                try (FileOutputStream fos = new FileOutputStream(destFile);
                     ByteArrayInputStream bais = new ByteArrayInputStream(rawBase64.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
                     Base64InputStream b64is = new Base64InputStream(bais, Base64.DEFAULT)) {
                    byte[] buffer = new byte[32768];
                    int read;
                    while ((read = b64is.read(buffer)) != -1) {
                        fos.write(buffer, 0, read);
                    }
                    fos.flush();
                }
                savedPath = destFile.getAbsolutePath();

                try {
                    MediaScannerConnection.scanFile(
                        getContext(),
                        new String[]{destFile.getAbsolutePath()},
                        new String[]{mimeType},
                        null
                    );
                } catch (Exception ignored) {}
            }

            // Notificar a MediaScanner para que la app Mis Archivos o Files de Google indexe el archivo de inmediato
            try {
                File directFile = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), filename);
                if (directFile.exists()) {
                    MediaScannerConnection.scanFile(getContext(), new String[]{directFile.getAbsolutePath()}, new String[]{mimeType}, null);
                }
            } catch (Exception ignored) {}

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("path", savedPath != null ? savedPath : "Descargas/" + filename);
            ret.put("folder", "Descargas");
            ret.put("filename", filename);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error al guardar en Descargas: " + e.getMessage());
        }
    }

    /**
     * Escribe la copia de seguridad por bloques (chunks) para evitar cualquier riesgo de Out-Of-Memory (OOM)
     * en respaldos pesados con decenas o cientos de fotos/videos.
     */
    @PluginMethod
    public void appendBackupChunk(PluginCall call) {
        String sessionKey = call.getString("sessionKey", "default");
        String chunk = call.getString("chunk", "");
        boolean isFirst = call.getBoolean("isFirst", false);
        boolean isLast = call.getBoolean("isLast", false);
        String filename = call.getString("filename", "Boveda_Respaldo.json");
        String mimeType = call.getString("mimeType", "application/json");

        try {
            File cacheDir = getContext().getCacheDir();
            File tempFile = new File(cacheDir, "temp_backup_" + sessionKey + ".tmp");

            if (isFirst && tempFile.exists()) {
                tempFile.delete();
            }

            if (chunk != null && !chunk.isEmpty()) {
                int commaIdx = chunk.indexOf(",");
                String rawChunk = commaIdx >= 0 ? chunk.substring(commaIdx + 1) : chunk;
                byte[] chunkBytes = Base64.decode(rawChunk, Base64.DEFAULT);
                try (FileOutputStream fos = new FileOutputStream(tempFile, true)) {
                    fos.write(chunkBytes);
                    fos.flush();
                }
            }

            if (isLast) {
                ContentResolver resolver = getContext().getContentResolver();
                Uri targetUri = null;
                String savedPath = null;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                    try {
                        targetUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    } catch (Exception e) {
                        values.remove(MediaStore.Downloads.RELATIVE_PATH);
                        targetUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    }

                    if (targetUri != null) {
                        try (InputStream in = new FileInputStream(tempFile);
                             OutputStream os = resolver.openOutputStream(targetUri)) {
                            if (os != null) {
                                byte[] buffer = new byte[32768];
                                int read;
                                while ((read = in.read(buffer)) != -1) {
                                    os.write(buffer, 0, read);
                                }
                                os.flush();
                            }
                        }
                        values.clear();
                        values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                        resolver.update(targetUri, values, null, null);
                        savedPath = Environment.DIRECTORY_DOWNLOADS + "/" + filename;
                    }
                }

                if (savedPath == null) {
                    File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (downloadDir != null && !downloadDir.exists()) {
                        downloadDir.mkdirs();
                    }
                    File destFile = new File(downloadDir, filename);
                    int counter = 1;
                    while (destFile.exists()) {
                        String nameOnly = filename.contains(".") ? filename.substring(0, filename.lastIndexOf('.')) : filename;
                        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.')) : "";
                        destFile = new File(downloadDir, nameOnly + "_" + counter + ext);
                        counter++;
                    }
                    try (InputStream in = new FileInputStream(tempFile);
                         FileOutputStream fos = new FileOutputStream(destFile)) {
                        byte[] buffer = new byte[32768];
                        int read;
                        while ((read = in.read(buffer)) != -1) {
                            fos.write(buffer, 0, read);
                        }
                        fos.flush();
                    }
                    savedPath = destFile.getAbsolutePath();
                    try {
                        MediaScannerConnection.scanFile(
                            getContext(),
                            new String[]{destFile.getAbsolutePath()},
                            new String[]{mimeType},
                            null
                        );
                    } catch (Exception ignored) {}
                }

                try {
                    tempFile.delete();
                } catch (Exception ignored) {}

                try {
                    File directFile = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), filename);
                    if (directFile.exists()) {
                        MediaScannerConnection.scanFile(getContext(), new String[]{directFile.getAbsolutePath()}, new String[]{mimeType}, null);
                    }
                } catch (Exception ignored) {}

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("path", savedPath != null ? savedPath : "Descargas/" + filename);
                ret.put("folder", "Descargas");
                ret.put("filename", filename);
                call.resolve(ret);
                return;
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("progress", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error al escribir bloque de copia en Descargas: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openGalleryApp(PluginCall call) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, "image/*");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            try {
                Intent fallback = Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_GALLERY);
                fallback.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception ex) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", ex.getMessage());
                call.resolve(ret);
            }
        }
    }

    /**
     * Borrado por lotes de archivos multimedia en Android MediaStore.
     * Soporta recibir items con { filename, size, lastModified, mimeType, uri }.
     */
    @PluginMethod
    public void deleteBatchFromGallery(PluginCall call) {
        JSArray itemsArray = call.getArray("items");
        if (itemsArray == null || itemsArray.length() == 0) {
            String filename = call.getString("filename");
            if (filename != null && !filename.isEmpty()) {
                itemsArray = new JSArray();
                JSObject single = new JSObject();
                single.put("filename", filename);
                if (call.getData().has("size")) single.put("size", call.getInt("size"));
                if (call.getData().has("lastModified")) single.put("lastModified", call.getLong("lastModified"));
                if (call.getData().has("uri")) single.put("uri", call.getString("uri"));
                itemsArray.put(single);
            } else {
                call.reject("Se requiere array 'items' o parámetro 'filename'");
                return;
            }
        }

        try {
            ContentResolver resolver = getContext().getContentResolver();
            List<Uri> urisToDelete = new ArrayList<>();

            Uri[] baseUris = new Uri[]{
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                MediaStore.Files.getContentUri("external")
            };

            int totalItems = itemsArray.length();
            for (int i = 0; i < totalItems; i++) {
                JSONObject item = itemsArray.getJSONObject(i);
                String uriStr = item.optString("uri", null);
                String filename = item.optString("filename", item.optString("name", null));
                long size = item.optLong("size", -1);
                long lastModified = item.optLong("lastModified", -1);
                String mimeType = item.optString("mimeType", null);

                if (uriStr != null && !uriStr.isEmpty() && uriStr.startsWith("content://")) {
                    Uri parsed = Uri.parse(uriStr);
                    Uri resolved = resolvePickedUriToMediaStore(getContext(), resolver, parsed, filename, size, null, mimeType);
                    Uri target = resolved != null ? resolved : parsed;
                    if (!urisToDelete.contains(target)) {
                        urisToDelete.add(target);
                    }
                    continue;
                }

                // 1. Búsqueda principal en MediaStore (flujo original que funciona en el teléfono del usuario)
                Uri foundUri = null;
                if (filename != null && !filename.isEmpty()) {
                    foundUri = findMediaStoreUri(resolver, baseUris, filename, size, lastModified);
                }

                // 2. Respaldo directo con el URI capturado al seleccionar la foto en onShowFileChooser
                // (Permite que funcione en teléfonos de familiares aunque tengan permisos limitados o nombres distintos)
                if (foundUri == null) {
                    foundUri = matchFromPickedUris(filename, size, i, totalItems);
                }

                // 3. Respaldo si el nombre del archivo es un ID numérico directo del Photo Picker (ej. "1000012345.jpg" o "186453.jpg")
                // y la consulta a MediaStore no devolvió filas por permisos de lectura restringidos en Android 13/14+
                if (foundUri == null && filename != null) {
                    String baseName = filename.contains(".") ? filename.substring(0, filename.lastIndexOf('.')) : filename;
                    if (baseName.startsWith("image:") || baseName.startsWith("video:") || baseName.startsWith("audio:")) {
                        baseName = baseName.substring(baseName.indexOf(':') + 1);
                    }
                    if (baseName.matches("\\d+")) {
                        try {
                            long numericId = Long.parseLong(baseName);
                            Uri colUri = getMediaCollectionUri(mimeType);
                            foundUri = ContentUris.withAppendedId(colUri, numericId);
                        } catch (Exception ignored) {}
                    }
                }

                if (foundUri != null && !urisToDelete.contains(foundUri)) {
                    urisToDelete.add(foundUri);
                }
            }

            if (urisToDelete.isEmpty()) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("matchedCount", 0);
                ret.put("requested", false);
                ret.put("message", "No se encontraron los archivos en MediaStore");
                call.resolve(ret);
                return;
            }

            // En Android 11+ (API 30+) MediaStore.createDeleteRequest pide permiso al usuario con el diálogo nativo del sistema
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                PendingIntent pi = null;
                try {
                    pi = MediaStore.createDeleteRequest(resolver, urisToDelete);
                } catch (Exception exBatch) {
                    // Si falla por mezcla de colecciones o MediaStore.Files, normalizar a colecciones de imágenes/videos
                    List<Uri> normalized = new ArrayList<>();
                    for (Uri u : urisToDelete) {
                        String s = u.toString();
                        if (s.contains("/images/") || s.contains("/video/") || s.contains("/audio/")) {
                            normalized.add(u);
                        } else {
                            String seg = u.getLastPathSegment();
                            if (seg != null && seg.matches("\\d+")) {
                                normalized.add(ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, Long.parseLong(seg)));
                            }
                        }
                    }
                    if (!normalized.isEmpty()) {
                        try {
                            pi = MediaStore.createDeleteRequest(resolver, normalized);
                        } catch (Exception ignored) {}
                    }
                    if (pi == null && !urisToDelete.isEmpty()) {
                        try {
                            List<Uri> single = new ArrayList<>();
                            single.add(urisToDelete.get(0));
                            pi = MediaStore.createDeleteRequest(resolver, single);
                        } catch (Exception ignored) {}
                    }
                }

                if (pi != null) {
                    IntentSender intentSender = pi.getIntentSender();
                    try {
                        getActivity().startIntentSenderForResult(intentSender, 2002, null, 0, 0, 0, null);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("requested", true);
                        ret.put("urisCount", urisToDelete.size());
                        call.resolve(ret);
                        return;
                    } catch (Exception exSender) {
                        call.reject("No se pudo iniciar el diálogo de eliminación: " + exSender.getMessage());
                        return;
                    }
                } else {
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("requested", false);
                    ret.put("message", "No se pudo crear la solicitud de eliminación de MediaStore");
                    call.resolve(ret);
                    return;
                }
            } else {
                // Android 10 (API 29) y anteriores: soportar tanto borrado directo como diálogo nativo RecoverableSecurityException
                int deletedCount = 0;
                IntentSender pendingRecoverableSender = null;

                for (Uri u : urisToDelete) {
                    try {
                        deletedCount += resolver.delete(u, null, null);
                    } catch (SecurityException se) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && se instanceof RecoverableSecurityException) {
                            RecoverableSecurityException rse = (RecoverableSecurityException) se;
                            pendingRecoverableSender = rse.getUserAction().getActionIntent().getIntentSender();
                            break;
                        }
                    } catch (Exception ex) {
                        // continuar
                    }
                }

                if (pendingRecoverableSender != null && getActivity() != null) {
                    try {
                        getActivity().startIntentSenderForResult(pendingRecoverableSender, 2002, null, 0, 0, 0, null);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("requested", true);
                        ret.put("urisCount", urisToDelete.size());
                        call.resolve(ret);
                        return;
                    } catch (Exception ignored) {}
                }

                JSObject ret = new JSObject();
                ret.put("success", deletedCount > 0);
                ret.put("requested", deletedCount > 0);
                ret.put("deletedCount", deletedCount);
                call.resolve(ret);
            }
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("requested", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void deleteFromGallery(PluginCall call) {
        deleteBatchFromGallery(call);
    }

    /**
     * Búsqueda flexible y robusta en MediaStore:
     * 1) Por Nombre y Tamaño exactos
     * 2) Por Nombre exacto (e insensible a mayúsculas/minúsculas mediante LIKE)
     * 3) Por ID numérico extraído de Photo Picker / DocumentsUI (ej: "image:12345" o "186453.jpg")
     * 4) Por prefijo del nombre
     * 5) Por Tamaño exacto (ordenado por más reciente)
     * 6) Por Fecha de modificación y Tamaño
     */
    private Uri findMediaStoreUri(ContentResolver resolver, Uri[] baseUris, String filename, long size, long lastModified) {
        for (Uri baseUri : baseUris) {
            String[] projection = new String[]{
                MediaStore.MediaColumns._ID,
                MediaStore.MediaColumns.DISPLAY_NAME,
                MediaStore.MediaColumns.SIZE,
                MediaStore.MediaColumns.DATE_MODIFIED
            };

            // 1. Intento por Nombre y Tamaño exactos
            if (size > 0 && filename != null && !filename.isEmpty()) {
                String selection = MediaStore.MediaColumns.DISPLAY_NAME + " = ? AND " + MediaStore.MediaColumns.SIZE + " = ?";
                String[] selectionArgs = new String[]{filename, String.valueOf(size)};
                try (Cursor cursor = resolver.query(baseUri, projection, selection, selectionArgs, MediaStore.MediaColumns._ID + " DESC")) {
                    if (cursor != null && cursor.moveToFirst()) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID));
                        return ContentUris.withAppendedId(baseUri, id);
                    }
                } catch (Exception ignored) {}
            }

            // 2. Intento por Nombre exacto (primero = directo compatible con todos los MediaProviders, luego LIKE insensible a mayúsculas)
            if (filename != null && !filename.isEmpty()) {
                String selectionExact = MediaStore.MediaColumns.DISPLAY_NAME + " = ?";
                String[] selectionArgsExact = new String[]{filename};
                try (Cursor cursor = resolver.query(baseUri, projection, selectionExact, selectionArgsExact, MediaStore.MediaColumns._ID + " DESC")) {
                    if (cursor != null && cursor.moveToFirst()) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID));
                        return ContentUris.withAppendedId(baseUri, id);
                    }
                } catch (Exception ignored) {}

                String selectionLikeExact = MediaStore.MediaColumns.DISPLAY_NAME + " LIKE ?";
                String[] selectionArgsLikeExact = new String[]{filename};
                try (Cursor cursor = resolver.query(baseUri, projection, selectionLikeExact, selectionArgsLikeExact, MediaStore.MediaColumns._ID + " DESC")) {
                    if (cursor != null && cursor.moveToFirst()) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID));
                        return ContentUris.withAppendedId(baseUri, id);
                    }
                } catch (Exception ignored) {}
            }

            // 3. Intento por ID numérico si el selector de fotos de Android devolvió "image:12345", "186453.jpg" o similar
            if (filename != null && filename.matches(".*\\d+.*")) {
                try {
                    java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\d+").matcher(filename);
                    while (matcher.find()) {
                        long numericId = Long.parseLong(matcher.group());
                        if (numericId <= 0) continue;
                        Uri candidate = ContentUris.withAppendedId(baseUri, numericId);
                        try (Cursor cursor = resolver.query(candidate, new String[]{MediaStore.MediaColumns._ID}, null, null, null)) {
                            if (cursor != null && cursor.moveToFirst()) {
                                return candidate;
                            }
                        } catch (Exception ignored) {}
                    }
                } catch (Exception ignored) {}
            }

            // 4. Intento sin extensión si fue cambiado por el selector (ej: "IMG_20261009_072505")
            if (filename != null && filename.contains(".")) {
                String baseName = filename.substring(0, filename.lastIndexOf('.'));
                if (baseName.length() >= 4) {
                    String selectionLike = MediaStore.MediaColumns.DISPLAY_NAME + " LIKE ?";
                    String[] selectionArgsLike = new String[]{baseName + "%"};
                    try (Cursor cursor = resolver.query(baseUri, projection, selectionLike, selectionArgsLike, MediaStore.MediaColumns._ID + " DESC")) {
                        if (cursor != null && cursor.moveToFirst()) {
                            long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID));
                            return ContentUris.withAppendedId(baseUri, id);
                        }
                    } catch (Exception ignored) {}
                }
            }

            // 5. Intento por tamaño exacto (si el tamaño es > 10KB), tomando el archivo más reciente
            if (size > 10240) {
                String selectionSize = MediaStore.MediaColumns.SIZE + " = ?";
                String[] selectionArgsSize = new String[]{String.valueOf(size)};
                try (Cursor cursor = resolver.query(baseUri, projection, selectionSize, selectionArgsSize, MediaStore.MediaColumns._ID + " DESC")) {
                    if (cursor != null && cursor.moveToFirst()) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID));
                        return ContentUris.withAppendedId(baseUri, id);
                    }
                } catch (Exception ignored) {}
            }

            // 6. Intento por fecha de modificación aproximada (en segundos)
            if (lastModified > 1000000000L) {
                long modSec = lastModified > 100000000000L ? (lastModified / 1000L) : lastModified;
                String selectionMod = MediaStore.MediaColumns.DATE_MODIFIED + " BETWEEN ? AND ?";
                String[] argsMod = new String[]{String.valueOf(modSec - 2), String.valueOf(modSec + 2)};
                try (Cursor cursor = resolver.query(baseUri, projection, selectionMod, argsMod, MediaStore.MediaColumns._ID + " DESC")) {
                    if (cursor != null && cursor.moveToFirst()) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID));
                        return ContentUris.withAppendedId(baseUri, id);
                    }
                } catch (Exception ignored) {}
            }
        }
        return null;
    }
}
