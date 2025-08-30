package com.kohzhirong.privo

import android.graphics.*
import android.util.Log
import java.io.File
import java.io.FileOutputStream

class ImageAugmenting {
    companion object {
        private const val TAG = "ImageAugmenting"
        
        /**
         * Blur sensitive content in an image based on coordinates
         * Returns the blurred bitmap
         */
        fun blurSensitiveContent(originalBitmap: Bitmap, coordinates: List<SensitiveCoordinate>): Bitmap? {
            return try {
                Log.d(TAG, "=== Starting blur process ===")
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
                    
                    // Add extensive padding around sensitive content for complete coverage
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
                
                Log.d(TAG, "Blur process completed successfully")
                blurredBitmap
            } catch (exception: Exception) {
                Log.e(TAG, "Error applying blur to sensitive content", exception)
                null
            }
        }
        
        /**
         * Save blurred image to file and return the file path
         */
        fun saveBlurredImage(bitmap: Bitmap, originalFile: File, cacheDir: File): String? {
            return try {
                val fileName = originalFile.nameWithoutExtension
                val fileExtension = originalFile.extension
                
                // Save full-size blurred image only (no thumbnail)
                val blurredFileName = "${fileName}_blurred.$fileExtension"
                val blurredFile = File(cacheDir, blurredFileName)
                
                Log.d(TAG, "Saving blurred image to: ${blurredFile.absolutePath}")
                
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
        
        // HEAVY BLUR: Multiple blur passes to make content completely unrecognizable
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
        

    }
}
