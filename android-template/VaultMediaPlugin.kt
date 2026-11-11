package com.calculadora.boveda.privada

import android.app.Activity
import android.app.PendingIntent
import android.content.ContentUris
import android.content.IntentSender
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "VaultMedia")
class VaultMediaPlugin : Plugin() {

    private var pendingCall: PluginCall? = null

    private lateinit var deleteRequestLauncher: ActivityResultLauncher<IntentSenderRequest>

    override fun load() {
        super.load()

        // Registramos el launcher para escuchar la respuesta del diálogo de confirmación de Android
        deleteRequestLauncher = activity.registerForActivityResult(
            ActivityResultContracts.StartIntentSenderForResult()
        ) { result ->
            val call = pendingCall ?: return@registerForActivityResult
            if (result.resultCode == Activity.RESULT_OK) {
                val ret = JSObject()
                ret.put("success", true)
                ret.put("message", "Archivo eliminado exitosamente de la galería pública")
                call.resolve(ret)
            } else {
                val ret = JSObject()
                ret.put("success", false)
                ret.put("message", "El usuario rechazó la eliminación del archivo original")
                call.resolve(ret)
            }
            pendingCall = null
        }
    }

    @PluginMethod
    fun deleteFromGallery(call: PluginCall) {
        deleteBatchFromGallery(call)
    }

    @PluginMethod
    fun deleteBatchFromGallery(call: PluginCall) {
        val itemsArray = call.getArray("items")
        val urisToDelete = mutableListOf<Uri>()
        val resolver = context.contentResolver

        if (itemsArray != null && itemsArray.length() > 0) {
            for (i in 0 until itemsArray.length()) {
                val item = itemsArray.getJSONObject(i)
                val uriStr = item.optString("uri", null)
                val filename = item.optString("filename", item.optString("name", null))
                val size = item.optLong("size", -1L)

                if (!uriStr.isNullOrEmpty() && uriStr.startsWith("content://")) {
                    val parsed = Uri.parse(uriStr)
                    if (!urisToDelete.contains(parsed)) urisToDelete.add(parsed)
                    continue
                }

                if (!filename.isNullOrEmpty()) {
                    val found = findMediaStoreUriByFilename(filename, size)
                    if (found != null && !urisToDelete.contains(found)) {
                        urisToDelete.add(found)
                    }
                }
            }
        } else {
            val uriString = call.getString("uri")
            val filename = call.getString("filename")
            val size = call.getData().optLong("size", -1L)

            val targetUri: Uri? = if (!uriString.isNullOrEmpty()) {
                Uri.parse(uriString)
            } else if (!filename.isNullOrEmpty()) {
                findMediaStoreUriByFilename(filename, size)
            } else null

            if (targetUri != null) urisToDelete.add(targetUri)
        }

        if (urisToDelete.isEmpty()) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("requested", false)
            ret.put("message", "No se encontraron los archivos en MediaStore")
            call.resolve(ret)
            return
        }

        pendingCall = call

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Android 11+ (API 30+): Diálogo nativo obligatorio del sistema por lotes
                var pendingIntent: PendingIntent? = null
                try {
                    pendingIntent = MediaStore.createDeleteRequest(resolver, urisToDelete)
                } catch (exBatch: Exception) {
                    val imagesOnly = urisToDelete.filter { it.toString().contains("images") }
                    if (imagesOnly.isNotEmpty()) {
                        try {
                            pendingIntent = MediaStore.createDeleteRequest(resolver, imagesOnly)
                        } catch (_: Exception) {}
                    }
                }

                if (pendingIntent != null) {
                    val request = IntentSenderRequest.Builder(pendingIntent.intentSender).build()
                    deleteRequestLauncher.launch(request)
                    val ret = JSObject()
                    ret.put("success", true)
                    ret.put("requested", true)
                    ret.put("urisCount", urisToDelete.size)
                    call.resolve(ret)
                } else {
                    val ret = JSObject()
                    ret.put("success", false)
                    ret.put("requested", false)
                    call.resolve(ret)
                }
            } else {
                var rowsDeleted = 0
                for (u in urisToDelete) {
                    try {
                        rowsDeleted += resolver.delete(u, null, null)
                    } catch (_: Exception) {}
                }
                val ret = JSObject()
                ret.put("success", rowsDeleted > 0)
                ret.put("requested", true)
                call.resolve(ret)
                pendingCall = null
            }
        } catch (e: Exception) {
            call.reject("Error al solicitar eliminación en Android: ${e.message}", e)
            pendingCall = null
        }
    }

    /**
     * Busca la URI pública de la foto en MediaStore a partir de su nombre de archivo o tamaño
     */
    private fun findMediaStoreUriByFilename(filename: String, size: Long = -1L): Uri? {
        val projection = arrayOf(MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DISPLAY_NAME)
        val selection = "${MediaStore.MediaColumns.DISPLAY_NAME} = ? OR LOWER(${MediaStore.MediaColumns.DISPLAY_NAME}) = LOWER(?)"
        val selectionArgs = arrayOf(filename, filename)

        val collections = listOf(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
            MediaStore.Files.getContentUri("external")
        )

        for (collection in collections) {
            context.contentResolver.query(
                collection,
                projection,
                selection,
                selectionArgs,
                "${MediaStore.MediaColumns._ID} DESC"
            )?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
                    val id = cursor.getLong(idColumn)
                    return ContentUris.withAppendedId(collection, id)
                }
            }

            // Búsqueda por ID numérico en nombre de archivo (Photo Picker)
            if (filename.matches(Regex(".*\\d{3,}.*"))) {
                val match = Regex("\\d{3,}").find(filename)
                if (match != null) {
                    val numId = match.value.toLongOrNull()
                    if (numId != null) {
                        val candidate = ContentUris.withAppendedId(collection, numId)
                        try {
                            context.contentResolver.query(candidate, arrayOf(MediaStore.MediaColumns._ID), null, null, null)?.use { c ->
                                if (c.moveToFirst()) return candidate
                            }
                        } catch (_: Exception) {}
                    }
                }
            }

            // Búsqueda por tamaño si es mayor a 10KB
            if (size > 10240L) {
                val sizeSelection = "${MediaStore.MediaColumns.SIZE} = ?"
                val sizeArgs = arrayOf(size.toString())
                try {
                    context.contentResolver.query(
                        collection,
                        projection,
                        sizeSelection,
                        sizeArgs,
                        "${MediaStore.MediaColumns._ID} DESC"
                    )?.use { cursor ->
                        if (cursor.moveToFirst()) {
                            val idColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
                            val id = cursor.getLong(idColumn)
                            return ContentUris.withAppendedId(collection, id)
                        }
                    }
                } catch (_: Exception) {}
            }
        }
        return null
    }
}
