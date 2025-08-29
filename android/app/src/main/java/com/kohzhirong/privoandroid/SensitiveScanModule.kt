package com.kohzhirong.privoandroid

import android.util.Log
import com.facebook.react.bridge.*

class SensitiveScanModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "SensitiveScan"
    }

    init {
        Log.d("SensitiveScan", "SensitiveScanModule initialized")
    }

    override fun getName(): String {
        Log.d("SensitiveScan", "getName() called, returning: $NAME")
        return NAME
    }

    @ReactMethod
    fun detectFaces(imagePath: String, promise: Promise) {
        Log.d("SensitiveScan", "Android detectFaces called with path: $imagePath")
        
        try {
            // Create WritableMap for the result
            val result = Arguments.createMap().apply {
                putBoolean("hasFaces", true)
                putInt("faceCount", 1)
                putString("message", "Android SensitiveScan module is working!")
                
                // Create faces array
                val faces = Arguments.createArray()
                val face = Arguments.createMap().apply {
                    putDouble("x", 100.0)
                    putDouble("y", 100.0)
                    putDouble("width", 200.0)
                    putDouble("height", 200.0)
                    putDouble("confidence", 0.9)
                }
                faces.pushMap(face)
                putArray("faces", faces)
            }
            
            Log.d("SensitiveScan", "Returning test result")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e("SensitiveScan", "Error in detectFaces", e)
            promise.reject("DETECTION_ERROR", "Error detecting faces: ${e.message}", e)
        }
    }

    @ReactMethod
    fun blurFacesInImage(imagePath: String, promise: Promise) {
        Log.d("SensitiveScan", "Android blurFacesInImage called with path: $imagePath")
        
        try {
            // Create WritableMap for the result
            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putString("blurredImagePath", imagePath)
                putInt("facesBlurred", 1)
                putString("message", "Android SensitiveScan blur module is working!")
            }
            
            Log.d("SensitiveScan", "Returning test blur result")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e("SensitiveScan", "Error in blurFacesInImage", e)
            promise.reject("BLUR_ERROR", "Error blurring faces: ${e.message}", e)
        }
    }
}
