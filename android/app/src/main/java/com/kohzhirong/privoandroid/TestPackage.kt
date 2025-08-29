package com.kohzhirong.privoandroid

import android.util.Log
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class TestPackage : ReactPackage {
    
    init {
        Log.d("TestPackage", "TestPackage initialized")
    }
    
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        Log.d("TestPackage", "createNativeModules called")
        try {
            val module = TestModule(reactContext)
            Log.d("TestPackage", "Created TestModule: $module")
            Log.d("TestPackage", "TestModule name: ${module.getName()}")
            return listOf(module)
        } catch (e: Exception) {
            Log.e("TestPackage", "Error creating TestModule", e)
            return emptyList()
        }
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        Log.d("TestPackage", "createViewManagers called")
        return emptyList()
    }
}
