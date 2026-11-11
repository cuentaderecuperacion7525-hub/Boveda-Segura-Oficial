package com.calculadora.boveda.privada;

import android.os.Environment;
import android.os.StatFs;
import android.view.WindowManager;
import androidx.fragment.app.FragmentActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "VaultSecurity")
public class VaultSecurityPlugin extends Plugin {

    @PluginMethod
    public void enableScreenshotBlock(PluginCall call) {
        FragmentActivity activity = (FragmentActivity) getActivity();
        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    activity.getWindow().setFlags(
                        WindowManager.LayoutParams.FLAG_SECURE,
                        WindowManager.LayoutParams.FLAG_SECURE
                    );
                }
            });
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void disableScreenshotBlock(PluginCall call) {
        FragmentActivity activity = (FragmentActivity) getActivity();
        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                }
            });
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void setSystemBarsTheme(PluginCall call) {
        final boolean isDark = Boolean.TRUE.equals(call.getBoolean("isDark", false));
        FragmentActivity activity = (FragmentActivity) getActivity();
        if (activity != null) {
            MainActivity.applySystemBarsTheme(activity, isDark);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getRealDeviceStorage(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            File path = Environment.getDataDirectory();
            StatFs stat = new StatFs(path.getPath());
            long blockSize = stat.getBlockSizeLong();
            long availableBlocks = stat.getAvailableBlocksLong();
            long totalBlocks = stat.getBlockCountLong();

            long freeBytes = availableBlocks * blockSize;
            long totalBytes = totalBlocks * blockSize;
            long usedBytes = Math.max(0, totalBytes - freeBytes);

            ret.put("success", true);
            ret.put("freeBytes", freeBytes);
            ret.put("totalBytes", totalBytes);
            ret.put("usedBytes", usedBytes);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("success", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }
}

