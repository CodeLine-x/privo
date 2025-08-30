
package com.kohzhirong.privo

import android.graphics.*
import android.util.Log
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions

import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.CompletableFuture

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

    private val faceDetector: com.google.mlkit.vision.face.FaceDetector by lazy {
        Log.d(TAG, "=== Initializing Face Detector ===")
        val minFaceSize = 0.1f
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
            .setMinFaceSize(minFaceSize)
            .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
            .build()
        
        Log.d(TAG, "Face detector options: minFaceSize=$minFaceSize")
        val detector = FaceDetection.getClient(options)
        Log.d(TAG, "Face detector created successfully")
        detector
    }



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

            val inputImage = InputImage.fromBitmap(bitmap, 0)
            Log.d(TAG, "InputImage created successfully")
            
            // Run face and text detection sequentially to avoid CompletableFuture issues
            Log.d(TAG, "Starting face and text detection...")
            
            // Face detection first
            faceDetector.process(inputImage)
                .addOnSuccessListener { faces ->
                    Log.d(TAG, "=== Face detection successful ===")
                    Log.d(TAG, "Found ${faces.size} faces")
                    
                    val faceCoordinates = faces.map { face ->
                        SensitiveCoordinate(
                            x = face.boundingBox.left.toDouble(),
                            y = face.boundingBox.top.toDouble(),
                            width = face.boundingBox.width().toDouble(),
                            height = face.boundingBox.height().toDouble(),
                            confidence = 0.9f, // ML Kit doesn't provide confidence scores
                            type = SensitiveContentType.FACE,
                            textContent = null
                        )
                    }
                    
                    if (faceCoordinates.isNotEmpty()) {
                        faceCoordinates.forEachIndexed { index, coord ->
                            Log.d(TAG, "Face $index: x=${coord.x}, y=${coord.y}, w=${coord.width}, h=${coord.height}")
                        }
                    }
                    
                                                 // Skip text detection for now - focus only on faces
                             Log.d(TAG, "=== Skipping text detection (focusing on faces only) ===")
                             
                             // Use only face coordinates for now
                             val allCoordinates = faceCoordinates
                            
                                                         Log.d(TAG, "=== All detections completed ===")
                             Log.d(TAG, "Total sensitive items found: ${allCoordinates.size}")
                             Log.d(TAG, "Faces: ${faceCoordinates.size}")
                            
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
                                                         } else {
                                 // No PII texts to extract since we're focusing on faces only
                                 Log.d(TAG, "Processing faces for blurring")
                                
                                                                 // Apply strong blur to all sensitive content
                                 Log.d(TAG, "=== Starting blur process for ${allCoordinates.size} face(s) ===")
                                 val blurredBitmap = blurSensitiveContent(bitmap, allCoordinates)
                                 Log.d(TAG, "=== Blur process completed, result: ${blurredBitmap != null} ===")
                                if (blurredBitmap != null) {
                                    val blurredImagePath = saveBitmapToFile(blurredBitmap, imageFile)
                                    if (blurredImagePath != null) {
                                        Log.d(TAG, "Blurred image saved to: $blurredImagePath")
                                        val result = Arguments.createMap().apply {
                                            putBoolean("success", true)
                                            putString("blurredImagePath", "file://$blurredImagePath")
                                            putInt("sensitiveItemsFound", allCoordinates.size)
                                            putInt("sensitiveItemsBlurred", allCoordinates.size)
                                                                                         putString("message", "Successfully blurred ${allCoordinates.size} face(s) for privacy")
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
                                                                                         putString("debugDetectedTexts", "")
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
                .addOnFailureListener { exception ->
                    Log.e(TAG, "=== Face detection failed ===")
                    Log.e(TAG, "Error message: ${exception.message}")
                    promise.reject("FACE_DETECTION_ERROR", "Face detection failed: ${exception.message}")
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



    // STRONG BLUR IMPLEMENTATION: Creates heavily blurred faces that are unrecognizable
    private fun blurSensitiveContent(originalBitmap: Bitmap, coordinates: List<SensitiveCoordinate>): Bitmap? {
        return try {
            Log.d(TAG, "=== Starting strong blur process ===")
            Log.d(TAG, "Original bitmap: ${originalBitmap.width} x ${originalBitmap.height}")
            Log.d(TAG, "Coordinates to blur: ${coordinates.size}")
            
            val blurredBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true)
            val canvas = Canvas(blurredBitmap)
            
            for ((index, coordinate) in coordinates.withIndex()) {
                Log.d(TAG, "Blurring item $index: type=${coordinate.type}, x=${coordinate.x}, y=${coordinate.y}")
                
                val x = coordinate.x.toFloat()
                val y = coordinate.y.toFloat()
                val width = coordinate.width.toFloat()
                val height = coordinate.height.toFloat()
                
                // Add extensive padding around face for complete coverage
                val padding = 80f
                val blurRect = RectF(
                    maxOf(0f, x - padding),
                    maxOf(0f, y - padding),
                    minOf(originalBitmap.width.toFloat(), x + width + padding),
                    minOf(originalBitmap.height.toFloat(), y + height + padding)
                )
                
                Log.d(TAG, "Blur rect: $blurRect")
                
                // Create blurred version of the region with multiple blur passes
                val regionBitmap = cropBitmap(originalBitmap, blurRect)
                if (regionBitmap != null) {
                    Log.d(TAG, "Region bitmap created: ${regionBitmap.width} x ${regionBitmap.height}")
                    val heavilyBlurredRegionBitmap = applyHeavyBlurToBitmap(regionBitmap)
                    if (heavilyBlurredRegionBitmap != null) {
                        // Draw heavily blurred region
                        val paint = Paint().apply {
                            isAntiAlias = true
                        }
                        
                        canvas.drawBitmap(heavilyBlurredRegionBitmap, blurRect.left, blurRect.top, paint)
                        Log.d(TAG, "Successfully applied heavy blur to region $index")
                    } else {
                        Log.e(TAG, "Failed to apply heavy blur to region $index")
                    }
                } else {
                    Log.e(TAG, "Failed to crop region $index")
                }
            }
            
            Log.d(TAG, "Heavy blur process completed successfully")
            blurredBitmap
        } catch (exception: Exception) {
            Log.e(TAG, "Error applying heavy blur to sensitive content", exception)
            null
        }
    }

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

    // HEAVY BLUR: Multiple blur passes to make faces completely unrecognizable
    private fun applyHeavyBlurToBitmap(bitmap: Bitmap): Bitmap? {
        return try {
            Log.d(TAG, "Applying heavy blur to bitmap: ${bitmap.width} x ${bitmap.height}")
            
            // Create a completely blurred version using multiple techniques
            val blurredBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true)
            val canvas = Canvas(blurredBitmap)
            
            // Method 1: Extreme blur with very high radius
            val extremeBlurPaint = Paint().apply {
                maskFilter = BlurMaskFilter(200f, BlurMaskFilter.Blur.NORMAL)
                color = android.graphics.Color.TRANSPARENT
            }
            
            // Apply extreme blur
            canvas.drawBitmap(bitmap, 0f, 0f, extremeBlurPaint)
            
            // Method 2: Additional blur passes for complete obfuscation
            val additionalBlurPaint = Paint().apply {
                maskFilter = BlurMaskFilter(300f, BlurMaskFilter.Blur.NORMAL)
                color = android.graphics.Color.TRANSPARENT
            }
            
            // Apply additional blur on top
            canvas.drawBitmap(blurredBitmap, 0f, 0f, additionalBlurPaint)
            
            // Method 3: Pixelate effect by scaling down and up
            val scaledDown = Bitmap.createScaledBitmap(blurredBitmap, 10, 10, true)
            val pixelated = Bitmap.createScaledBitmap(scaledDown, blurredBitmap.width, blurredBitmap.height, true)
            
            // Draw the pixelated version
            val pixelatePaint = Paint().apply {
                isAntiAlias = false
            }
            canvas.drawBitmap(pixelated, 0f, 0f, pixelatePaint)
            
            Log.d(TAG, "Heavy blur applied successfully with extreme blur + pixelation")
            blurredBitmap
        } catch (exception: Exception) {
            Log.e(TAG, "Error applying heavy blur to bitmap", exception)
            null
        }
    }

    // Save both full-size blurred image and lightweight thumbnail
    private fun saveBitmapToFile(bitmap: Bitmap, originalFile: File): String? {
        return try {
            val tempDir = reactApplicationContext.cacheDir
            val fileName = originalFile.nameWithoutExtension
            val fileExtension = originalFile.extension
            
            // Save full-size blurred image
            val blurredFileName = "${fileName}_blurred.$fileExtension"
            val blurredFile = File(tempDir, blurredFileName)
            
            Log.d(TAG, "Saving full-size blurred image to: ${blurredFile.absolutePath}")
            
            FileOutputStream(blurredFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
            }
            
            // Create and save lightweight thumbnail (300x300 max)
            val thumbnailBitmap = createThumbnail(bitmap, 300)
            val thumbnailFileName = "${fileName}_blurred_thumb.$fileExtension"
            val thumbnailFile = File(tempDir, thumbnailFileName)
            
            Log.d(TAG, "Saving thumbnail to: ${thumbnailFile.absolutePath}")
            
            FileOutputStream(thumbnailFile).use { out ->
                thumbnailBitmap.compress(Bitmap.CompressFormat.JPEG, 70, out)
            }
            
            Log.d(TAG, "Both full-size and thumbnail blurred images saved successfully")
            blurredFile.absolutePath
        } catch (exception: Exception) {
            Log.e(TAG, "Error saving bitmap to file", exception)
            null
        }
    }
    
    // Create lightweight thumbnail for faster loading
    private fun createThumbnail(bitmap: Bitmap, maxSize: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        val scale = minOf(maxSize.toFloat() / width, maxSize.toFloat() / height)
        val newWidth = (width * scale).toInt()
        val newHeight = (height * scale).toInt()
        
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
}
