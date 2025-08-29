package com.kohzhirong.privoandroid

import android.util.Log
import com.facebook.react.bridge.*

class SimpleTestModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "SimpleTest"
    }

    init {
        Log.d("SimpleTest", "SimpleTestModule initialized")
    }

    override fun getName(): String {
        Log.d("SimpleTest", "getName() called, returning: $NAME")
        return NAME
    }

    @ReactMethod
    fun hello(promise: Promise) {
        Log.d("SimpleTest", "hello method called")
        try {
            promise.resolve("Hello from Android!")
        } catch (e: Exception) {
            Log.e("SimpleTest", "Error in hello", e)
            promise.reject("ERROR", "Error in hello: ${e.message}", e)
        }
    }
}
