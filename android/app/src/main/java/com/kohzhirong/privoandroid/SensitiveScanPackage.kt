package com.kohzhirong.privoandroid

import android.util.Log
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SensitiveScanPackage : ReactPackage {
    
    init {
        Log.d("SensitiveScan", "SensitiveScanPackage initialized")
    }
    
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        Log.d("SensitiveScan", "createNativeModules called")
        try {
            val module = SensitiveScanModule(reactContext)
            Log.d("SensitiveScan", "Created SensitiveScanModule: $module")
            Log.d("SensitiveScan", "SensitiveScanModule name: ${module.getName()}")
            return listOf(module)
        } catch (e: Exception) {
            Log.e("SensitiveScan", "Error creating SensitiveScanModule", e)
            return emptyList()
        }
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        Log.d("SensitiveScan", "createViewManagers called")
        return emptyList()
    }
}
