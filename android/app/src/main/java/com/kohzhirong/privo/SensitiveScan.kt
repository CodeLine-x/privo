
package com.kohzhirong.privo

import android.graphics.*
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import com.facebook.react.bridge.*

import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors

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
            // Handle React Native file URIs by removing file:// prefix if present
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

            // Run face and text detection and blurring on a background thread
            Executors.newSingleThreadExecutor().execute {
                val group = CountDownLatch(2)
                var faceCoordinates: List<SensitiveCoordinate> = emptyList()
                var textCoordinates: List<SensitiveCoordinate> = emptyList()
                
                // Face detection
                ScanforFace.detectFaces(bitmap) { faces ->
                    faceCoordinates = faces
                    group.countDown()
                }
                
                // Text detection (already filters for PII internally)
                ScanforText.detectText(bitmap) { text ->
                    textCoordinates = text
                    group.countDown()
                }
                
                // Wait for both detections to complete
                group.await()
                
                val allCoordinates = faceCoordinates + textCoordinates
                
                if (allCoordinates.isEmpty()) {
                    // No sensitive content found, return original image path
                    Log.d(TAG, "No sensitive content found, returning original image")
                    val result = Arguments.createMap().apply {
                        putBoolean("success", true)
                        putString("blurredImagePath", imagePath)
                        putInt("sensitiveItemsFound", 0)
                        putInt("sensitiveItemsBlurred", 0)
                        putString("message", "No sensitive content found to blur")
                        putArray("coordinates", Arguments.createArray())
                        putString("debugDetectedTexts", "")
                    }
                    promise.resolve(result)
                    return@execute
                }
                
                // Extract PII texts for debugging (these are already filtered by PIIDetector)
                val piiTextsDebug = allCoordinates
                    .mapNotNull { it.textContent }
                    .joinToString(", ")
                
                // Apply blur to all sensitive content
                val blurredBitmap = blurSensitiveContent(bitmap, allCoordinates)
                
                if (blurredBitmap != null) {
                    // Save blurred image to temporary location
                    val blurredImagePath = saveBlurredImage(blurredBitmap, imageFile, reactApplicationContext.cacheDir)
                    
                    if (blurredImagePath != null) {
                        Log.d(TAG, "Blurred image saved to: $blurredImagePath")
                        
                        val result = Arguments.createMap().apply {
                            putBoolean("success", true)
                            putString("blurredImagePath", "file://$blurredImagePath")
                            putInt("sensitiveItemsFound", allCoordinates.size)
                            putInt("sensitiveItemsBlurred", allCoordinates.size)
                            putString("message", "Successfully blurred ${allCoordinates.size} sensitive item(s)")
                            putArray("coordinates", Arguments.createArray().apply {
                                allCoordinates.forEach { coordinate ->
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
                            putString("debugDetectedTexts", piiTextsDebug)
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
    
    /**
     * Blur sensitive content in an image based on coordinates
     * This mimics the iOS blurSensitiveContent workflow
     */
    private fun blurSensitiveContent(originalBitmap: Bitmap, coordinates: List<SensitiveCoordinate>): Bitmap? {
        return try {
            Log.d(TAG, "=== Starting blur process ===")
            Log.d(TAG, "Original bitmap: ${originalBitmap.width} x ${originalBitmap.height}")
            Log.d(TAG, "Coordinates to blur: ${coordinates.size}")
            
            // Start with original image (mimics iOS UIGraphicsBeginImageContextWithOptions)
            val blurredBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true)
            val canvas = Canvas(blurredBitmap)
            
            // Apply blur to each sensitive content region
            for ((index, coordinate) in coordinates.withIndex()) {
                Log.d(TAG, "Blurring item $index: type=${coordinate.type}, x=${coordinate.x}, y=${coordinate.y}, width=${coordinate.width}, height=${coordinate.height}")
                Log.d(TAG, "Text content: '${coordinate.textContent}'")
                
                val x = coordinate.x.toFloat()
                val y = coordinate.y.toFloat()
                val width = coordinate.width.toFloat()
                val height = coordinate.height.toFloat()
                
                // Add padding around face for better blur coverage (mimics iOS padding: CGFloat = 30)
                val padding = 30f
                val blurRect = RectF(
                    maxOf(0f, x - padding),
                    maxOf(0f, y - padding),
                    minOf(originalBitmap.width.toFloat(), x + width + padding),
                    minOf(originalBitmap.height.toFloat(), y + height + padding)
                )
                
                Log.d(TAG, "Blur rect: $blurRect (bitmap size: ${originalBitmap.width}x${originalBitmap.height})")
                
                // Create blurred version of the region (mimics iOS cropImage and applyBlur)
                val regionBitmap = cropBitmap(originalBitmap, blurRect)
                if (regionBitmap != null) {
                    Log.d(TAG, "Region bitmap created: ${regionBitmap.width} x ${regionBitmap.height}")
                    val blurredRegionBitmap = applyBlur(regionBitmap)
                    if (blurredRegionBitmap != null) {
                        // Draw blurred region directly without clipping path for better compatibility
                        val paint = Paint().apply {
                            isAntiAlias = true
                        }
                        canvas.drawBitmap(blurredRegionBitmap, blurRect.left, blurRect.top, paint)
                        Log.d(TAG, "Successfully applied blur to region $index")
                    } else {
                        Log.e(TAG, "Failed to apply blur to region $index")
                    }
                } else {
                    Log.e(TAG, "Failed to crop region $index")
                }
            }
            
            Log.d(TAG, "Blur process completed successfully")
            blurredBitmap
        } catch (exception: Exception) {
            Log.e(TAG, "Error applying blur to sensitive content", exception)
            null
        }
    }
    
    /**
     * Crop bitmap to specified rectangle
     * This mimics the iOS cropImage function
     */
    private fun cropBitmap(bitmap: Bitmap, rect: RectF): Bitmap? {
        return try {
            Bitmap.createBitmap(
                bitmap,
                rect.left.toInt(),
                rect.top.toInt(),
                rect.width().toInt(),
                rect.height().toInt()
            )
        } catch (exception: Exception) {
            Log.e(TAG, "Error cropping bitmap", exception)
            null
        }
    }
    
    /**
     * Apply blur to bitmap using multiple techniques for strong blur effect
     * This mimics the iOS applyBlur function with CIGaussianBlur
     */
    private fun applyBlur(bitmap: Bitmap): Bitmap? {
        return try {
            Log.d(TAG, "Applying blur to bitmap: ${bitmap.width} x ${bitmap.height}")
            
            // Method 1: Extreme pixelation for complete privacy (most reliable)
            val pixelatedBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true)
            
            // Scale down to very small size and scale back up for extreme pixelation
            val scaledDown = Bitmap.createScaledBitmap(bitmap, 3, 3, true)
            val pixelated = Bitmap.createScaledBitmap(scaledDown, bitmap.width, bitmap.height, true)
            
            Log.d(TAG, "Pixelation applied: ${pixelated.width} x ${pixelated.height}")
            
            // Method 2: Add additional blur mask filter on top of pixelation
            val finalBitmap = pixelated.copy(Bitmap.Config.ARGB_8888, true)
            val canvas = Canvas(finalBitmap)
            
            val blurPaint = Paint().apply {
                maskFilter = BlurMaskFilter(30f, BlurMaskFilter.Blur.NORMAL)
                color = android.graphics.Color.TRANSPARENT
            }
            
            // Apply blur on top of pixelation
            canvas.drawBitmap(pixelated, 0f, 0f, blurPaint)
            
            Log.d(TAG, "Blur applied successfully with extreme pixelation + blur")
            finalBitmap
        } catch (exception: Exception) {
            Log.e(TAG, "Error applying blur to bitmap", exception)
            // Fallback: return original bitmap with a solid color overlay
            try {
                val fallbackBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true)
                val canvas = Canvas(fallbackBitmap)
                val paint = Paint().apply {
                    color = android.graphics.Color.BLACK
                    alpha = 180 // Semi-transparent black
                }
                canvas.drawRect(0f, 0f, bitmap.width.toFloat(), bitmap.height.toFloat(), paint)
                Log.d(TAG, "Fallback blur applied (solid overlay)")
                fallbackBitmap
            } catch (fallbackException: Exception) {
                Log.e(TAG, "Fallback blur also failed", fallbackException)
                null
            }
        }
    }
    
    /**
     * Save blurred image to file and return the file path
     * This mimics the iOS image saving workflow
     */
    private fun saveBlurredImage(bitmap: Bitmap, originalFile: File, cacheDir: File): String? {
        return try {
            val fileName = originalFile.nameWithoutExtension
            val fileExtension = originalFile.extension
            
            // Save blurred image (mimics iOS tempDir.appendingPathComponent)
            val blurredFileName = "${fileName}_blurred.$fileExtension"
            val blurredFile = File(cacheDir, blurredFileName)
            
            Log.d(TAG, "Saving blurred image to: ${blurredFile.absolutePath}")
            
            // Save with high quality (mimics iOS compressionQuality: 0.9)
            FileOutputStream(blurredFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
            }
            
            Log.d(TAG, "Blurred image saved successfully")
            blurredFile.absolutePath
        } catch (exception: Exception) {
            Log.e(TAG, "Error saving blurred image to file", exception)
            null
        }
    }
}
