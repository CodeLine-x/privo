package com.kohzhirong.privoandroid

import android.util.Log
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SimpleTestPackage : ReactPackage {
    
    init {
        Log.d("SimpleTest", "SimpleTestPackage initialized")
    }
    
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        Log.d("SimpleTest", "createNativeModules called")
        try {
            val module = SimpleTestModule(reactContext)
            Log.d("SimpleTest", "Created SimpleTestModule: $module")
            Log.d("SimpleTest", "SimpleTestModule name: ${module.getName()}")
            return listOf(module)
        } catch (e: Exception) {
            Log.e("SimpleTest", "Error creating SimpleTestModule", e)
            return emptyList()
        }
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        Log.d("SimpleTest", "createViewManagers called")
        return emptyList()
    }
}
