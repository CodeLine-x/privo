package com.kohzhirong.privo

import android.graphics.Bitmap
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class ScanforText {
    companion object {
        private const val TAG = "ScanforText"
        
        // Text recognizer instance
        private val textRecognizer by lazy {
            Log.d(TAG, "=== Initializing Text Recognizer ===")
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            Log.d(TAG, "Text recognizer created successfully")
            recognizer
        }
        
        /**
         * Detect all text in an image and return coordinates
         * This returns ALL detected text, not just PII
         */
        fun detectText(
            bitmap: Bitmap,
            completion: (List<SensitiveCoordinate>) -> Unit
        ) {
            Log.d(TAG, "=== Starting text detection ===")
            Log.d(TAG, "Bitmap dimensions: ${bitmap.width} x ${bitmap.height}")
            
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            
            textRecognizer.process(inputImage)
                .addOnSuccessListener { visionText ->
                    Log.d(TAG, "=== Text recognition successful ===")
                    
                    // Extract all text blocks
                    val allTextCoordinates = mutableListOf<SensitiveCoordinate>()
                    
                    for (block in visionText.textBlocks) {
                        Log.d(TAG, "Processing text block: '${block.text}'")
                        
                        for (line in block.lines) {
                            Log.d(TAG, "Processing line: '${line.text}'")
                            
                            for (element in line.elements) {
                                val detectedText = element.text
                                Log.d(TAG, "Processing element: '$detectedText'")
                                
                                if (detectedText.isNotEmpty()) {
                                    val boundingBox = element.boundingBox
                                    if (boundingBox != null) {
                                        val coordinate = SensitiveCoordinate(
                                            x = boundingBox.left.toDouble(),
                                            y = boundingBox.top.toDouble(),
                                            width = boundingBox.width().toDouble(),
                                            height = boundingBox.height().toDouble(),
                                            confidence = 0.8f, // ML Kit doesn't provide confidence scores
                                            type = SensitiveContentType.TEXT,
                                            textContent = detectedText
                                        )
                                        
                                        Log.d(TAG, "Created coordinate for '$detectedText': x=${coordinate.x}, y=${coordinate.y}, w=${coordinate.width}, h=${coordinate.height}")
                                        allTextCoordinates.add(coordinate)
                                    }
                                }
                            }
                        }
                    }
                    
                    Log.d(TAG, "Total text elements found: ${allTextCoordinates.size}")
                    Log.d(TAG, "All detected texts: ${allTextCoordinates.mapNotNull { it.textContent }.joinToString(", ")}")
                    
                    completion(allTextCoordinates)
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "=== Text recognition failed ===")
                    Log.e(TAG, "Error: ${exception.message}")
                    completion(emptyList())
                }
        }
        
        /**
         * Async version of text detection
         * This mirrors the iOS ScanforText.detectTextAsync functionality
         */
        suspend fun detectTextAsync(bitmap: Bitmap): List<SensitiveCoordinate> {
            return kotlinx.coroutines.suspendCancellableCoroutine { continuation ->
                detectText(bitmap) { coordinates ->
                    continuation.resume(coordinates) {}
                }
            }
        }
        
        /**
         * Detect text and return both all text and PII text separately
         * Useful for debugging and detailed analysis
         */
        fun detectTextWithDetails(
            bitmap: Bitmap,
            completion: (allText: List<String>, piiText: List<String>, piiCoordinates: List<SensitiveCoordinate>) -> Unit
        ) {
            Log.d(TAG, "=== Starting detailed text detection ===")
            
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            
            textRecognizer.process(inputImage)
                .addOnSuccessListener { visionText ->
                    Log.d(TAG, "=== Detailed text recognition successful ===")
                    
                    val allTextCoordinates = mutableListOf<SensitiveCoordinate>()
                    val allDetectedTexts = mutableListOf<String>()
                    
                    for (block in visionText.textBlocks) {
                        for (line in block.lines) {
                            for (element in line.elements) {
                                val detectedText = element.text
                                if (detectedText.isNotEmpty()) {
                                    allDetectedTexts.add(detectedText)
                                    
                                    val boundingBox = element.boundingBox
                                    if (boundingBox != null) {
                                        val coordinate = SensitiveCoordinate(
                                            x = boundingBox.left.toDouble(),
                                            y = boundingBox.top.toDouble(),
                                            width = boundingBox.width().toDouble(),
                                            height = boundingBox.height().toDouble(),
                                            confidence = 0.8f,
                                            type = SensitiveContentType.TEXT,
                                            textContent = detectedText
                                        )
                                        allTextCoordinates.add(coordinate)
                                    }
                                }
                            }
                        }
                    }
                    
                    Log.d(TAG, "All detected texts: ${allDetectedTexts.joinToString(", ")}")
                    
                    // Use PIIDetector to identify sensitive text
                    val piiTexts = PIIDetector.detectPII(allDetectedTexts)
                    Log.d(TAG, "PII texts found: ${piiTexts.joinToString(", ")}")
                    
                    // Filter coordinates to only return PII text
                    val piiCoordinates = allTextCoordinates.filter { coordinate ->
                        coordinate.textContent?.let { textContent ->
                            piiTexts.contains(textContent)
                        } ?: false
                    }
                    
                    completion(allDetectedTexts, piiTexts, piiCoordinates)
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "=== Detailed text recognition failed ===")
                    Log.e(TAG, "Error: ${exception.message}")
                    completion(emptyList(), emptyList(), emptyList())
                }
        }
    }
}
