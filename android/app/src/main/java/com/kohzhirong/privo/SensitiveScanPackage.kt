package com.kohzhirong.privo

import android.util.Log
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SensitiveScanPackage : ReactPackage {
    
    init {
        Log.d("SensitiveScanPackage", "=== SensitiveScanPackage initialized ===")
    }
    
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        Log.d("SensitiveScanPackage", "=== createNativeModules called ===")
        try {
            val sensitiveScan = SensitiveScan(reactContext)
            Log.d("SensitiveScanPackage", "SensitiveScan module created successfully")
            return listOf(sensitiveScan)
        } catch (e: Exception) {
            Log.e("SensitiveScanPackage", "Error creating SensitiveScan module", e)
            return emptyList()
        }
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
