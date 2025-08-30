package com.kohzhirong.privo

import android.graphics.Bitmap
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions

class ScanforFace {
    companion object {
        private const val TAG = "ScanforFace"
        
        // Face detector instance
        private val faceDetector by lazy {
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
        
        /**
         * Detect faces in an image and return coordinates for blurring
         */
        fun detectFaces(
            bitmap: Bitmap,
            completion: (List<SensitiveCoordinate>) -> Unit
        ) {
            Log.d(TAG, "=== Starting face detection ===")
            Log.d(TAG, "Bitmap dimensions: ${bitmap.width} x ${bitmap.height}")
            
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            
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
                    
                    Log.d(TAG, "Face detection completed. Found ${faceCoordinates.size} faces")
                    completion(faceCoordinates)
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "=== Face detection failed ===")
                    Log.e(TAG, "Error: ${exception.message}")
                    completion(emptyList())
                }
        }
        
        /**
         * Async version of face detection
         */
        suspend fun detectFacesAsync(bitmap: Bitmap): List<SensitiveCoordinate> {
            return kotlinx.coroutines.suspendCancellableCoroutine { continuation ->
                detectFaces(bitmap) { coordinates ->
                    continuation.resume(coordinates) {}
                }
            }
        }
    }
}
