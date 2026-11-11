# Guía Paso a Paso: Compilar la Bóveda en un APK Nativo de Android

Esta guía te muestra cómo empaquetar esta aplicación en un archivo **`.apk` nativo de Android** para que cuando resguardes fotos o videos, el sistema operativo Android dispare automáticamente la solicitud de eliminación nativa (`MediaStore.createDeleteRequest`) y las fotos desaparezcan por completo de la galería pública de tu teléfono.

---

## Requisitos Previos

1. **Node.js** (versión 18 o superior) instalado en tu computadora.
2. **Android Studio** (descargable gratis desde [developer.android.com/studio](https://developer.android.com/studio)).

---

## Paso 1: Generar la compilación web optimizada

Abre la terminal en la raíz de este proyecto y ejecuta:

```bash
npm run build
```

Esto creará la carpeta `dist/` con todos los archivos web listos para Android.

---

## Paso 2: Inicializar el proyecto Android con Capacitor

Ejecuta el siguiente comando para generar la carpeta nativa `android/`:

```bash
npx cap add android
```

---

## Paso 3: Copiar los archivos nativos de la Bóveda

Copia los archivos que dejamos listos en `android-template/`:

1. **`android-template/VaultMediaPlugin.kt`**  
   Cópialo a:  
   `android/app/src/main/java/com/calculadora/boveda/privada/VaultMediaPlugin.kt`

2. **`android-template/VaultBiometricPlugin.kt`** *(Lector de huella nativo BiometricPrompt 100% offline)*  
   Cópialo a:  
   `android/app/src/main/java/com/calculadora/boveda/privada/VaultBiometricPlugin.kt`

3. **`android-template/MainActivity.kt`** *(Bloqueo de capturas FLAG_SECURE + registro de plugins)*  
   Reemplaza el archivo en:  
   `android/app/src/main/java/com/calculadora/boveda/privada/MainActivity.kt`

4. **`android-template/AndroidManifest.xml`**  
   Reemplaza los permisos en:  
   `android/app/src/main/AndroidManifest.xml`

---

## Paso 4: Sincronizar el proyecto nativo

Cada vez que hagas cambios en el código, sincroniza con Android ejecutando:

```bash
npx cap sync android
```

---

## Paso 5: Abrir en Android Studio y Generar el APK

Abre el proyecto directamente en Android Studio con este comando:

```bash
npx cap open android
```

Una vez abierto Android Studio:
1. Espera a que termine la sincronización inicial de Gradle (tardará unos segundos).
2. En el menú superior de Android Studio, ve a:  
   **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Al finalizar, aparecerá una notificación abajo a la derecha: *"APK(s) generated successfully"*. Haz clic en **locate**.
4. ¡Listo! Ahí tendrás tu archivo **`app-debug.apk`** listo para pasarlo por WhatsApp, Cable USB o Drive e instalarlo directamente en tu teléfono Android.

---

## ¿Cómo funciona el borrado en el APK generado?

1. El usuario selecciona fotos de su galería.
2. La app las cifra con **AES-256** en el almacenamiento interno privado (`filesDir`).
3. La app llama al plugin nativo `VaultMediaPlugin.kt`.
4. Android muestra la ventana oficial del sistema:  
   **"¿Permitir a Calculadora mover esta foto a la papelera o eliminarla?"**
5. Al presionar **Permitir**, Android borra físicamente la foto original de la galería pública y refresca `MediaStore` inmediatamente.

---

## Solución a "Problemas con el paquete de instalación" o "Error al analizar el paquete"

Si al instalar el APK en tu teléfono Android aparece un mensaje como *"Se ha producido un problema al analizar el paquete"* o *"No se puede instalar la aplicación"*:

1. **Desinstala la versión anterior**: Si tenías instalada la versión web PWA / WebAPK desde Chrome o un APK generado anteriormente, Android bloquea la instalación porque las firmas digitales del instalador no coinciden (conflicto de paquete). Desinstala la app anterior y luego instala el nuevo APK.
2. **Permitir orígenes desconocidos**: Asegúrate de que la app desde donde abres el archivo APK (Google Drive, WhatsApp, Archivos/Files) tenga activado el permiso *"Instalar aplicaciones de fuentes desconocidas"* en los Ajustes de Android.
3. **Compatibilidad optimizada**: El proyecto está configurado con **Java 21 (LTS)** y Capacitor 8 (Target SDK 35), compatible con dispositivos Android desde Android 7.0 (API 24) hasta Android 15.

