
package com.kohzhirong.privo

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import com.facebook.react.bridge.*

import java.io.File

class SensitiveScan(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "SensitiveScan"
        private const val MODULE_NAME = "SensitiveScan"
    }

    init {
        Log.d(TAG, "=== SensitiveScan module initialized ===")
        Log.d(TAG, "Module name: $MODULE_NAME")
        Log.d(TAG, "React context: $reactContext")
    }

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun scanAndBlurSensitiveContent(imagePath: String, promise: Promise) {
        Log.d(TAG, "=== scanAndBlurSensitiveContent called ===")
        Log.d(TAG, "Original imagePath: $imagePath")
        
        try {
            val processedPath = imagePath.replace("file://", "")
            Log.d(TAG, "Processed path: $processedPath")
            val imageFile = File(processedPath)
            
            Log.d(TAG, "File exists: ${imageFile.exists()}")
            Log.d(TAG, "File absolute path: ${imageFile.absolutePath}")
            Log.d(TAG, "File size: ${if (imageFile.exists()) imageFile.length() else "N/A"} bytes")
            
            if (!imageFile.exists()) {
                Log.e(TAG, "Image file does not exist: $processedPath")
                promise.reject("IMAGE_LOAD_ERROR", "Image file does not exist: $processedPath")
                return
            }

            val bitmap = loadBitmapFromFile(imageFile)
            Log.d(TAG, "Bitmap loaded: ${bitmap != null}")
            if (bitmap != null) {
                Log.d(TAG, "Bitmap dimensions: ${bitmap.width} x ${bitmap.height}")
                Log.d(TAG, "Bitmap config: ${bitmap.config}")
            }
            
            if (bitmap == null) {
                Log.e(TAG, "Failed to load image from file")
                promise.reject("IMAGE_LOAD_ERROR", "Failed to load image from file")
                return
            }

            // Step 1: Detect faces
            Log.d(TAG, "=== Step 1: Face Detection ===")
            ScanforFace.detectFaces(bitmap) { faceCoordinates ->
                Log.d(TAG, "Face detection completed: ${faceCoordinates.size} faces found")
                
                // Step 2: Detect all text
                Log.d(TAG, "=== Step 2: Text Detection ===")
                ScanforText.detectText(bitmap) { allTextCoordinates ->
                    Log.d(TAG, "Text detection completed: ${allTextCoordinates.size} text elements found")
                    
                    // Step 3: Filter text for PII
                    Log.d(TAG, "=== Step 3: PII Detection ===")
                    val piiCoordinates = PIIDetector.detectPIIFromCoordinates(allTextCoordinates)
                    Log.d(TAG, "PII detection completed: ${piiCoordinates.size} PII elements found")
                    
                    // Step 4: Combine all sensitive coordinates
                    val allSensitiveCoordinates = faceCoordinates + piiCoordinates
                    Log.d(TAG, "=== All detections completed ===")
                    Log.d(TAG, "Total sensitive items found: ${allSensitiveCoordinates.size}")
                    Log.d(TAG, "Faces: ${faceCoordinates.size}")
                    Log.d(TAG, "All text elements: ${allTextCoordinates.size}")
                    Log.d(TAG, "PII text elements: ${piiCoordinates.size}")
                    
                    // Extract debug information
                    val allDetectedTexts = allTextCoordinates.mapNotNull { it.textContent }
                    val piiTexts = piiCoordinates.mapNotNull { it.textContent }
                    
                    val debugTextInfo = buildString {
                        append("All detected texts: ${allDetectedTexts.joinToString(", ")}")
                        append(" | PII texts: ${piiTexts.joinToString(", ")}")
                    }
                    
                    if (allSensitiveCoordinates.isEmpty()) {
                        // No sensitive content found, return original image path
                        Log.d(TAG, "No sensitive content found, returning original image")
                        val result = Arguments.createMap().apply {
                            putBoolean("success", true)
                            putString("blurredImagePath", imagePath)
                            putInt("sensitiveItemsFound", 0)
                            putInt("sensitiveItemsBlurred", 0)
                            putString("message", "No sensitive content found to blur")
                            putArray("coordinates", Arguments.createArray())
                            putString("debugDetectedTexts", debugTextInfo)
                            putInt("faceCount", 0)
                            putInt("textCount", 0)
                            putInt("piiCount", 0)
                        }
                        promise.resolve(result)
                    } else {
                        // Step 5: Apply blur to sensitive content
                        Log.d(TAG, "=== Step 4: Image Augmentation (Blurring) ===")
                        val blurredBitmap = ImageAugmenting.blurSensitiveContent(bitmap, allSensitiveCoordinates)
                        
                        if (blurredBitmap != null) {
                            // Step 6: Save blurred image
                            val blurredImagePath = ImageAugmenting.saveBlurredImage(blurredBitmap, imageFile, reactApplicationContext.cacheDir)
                            
                            if (blurredImagePath != null) {
                                Log.d(TAG, "Blurred image saved to: $blurredImagePath")
                                
                                // Create appropriate success message
                                val message = when {
                                    faceCoordinates.isNotEmpty() && piiCoordinates.isNotEmpty() -> 
                                        "Successfully blurred ${faceCoordinates.size} face(s) and ${piiCoordinates.size} PII text element(s) for privacy"
                                    faceCoordinates.isNotEmpty() -> 
                                        "Successfully blurred ${faceCoordinates.size} face(s) for privacy"
                                    piiCoordinates.isNotEmpty() -> 
                                        "Successfully blurred ${piiCoordinates.size} PII text element(s) for privacy"
                                    else -> "No sensitive content found to blur"
                                }
                                
                                val result = Arguments.createMap().apply {
                                    putBoolean("success", true)
                                    putString("blurredImagePath", "file://$blurredImagePath")
                                    putInt("sensitiveItemsFound", allSensitiveCoordinates.size)
                                    putInt("sensitiveItemsBlurred", allSensitiveCoordinates.size)
                                    putString("message", message)
                                    putArray("coordinates", Arguments.createArray().apply {
                                        allSensitiveCoordinates.forEach { coordinate ->
                                            pushMap(Arguments.createMap().apply {
                                                putDouble("x", coordinate.x)
                                                putDouble("y", coordinate.y)
                                                putDouble("width", coordinate.width)
                                                putDouble("height", coordinate.height)
                                                putDouble("confidence", coordinate.confidence.toDouble())
                                                coordinate.textContent?.let { putString("textContent", it) }
                                            })
                                        }
                                    })
                                    putString("debugDetectedTexts", debugTextInfo)
                                    putInt("faceCount", faceCoordinates.size)
                                    putInt("textCount", allTextCoordinates.size)
                                    putInt("piiCount", piiCoordinates.size)
                                }
                                promise.resolve(result)
                            } else {
                                Log.e(TAG, "Failed to save blurred image")
                                promise.reject("SAVE_ERROR", "Failed to save blurred image")
                            }
                        } else {
                            Log.e(TAG, "Failed to apply blur to image")
                            promise.reject("BLUR_ERROR", "Failed to apply blur to image")
                        }
                    }
                }
            }
                
        } catch (exception: Exception) {
            Log.e(TAG, "Error in scanAndBlurSensitiveContent", exception)
            promise.reject("SCAN_ERROR", "Error scanning and blurring sensitive content: ${exception.message}")
        }
    }

    private fun loadBitmapFromFile(file: File): Bitmap? {
        return try {
            BitmapFactory.decodeFile(file.absolutePath)
        } catch (exception: Exception) {
            Log.e(TAG, "Error loading bitmap from file", exception)
            null
        }
    }




    
}
