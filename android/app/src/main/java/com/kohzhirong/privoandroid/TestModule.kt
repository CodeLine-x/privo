package com.kohzhirong.privoandroid

import android.util.Log
import com.facebook.react.bridge.*

class TestModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "TestModule"
    }

    init {
        Log.d("TestModule", "TestModule initialized")
    }

    override fun getName(): String {
        Log.d("TestModule", "getName() called, returning: $NAME")
        return NAME
    }

    @ReactMethod
    fun testMethod(promise: Promise) {
        Log.d("TestModule", "testMethod called")
        try {
            val result = "Android TestModule is working!"
            Log.d("TestModule", "Resolving with result: $result")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e("TestModule", "Error in testMethod", e)
            promise.reject("TEST_ERROR", "Error in testMethod: ${e.message}", e)
        }
    }
}
