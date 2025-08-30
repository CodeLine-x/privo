package com.kohzhirong.privo

import android.util.Log
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SensitiveScanPackage : ReactPackage {
    companion object {
        private const val TAG = "SensitiveScanPackage"
    }

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        Log.d(TAG, "=== Creating native modules ===")
        val modules = mutableListOf<NativeModule>()
        
        try {
            val sensitiveScanModule = SensitiveScan(reactContext)
            modules.add(sensitiveScanModule)
            Log.d(TAG, "SensitiveScan module created and added successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error creating SensitiveScan module", e)
        }
        
        Log.d(TAG, "Total modules created: ${modules.size}")
        return modules
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        Log.d(TAG, "=== Creating view managers ===")
        return emptyList()
    }
}
